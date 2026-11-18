package expo.modules.pdftools

import android.net.Uri
import java.io.File

/** Folder (under filesDir) owned by PDF Tools; every output is written here. */
internal const val PDF_FILES_DIR = "pdf-files"
/** Scanner documents: readable as inputs, never written by this module. */
private const val SCANNER_DOCUMENTS_DIR = "documents"

/**
 * Only file:// URIs inside the app's own storage are accepted, so JavaScript cannot make the
 * native side read or overwrite arbitrary files (paths are canonicalised against traversal).
 */
/** Rendered page previews (cache dir: the OS may clear it; pages are re-rendered on demand). */
internal const val PREVIEW_CACHE_DIR = "pdf-preview"

internal class PathGuard(filesDir: File, cacheDir: File) {
  val outputRoot: File = File(filesDir, PDF_FILES_DIR)
  private val previewRoot = File(cacheDir, PREVIEW_CACHE_DIR)
  private val inputRoots = listOf(outputRoot, File(filesDir, SCANNER_DOCUMENTS_DIR))

  fun input(uri: String): File {
    val file = resolve(uri)
    if (inputRoots.none { file.isInside(it) }) fail("Input is outside the app storage")
    if (!file.isFile) throw PdfToolsException(PdfToolsErrorCode.FILE_NOT_FOUND, "File does not exist: ${file.name}")
    return file
  }

  /** A page preview image path, inside the preview cache only. */
  fun previewFile(uri: String): File {
    val file = resolve(uri)
    if (!file.isInside(previewRoot)) fail("Preview output must be inside $PREVIEW_CACHE_DIR")
    return file
  }

  fun output(uri: String): File {
    val file = resolve(uri)
    if (!file.isInside(outputRoot)) fail("Output must be inside $PDF_FILES_DIR")
    file.parentFile?.mkdirs()
    return file
  }

  private fun resolve(uri: String): File {
    val parsed = Uri.parse(uri)
    val path = parsed.path
    if (parsed.scheme != "file" || path == null) fail("Not a file:// URI")
    return File(path).canonicalFile
  }

  private fun File.isInside(root: File) = path.startsWith(root.canonicalPath + File.separator)

  private fun fail(message: String): Nothing = throw PdfToolsException(PdfToolsErrorCode.FILE_NOT_FOUND, message)
}
