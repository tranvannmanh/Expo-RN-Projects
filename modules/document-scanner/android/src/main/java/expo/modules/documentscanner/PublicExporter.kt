package expo.modules.documentscanner

import android.content.ContentResolver
import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import java.io.File
import java.io.IOException

/** Sub-folder created inside the public Documents / Pictures collections. */
internal const val PUBLIC_FOLDER_NAME = "ScannerApp"

internal enum class PublicCollection { DOCUMENTS, PICTURES }

internal data class ExportedFile(val uri: Uri, val displayPath: String)

/**
 * Copies app-private files to shared storage without any storage permission:
 * - MediaStore (Android 10+): Documents/ScannerApp or Pictures/ScannerApp.
 * - A user-chosen SAF document (any Android version), see [copyTo].
 * The private source file is never moved or deleted.
 */
internal class PublicExporter(private val resolver: ContentResolver) {

  val isMediaStoreSupported: Boolean
    get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q

  fun saveToCollection(source: File, displayName: String, mimeType: String, collection: PublicCollection): ExportedFile {
    if (!isMediaStoreSupported) {
      throw DocumentScannerException(ScannerErrorCode.EXPORT_UNSUPPORTED, "Saving to shared folders needs Android 10+")
    }
    return insertIntoMediaStore(source, displayName, mimeType, collection)
  }

  /** Streams `source` into a document the user created via ACTION_CREATE_DOCUMENT. */
  fun copyTo(source: File, target: Uri) {
    try {
      val output = resolver.openOutputStream(target, "wt") ?: throw IOException("Cannot open destination")
      output.use { out -> source.inputStream().use { it.copyTo(out) } }
    } catch (error: Exception) {
      runCatching { android.provider.DocumentsContract.deleteDocument(resolver, target) }
      throw DocumentScannerException(ScannerErrorCode.EXPORT_ERROR, error.message ?: "Export failed", error)
    }
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  private fun insertIntoMediaStore(
    source: File,
    displayName: String,
    mimeType: String,
    collection: PublicCollection,
  ): ExportedFile {
    val (collectionUri, baseDir) = when (collection) {
      PublicCollection.DOCUMENTS ->
        MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) to Environment.DIRECTORY_DOCUMENTS
      PublicCollection.PICTURES ->
        MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) to Environment.DIRECTORY_PICTURES
    }
    val relativePath = "$baseDir/$PUBLIC_FOLDER_NAME"
    val values = ContentValues().apply {
      put(MediaStore.MediaColumns.DISPLAY_NAME, displayName)
      put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
      put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath)
      // Hidden from other apps until fully written.
      put(MediaStore.MediaColumns.IS_PENDING, 1)
    }

    val uri = resolver.insert(collectionUri, values)
      ?: throw DocumentScannerException(ScannerErrorCode.EXPORT_ERROR, "MediaStore refused the new file")
    try {
      val output = resolver.openOutputStream(uri) ?: throw IOException("Cannot open MediaStore output")
      output.use { out -> source.inputStream().use { it.copyTo(out) } }
      resolver.update(uri, ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) }, null, null)
    } catch (error: Exception) {
      resolver.delete(uri, null, null)
      val code = if (error is IOException && error.message?.contains("ENOSPC") == true) {
        ScannerErrorCode.STORAGE_FULL
      } else {
        ScannerErrorCode.EXPORT_ERROR
      }
      throw DocumentScannerException(code, error.message ?: "Export failed", error)
    }

    // MediaStore may rename on conflict, e.g. "Report (1).pdf".
    val finalName = queryDisplayName(uri) ?: displayName
    return ExportedFile(uri, "$relativePath/$finalName")
  }

  private fun queryDisplayName(uri: Uri): String? =
    resolver.query(uri, arrayOf(MediaStore.MediaColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) cursor.getString(0) else null
    }
}
