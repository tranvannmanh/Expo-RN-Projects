package expo.modules.pdftools

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import java.io.File
import java.io.IOException
import kotlin.math.roundToInt

private const val JPEG_QUALITY = 85
/** Upper bound for viewer pages: 2000 px ≈ 170 dpi on A4, sharp at 2× zoom on most phones. */
private const val MAX_PREVIEW_WIDTH = 2000

/**
 * Renders pages for the continuous viewer. Keeps the last PDF open between calls: the viewer
 * asks for many pages of the same file, and reopening the document for each page would repeat
 * the parsing work. Not thread-safe — callers serialise access (PdfToolsModule.previewLock).
 */
internal object PdfPreviewRenderer {
  private var openPath: String? = null
  private var descriptor: ParcelFileDescriptor? = null
  private var renderer: PdfRenderer? = null

  /** Page sizes in PDF points ([width, height]) without rendering anything. */
  fun pageSizes(input: File): List<List<Float>> = guard(input) {
    val doc = rendererFor(input)
    (0 until doc.pageCount).map { index ->
      doc.openPage(index).use { listOf(it.width.toFloat(), it.height.toFloat()) }
    }
  }

  /** Renders a 0-based page to [output] at [widthPx]; an existing output is reused. */
  fun render(input: File, pageIndex: Int, output: File, widthPx: Int) {
    if (output.isFile && output.length() > 0L) return
    guard(input) {
      val doc = rendererFor(input)
      if (pageIndex !in 0 until doc.pageCount) {
        throw PdfToolsException(PdfToolsErrorCode.INVALID_PAGE_RANGE, "Page ${pageIndex + 1} is outside 1-${doc.pageCount}")
      }
      output.parentFile?.mkdirs()
      doc.openPage(pageIndex).use { page ->
        val width = widthPx.coerceIn(1, MAX_PREVIEW_WIDTH)
        val height = (width * page.height / page.width.toFloat()).roundToInt().coerceAtLeast(1)
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val temp = File(output.parentFile, output.name + ".part")
        try {
          bitmap.eraseColor(Color.WHITE)
          page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
          temp.outputStream().use { bitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, it) }
          if (!temp.renameTo(output)) throw IOException("Unable to write ${output.name}")
        } finally {
          temp.delete()
          bitmap.recycle()
        }
      }
    }
  }

  fun close() {
    runCatching { renderer?.close() }
    runCatching { descriptor?.close() }
    renderer = null
    descriptor = null
    openPath = null
  }

  private fun rendererFor(input: File): PdfRenderer {
    val path = input.canonicalPath
    renderer?.takeIf { openPath == path }?.let { return it }
    close()
    val fd = ParcelFileDescriptor.open(input, ParcelFileDescriptor.MODE_READ_ONLY)
    try {
      val doc = PdfRenderer(fd)
      if (doc.pageCount == 0) {
        doc.close()
        throw PdfToolsException(PdfToolsErrorCode.PDF_INVALID, "PDF has no pages")
      }
      descriptor = fd
      renderer = doc
      openPath = path
      return doc
    } catch (error: Throwable) {
      fd.close()
      throw error
    }
  }

  private inline fun <T> guard(input: File, block: () -> T): T =
    try {
      block()
    } catch (error: PdfToolsException) {
      throw error
    } catch (error: SecurityException) {
      close()
      throw PdfToolsException(PdfToolsErrorCode.PDF_PASSWORD_PROTECTED, "${input.name} is protected", error)
    } catch (error: OutOfMemoryError) {
      throw PdfToolsException(PdfToolsErrorCode.PDF_OPERATION_ERROR, "Not enough memory to render ${input.name}", error)
    } catch (error: IOException) {
      throw PdfIo.mapWriteError(error)
    } catch (error: Exception) {
      // A broken renderer must not be reused for the next page.
      close()
      throw PdfToolsException(PdfToolsErrorCode.PDF_INVALID, "Cannot render ${input.name}", error)
    }
}
