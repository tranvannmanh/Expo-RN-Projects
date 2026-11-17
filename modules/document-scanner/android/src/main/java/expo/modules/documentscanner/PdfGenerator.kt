package expo.modules.documentscanner

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FilterOutputStream
import java.io.IOException
import java.io.OutputStream
import java.util.Locale
import kotlin.math.roundToInt

/** A4 width in PDF points (1/72 inch). Page height follows each image's aspect ratio. */
private const val PAGE_WIDTH_PT = 595
private const val TEMP_SUFFIX = ".part"

/** Used only when a page is not an embeddable JPEG and must be re-encoded. */
private const val FALLBACK_JPEG_QUALITY = 90
private const val FALLBACK_MAX_EDGE_PX = 3000

/**
 * Builds an image-only PDF by embedding each page's JPEG bytes unchanged (/DCTDecode).
 *
 * Why not android.graphics.pdf.PdfDocument: it re-compresses bitmaps losslessly (FlateDecode),
 * measured at ~11 MB per 3000 px page. Embedding the JPEG keeps the PDF ≈ the sum of the page
 * JPEGs, needs no bitmap decoding (low memory) and preserves ML Kit's output quality.
 */
internal object PdfGenerator {

  fun generate(images: List<File>, output: File) {
    if (images.isEmpty()) {
      throw DocumentScannerException(ScannerErrorCode.PDF_EXPORT_ERROR, "A PDF needs at least one page")
    }
    images.firstOrNull { !it.isFile }?.let {
      throw DocumentScannerException(ScannerErrorCode.FILE_NOT_FOUND, "Page image missing: ${it.name}")
    }

    val temp = File(output.parentFile, output.name + TEMP_SUFFIX)
    try {
      temp.outputStream().buffered().use { stream -> PdfWriter(stream).write(images.map(::toPdfImage)) }
      if (output.exists() && !output.delete()) throw IOException("Unable to replace ${output.name}")
      if (!temp.renameTo(output)) throw IOException("Unable to finalize ${output.name}")
    } catch (error: DocumentScannerException) {
      throw error
    } catch (error: OutOfMemoryError) {
      throw DocumentScannerException(ScannerErrorCode.PDF_EXPORT_ERROR, "Not enough memory to build the PDF", error)
    } catch (error: Exception) {
      val noSpace = error is IOException &&
        (error.message?.contains("ENOSPC") == true || error.message?.contains("No space left") == true)
      val code = if (noSpace) ScannerErrorCode.STORAGE_FULL else ScannerErrorCode.PDF_EXPORT_ERROR
      throw DocumentScannerException(code, error.message ?: "Failed to build PDF", error)
    } finally {
      if (temp.exists()) temp.delete()
    }
  }

  private fun toPdfImage(file: File): PdfImage {
    JpegInfo.read(file)?.takeIf { it.components == 1 || it.components == 3 }?.let { info ->
      return PdfImage(info, JpegSource.FromFile(file))
    }
    // Not a baseline/progressive gray/RGB JPEG (e.g. CMYK or another format): re-encode.
    val bytes = reencodeAsJpeg(file)
    val info = JpegInfo.read(bytes)
      ?: throw DocumentScannerException(ScannerErrorCode.PDF_EXPORT_ERROR, "Unreadable page image: ${file.name}")
    return PdfImage(info, JpegSource.FromBytes(bytes))
  }

  private fun reencodeAsJpeg(file: File): ByteArray {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(file.path, bounds)
    var sample = 1
    while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= FALLBACK_MAX_EDGE_PX) sample *= 2
    val bitmap = BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply { inSampleSize = sample })
      ?: throw DocumentScannerException(ScannerErrorCode.PDF_EXPORT_ERROR, "Unreadable page image: ${file.name}")
    try {
      return ByteArrayOutputStream().also { bitmap.compress(Bitmap.CompressFormat.JPEG, FALLBACK_JPEG_QUALITY, it) }
        .toByteArray()
    } finally {
      bitmap.recycle()
    }
  }
}

private sealed interface JpegSource {
  val length: Long
  fun copyTo(out: OutputStream)

  class FromFile(private val file: File) : JpegSource {
    override val length get() = file.length()
    override fun copyTo(out: OutputStream) { file.inputStream().use { it.copyTo(out) } }
  }

  class FromBytes(private val bytes: ByteArray) : JpegSource {
    override val length get() = bytes.size.toLong()
    override fun copyTo(out: OutputStream) = out.write(bytes)
  }
}

private class PdfImage(val info: JpegInfo, val source: JpegSource)

