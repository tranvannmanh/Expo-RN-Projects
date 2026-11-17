package expo.modules.documentscanner

import android.content.ContentResolver
import android.net.Uri
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException
import java.util.Locale

/** Free space kept in reserve so a scan never fills the device completely. */
private const val FREE_SPACE_SAFETY_MARGIN_BYTES = 10L * 1024 * 1024
private const val TEMP_SUFFIX = ".part"

internal data class PersistedPage(val pageNumber: Int, val file: File)

internal data class PersistedScan(
  val documentId: String,
  val pages: List<PersistedPage>,
  val pdf: File?,
)

/**
 * Copies ML Kit's temporary scanner output into app-private persistent storage:
 *
 * filesDir/documents/{documentId}/
 *   original/            (reserved for a future original-capture workflow)
 *   processed/page_{scanId}_{NNN}.jpg
 *   document.pdf
 *
 * File names are stable identifiers; page order is owned by the database, not the file name.
 * On any failure every file written by this call is removed, and the document directory is
 * removed too if this call created it.
 */
internal class DocumentFileStore(
  private val filesDir: File,
  private val cacheDir: File,
  private val contentResolver: ContentResolver,
) {

  fun persist(
    documentId: String,
    scanId: String,
    pageUris: List<Uri>,
    pdfUri: Uri?,
  ): PersistedScan {
    val documentDir = File(filesDir, "documents/$documentId")
    val createdDocumentDir = !documentDir.exists()
    val written = mutableListOf<File>()

    try {
      ensureFreeSpace(pageUris + listOfNotNull(pdfUri))
      val processedDir = ensureDir(File(documentDir, "processed"))
      ensureDir(File(documentDir, "original"))

      val pages = pageUris.mapIndexed { index, uri ->
        val pageNumber = index + 1
        val name = String.format(Locale.US, "page_%s_%03d.jpg", scanId, pageNumber)
        val target = copy(uri, File(processedDir, name))
        written += target
        PersistedPage(pageNumber, target)
      }

      val pdf = pdfUri?.let { copy(it, File(documentDir, "document.pdf")).also(written::add) }

      return PersistedScan(documentId, pages, pdf)
    } catch (error: Throwable) {
      written.forEach { it.delete() }
      if (createdDocumentDir) documentDir.deleteRecursively()
      throw mapIoError(error)
    }
  }

  /** Deletes ML Kit output living in our cache dir. Never touches anything outside it. */
  fun deleteScannerOutput(uris: List<Uri>) {
    val cacheRoot = cacheDir.canonicalPath + File.separator
    uris.forEach { uri ->
      val path = uri.path ?: return@forEach
      if (uri.scheme != ContentResolver.SCHEME_FILE) return@forEach
      val file = File(path)
      if (file.canonicalPath.startsWith(cacheRoot)) file.delete()
    }
  }

  private fun ensureDir(dir: File): File {
    if (!dir.isDirectory && !dir.mkdirs()) {
      throw IOException("Unable to create directory ${dir.name}")
    }
    return dir
  }

  private fun ensureFreeSpace(uris: List<Uri>) {
    val required = uris.sumOf { sizeOf(it) } + FREE_SPACE_SAFETY_MARGIN_BYTES
    if (filesDir.usableSpace < required) {
      throw DocumentScannerException(
        ScannerErrorCode.STORAGE_FULL,
        "Not enough free space: need $required bytes, have ${filesDir.usableSpace}",
      )
    }
  }

  private fun sizeOf(uri: Uri): Long {
    if (uri.scheme == ContentResolver.SCHEME_FILE) return uri.path?.let { File(it).length() } ?: 0L
    return contentResolver.openAssetFileDescriptor(uri, "r")?.use { it.length.coerceAtLeast(0L) } ?: 0L
  }

  /** Writes to a temp file first, then renames, so a crash never leaves a half-written page. */
  private fun copy(source: Uri, target: File): File {
    val temp = File(target.parentFile, target.name + TEMP_SUFFIX)
    try {
      val input = contentResolver.openInputStream(source)
        ?: throw FileNotFoundException("Scanner output not readable: $source")
      input.use { stream -> temp.outputStream().use { stream.copyTo(it) } }
      if (target.exists() && !target.delete()) throw IOException("Unable to replace ${target.name}")
      if (!temp.renameTo(target)) throw IOException("Unable to finalize ${target.name}")
      return target
    } finally {
      if (temp.exists()) temp.delete()
    }
  }

  private fun mapIoError(error: Throwable): Throwable = when {
    error is DocumentScannerException -> error
    error is FileNotFoundException ->
      DocumentScannerException(ScannerErrorCode.FILE_NOT_FOUND, error.message ?: "Scanner output missing", error)
    error.isNoSpaceLeft() ->
      DocumentScannerException(ScannerErrorCode.STORAGE_FULL, "Device storage is full", error)
    else ->
      DocumentScannerException(ScannerErrorCode.FILE_COPY_ERROR, error.message ?: "Failed to save scan", error)
  }

  private fun Throwable.isNoSpaceLeft(): Boolean =
    this is IOException && (message?.contains("ENOSPC") == true || message?.contains("No space left") == true)
}
