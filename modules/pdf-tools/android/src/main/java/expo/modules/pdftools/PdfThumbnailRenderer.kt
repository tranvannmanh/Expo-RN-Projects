package expo.modules.pdftools

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import java.io.File
import kotlin.math.roundToInt

private const val JPEG_QUALITY = 85
/** Thumbnails are small; this only guards against absurd requests. */
private const val MAX_RENDER_WIDTH = 1080

/** First-page thumbnails via the platform PdfRenderer (viewer pages: PdfPreviewRenderer). */
internal object PdfThumbnailRenderer {

  /** First page only (list/detail thumbnails). */
  fun render(input: File, output: File, widthPx: Int) {
    open(input) { renderer -> renderPage(renderer, 0, output, widthPx) }
  }

  private fun <T> open(input: File, block: (PdfRenderer) -> T): T =
    try {
      ParcelFileDescriptor.open(input, ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
        PdfRenderer(descriptor).use { renderer ->
          if (renderer.pageCount == 0) throw PdfToolsException(PdfToolsErrorCode.PDF_INVALID, "PDF has no pages")
          block(renderer)
        }
      }
    } catch (error: PdfToolsException) {
      throw error
    } catch (error: SecurityException) {
      throw PdfToolsException(PdfToolsErrorCode.PDF_PASSWORD_PROTECTED, "${input.name} is protected", error)
    } catch (error: OutOfMemoryError) {
      throw PdfToolsException(PdfToolsErrorCode.PDF_OPERATION_ERROR, "Not enough memory to render ${input.name}", error)
    } catch (error: Exception) {
      throw PdfToolsException(PdfToolsErrorCode.PDF_INVALID, "Cannot render ${input.name}", error)
    }

  private fun renderPage(renderer: PdfRenderer, index: Int, output: File, widthPx: Int) {
    val width = widthPx.coerceIn(1, MAX_RENDER_WIDTH)
    renderer.openPage(index).use { page ->
      val height = (width * page.height / page.width.toFloat()).roundToInt().coerceAtLeast(1)
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      val temp = File(output.parentFile, output.name + ".part")
      try {
        bitmap.eraseColor(Color.WHITE)
        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        temp.outputStream().use { bitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, it) }
        if (!temp.renameTo(output)) throw java.io.IOException("Unable to write ${output.name}")
      } catch (error: Exception) {
        output.delete()
        throw PdfIo.mapWriteError(error)
      } finally {
        temp.delete()
        bitmap.recycle()
      }
    }
  }
}
