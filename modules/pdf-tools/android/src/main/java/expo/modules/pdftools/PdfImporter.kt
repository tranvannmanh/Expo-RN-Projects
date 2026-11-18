package expo.modules.pdftools

import android.content.ContentResolver
import android.net.Uri
import android.provider.OpenableColumns
import java.io.File
import java.io.IOException
import java.util.UUID

/** Free space kept in reserve so an import never fills the device completely. */
private const val FREE_SPACE_MARGIN_BYTES = 20L * 1024 * 1024

internal data class ImportedPdf(val file: File, val displayName: String, val pageCount: Int)

/**
 * Copies picked documents into app storage and validates them with PDFBox. All-or-nothing:
 * if any file is unreadable or protected, every copy made by this call is removed.
 */
internal class PdfImporter(private val resolver: ContentResolver, private val destination: File) {

  fun import(uris: List<Uri>): List<ImportedPdf> {
    destination.mkdirs()
    val imported = mutableListOf<ImportedPdf>()
    try {
      ensureFreeSpace(uris.sumOf { querySize(it) })
      for (uri in uris) {
        val target = File(destination, "${UUID.randomUUID()}.pdf")
        copy(uri, target)
        val name = queryDisplayName(uri) ?: "document.pdf"
        imported += ImportedPdf(target, name, PdfPageOperations.pageCount(target))
      }
      return imported
    } catch (error: Throwable) {
      imported.forEach { it.file.delete() }
      if (error is PdfToolsException) throw error
      throw PdfToolsException(PdfToolsErrorCode.IMPORT_ERROR, error.message ?: "Import failed", error)
    }
  }

  private fun copy(source: Uri, target: File) {
    try {
      val input = resolver.openInputStream(source) ?: throw IOException("Cannot open the selected file")
      input.use { stream -> target.outputStream().use { stream.copyTo(it) } }
    } catch (error: Throwable) {
      target.delete()
      throw PdfIo.mapWriteError(error)
    }
  }

  private fun ensureFreeSpace(required: Long) {
    if (destination.usableSpace < required + FREE_SPACE_MARGIN_BYTES) {
      throw PdfToolsException(PdfToolsErrorCode.STORAGE_FULL, "Not enough free space to import")
    }
  }

  private fun querySize(uri: Uri): Long = query(uri, OpenableColumns.SIZE) { it.getLong(0) } ?: 0L

  private fun queryDisplayName(uri: Uri): String? = query(uri, OpenableColumns.DISPLAY_NAME) { it.getString(0) }

  private fun <T> query(uri: Uri, column: String, read: (android.database.Cursor) -> T): T? =
    resolver.query(uri, arrayOf(column), null, null, null)?.use { cursor ->
      if (cursor.moveToFirst() && !cursor.isNull(0)) read(cursor) else null
    }
}