/** Width, height and component count from a JPEG's SOF segment (no pixel decoding). */
internal data class JpegInfo(val width: Int, val height: Int, val components: Int) {
  companion object {
    fun read(file: File): JpegInfo? = file.inputStream().buffered().use { parse(it.readNBytesCompat(MAX_HEADER_SCAN)) }
    fun read(bytes: ByteArray): JpegInfo? = parse(bytes)

    /** Metadata (EXIF, ICC) precedes SOF; 1 MB is far more than any real header needs. */
    private const val MAX_HEADER_SCAN = 1 shl 20

    private fun parse(data: ByteArray): JpegInfo? {
      if (data.size < 4 || data.u8(0) != 0xFF || data.u8(1) != 0xD8) return null
      var i = 2
      while (i + 9 < data.size) {
        if (data.u8(i) != 0xFF) return null
        val marker = data.u8(i + 1)
        if (marker == 0xFF) { i++; continue }
        val length = (data.u8(i + 2) shl 8) or data.u8(i + 3)
        // SOF0..SOF15, excluding DHT (C4), JPG (C8) and DAC (CC).
        if (marker in 0xC0..0xCF && marker != 0xC4 && marker != 0xC8 && marker != 0xCC) {
          val height = (data.u8(i + 5) shl 8) or data.u8(i + 6)
          val width = (data.u8(i + 7) shl 8) or data.u8(i + 8)
          val components = data.u8(i + 9)
          return if (width > 0 && height > 0) JpegInfo(width, height, components) else null
        }
        i += 2 + length
      }
      return null
    }

    private fun ByteArray.u8(index: Int) = this[index].toInt() and 0xFF

    private fun java.io.InputStream.readNBytesCompat(max: Int): ByteArray {
      val buffer = ByteArray(max)
      var read = 0
      while (read < max) {
        val n = read(buffer, read, max - read)
        if (n < 0) break
        read += n
      }
      return buffer.copyOf(read)
    }
  }
}

/** Minimal PDF 1.4 writer: one full-page image per page. */
private class PdfWriter(output: OutputStream) {
  private val out = CountingOutputStream(output)
  private val offsets = mutableListOf<Long>()

  fun write(images: List<PdfImage>) {
    val pageCount = images.size
    // Object numbers: 1 catalog, 2 pages, then per page: page, contents, image.
    fun pageObj(i: Int) = 3 + i * 3
    fun contentObj(i: Int) = 4 + i * 3
    fun imageObj(i: Int) = 5 + i * 3

    text("%PDF-1.4\n%âãÏÓ\n")
    obj(1) { text("<< /Type /Catalog /Pages 2 0 R >>") }
    obj(2) {
      val kids = (0 until pageCount).joinToString(" ") { "${pageObj(it)} 0 R" }
      text("<< /Type /Pages /Kids [$kids] /Count $pageCount >>")
    }

    images.forEachIndexed { index, image ->
      val width = PAGE_WIDTH_PT
      val height = (PAGE_WIDTH_PT * image.info.height / image.info.width.toFloat()).roundToInt().coerceAtLeast(1)

      obj(pageObj(index)) {
        text(
          "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 $width $height] " +
            "/Resources << /XObject << /Im0 ${imageObj(index)} 0 R >> >> /Contents ${contentObj(index)} 0 R >>",
        )
      }
      val content = "q $width 0 0 $height 0 0 cm /Im0 Do Q\n"
      obj(contentObj(index)) {
        text("<< /Length ${content.length} >>\nstream\n$content\nendstream")
      }
      obj(imageObj(index)) {
        val colorSpace = if (image.info.components == 1) "/DeviceGray" else "/DeviceRGB"
        text(
          "<< /Type /XObject /Subtype /Image /Width ${image.info.width} /Height ${image.info.height} " +
            "/ColorSpace $colorSpace /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.source.length} >>\nstream\n",
        )
        image.source.copyTo(out)
        text("\nendstream")
      }
    }

    val xrefOffset = out.count
    val size = offsets.size + 1
    text("xref\n0 $size\n0000000000 65535 f \n")
    offsets.forEach { text(String.format(Locale.US, "%010d 00000 n \n", it)) }
    text("trailer\n<< /Size $size /Root 1 0 R >>\nstartxref\n$xrefOffset\n%%EOF\n")
    out.flush()
  }

  private inline fun obj(number: Int, body: () -> Unit) {
    check(number == offsets.size + 1) { "PDF objects must be written in order" }
    offsets += out.count
    text("$number 0 obj\n")
    body()
    text("\nendobj\n")
  }

  private fun text(value: String) = out.write(value.toByteArray(Charsets.ISO_8859_1))
}

private class CountingOutputStream(stream: OutputStream) : FilterOutputStream(stream) {
  var count = 0L
    private set

  override fun write(b: Int) {
    out.write(b)
    count++
  }

  override fun write(b: ByteArray, off: Int, len: Int) {
    out.write(b, off, len)
    count += len
  }
}
