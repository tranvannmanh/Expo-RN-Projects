package expo.modules.pdftools

import com.tom_roush.pdfbox.io.MemoryUsageSetting
import com.tom_roush.pdfbox.multipdf.PDFMergerUtility
import com.tom_roush.pdfbox.pdmodel.PDDocument
import java.io.File
import java.io.IOException

internal data class PdfFileResult(val file: File, val pageCount: Int)

/** Merge and split. Both keep pages as-is (text, vectors, fonts and links survive). */
internal object PdfPageOperations {

  fun pageCount(file: File): Int = PdfIo.use(file) { it.numberOfPages }

  fun merge(inputs: List<File>, output: File): PdfFileResult {
    if (inputs.size < 2) {
      throw PdfToolsException(PdfToolsErrorCode.PDF_OPERATION_ERROR, "Merging needs at least two PDFs")
    }
    // Validate every source first so a protected or broken file gives a precise error code.
    val totalPages = inputs.sumOf { pageCount(it) }

    val temp = File(output.parentFile, output.name + ".part")
    try {
      PDFMergerUtility().apply {
        inputs.forEach { addSource(it) }
        destinationFileName = temp.path
        mergeDocuments(MemoryUsageSetting.setupTempFileOnly())
      }
      if (output.exists() && !output.delete()) throw IOException("Unable to replace ${output.name}")
      if (!temp.renameTo(output)) throw IOException("Unable to finalize ${output.name}")
    } catch (error: Exception) {
      throw PdfIo.mapWriteError(error)
    } finally {
      if (temp.exists()) temp.delete()
    }
    return PdfFileResult(output, totalPages)
  }

  /**
   * Writes one PDF per range. Ranges are 1-based and inclusive; outputs[i] receives ranges[i].
   * If any output fails, every file written by this call is removed.
   */
  fun split(input: File, ranges: List<IntRange>, outputs: List<File>): List<PdfFileResult> {
    if (ranges.isEmpty() || ranges.size != outputs.size) {
      throw PdfToolsException(PdfToolsErrorCode.INVALID_PAGE_RANGE, "Each page range needs exactly one output")
    }
    val written = mutableListOf<PdfFileResult>()
    try {
      PdfIo.use(input) { source ->
        val pageCount = source.numberOfPages
        ranges.firstOrNull { it.first < 1 || it.last > pageCount || it.first > it.last }?.let {
          throw PdfToolsException(
            PdfToolsErrorCode.INVALID_PAGE_RANGE,
            "Range ${it.first}-${it.last} is outside 1-$pageCount",
          )
        }
        ranges.zip(outputs).forEach { (range, output) ->
          PDDocument(MemoryUsageSetting.setupTempFileOnly()).use { part ->
            for (pageNumber in range) part.importPage(source.getPage(pageNumber - 1))
            PdfIo.save(part, output)
          }
          written += PdfFileResult(output, range.count())
        }
      }
      return written
    } catch (error: Throwable) {
      written.forEach { it.file.delete() }
      throw PdfIo.mapWriteError(error)
    }
  }
}
