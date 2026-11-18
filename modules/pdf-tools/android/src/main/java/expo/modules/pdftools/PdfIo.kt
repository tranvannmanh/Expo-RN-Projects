package expo.modules.pdftools

import com.tom_roush.pdfbox.io.MemoryUsageSetting
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.encryption.InvalidPasswordException
import java.io.File
import java.io.IOException

private const val TEMP_SUFFIX = ".part"

/** Loading/saving with consistent error codes and low memory use (PDFBox spills to temp files). */
internal object PdfIo {

  fun open(file: File): PDDocument {
    val document = try {
      PDDocument.load(file, MemoryUsageSetting.setupTempFileOnly())
    } catch (error: InvalidPasswordException) {
      throw PdfToolsException(PdfToolsErrorCode.PDF_PASSWORD_PROTECTED, "${file.name} is password protected", error)
    } catch (error: IOException) {
      throw PdfToolsException(PdfToolsErrorCode.PDF_INVALID, "${file.name} is not a readable PDF", error)
    }
    // Owner-password PDFs open without a password but forbid modification. We do not strip
    // the author's restrictions; such files are rejected like password-protected ones.
    if (document.isEncrypted) {
      document.close()
      throw PdfToolsException(PdfToolsErrorCode.PDF_PASSWORD_PROTECTED, "${file.name} is protected")
    }
    return document
  }

  inline fun <T> use(file: File, block: (PDDocument) -> T): T = open(file).use(block)

  /** Writes next to the target first, so a failure never leaves a half-written PDF. */
  fun save(document: PDDocument, output: File) {
    val temp = File(output.parentFile, output.name + TEMP_SUFFIX)
    try {
      document.save(temp)
      if (output.exists() && !output.delete()) throw IOException("Unable to replace ${output.name}")
      if (!temp.renameTo(output)) throw IOException("Unable to finalize ${output.name}")
    } catch (error: IOException) {
      throw mapWriteError(error)
    } finally {
      if (temp.exists()) temp.delete()
    }
  }

  fun mapWriteError(error: Throwable): PdfToolsException {
    if (error is PdfToolsException) return error
    val noSpace = error.message?.contains("ENOSPC") == true || error.message?.contains("No space left") == true
    return if (noSpace) {
      PdfToolsException(PdfToolsErrorCode.STORAGE_FULL, "Device storage is full", error)
    } else {
      PdfToolsException(PdfToolsErrorCode.PDF_OPERATION_ERROR, error.message ?: "PDF operation failed", error)
    }
  }
}
