package expo.modules.documentscanner

import android.app.Activity
import android.content.Context
import android.content.IntentSender
import android.net.Uri
import android.os.Build
import androidx.activity.result.contract.ActivityResultContracts.StartIntentSenderForResult
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.mlkit.common.MlKitException
import com.google.mlkit.vision.documentscanner.GmsDocumentScanner
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

private val DOCUMENT_ID_PATTERN = Regex("^[A-Za-z0-9_-]{1,64}$")
private val UNSAFE_FILE_NAME_CHARS = Regex("[\\\\/:*?\"<>|\\u0000-\\u001F]")
private const val MAX_FILE_NAME_LENGTH = 120
private val EXPORTABLE_MIME_TYPES = setOf("application/pdf", "image/jpeg")

class DocumentScannerModule : Module() {
  private val scanInProgress = AtomicBoolean(false)
  private val exportInProgress = AtomicBoolean(false)
  private lateinit var createDocumentLauncher: AppContextActivityResultLauncher<CreateDocumentRequest, Uri?>

  @Volatile
  private var pendingIntentSender: IntentSender? = null
  private lateinit var scanLauncher: AppContextActivityResultLauncher<ScanRequest, ScanActivityResult>

  private val context: Context
    get() = appContext.reactContext
      ?: throw DocumentScannerException(ScannerErrorCode.SCAN_INIT_ERROR, "React context is not available")

  override fun definition() = ModuleDefinition {
    Name("DocumentScanner")

    RegisterActivityContracts {
      scanLauncher = registerForActivityResult(ScanContract { pendingIntentSender })
      createDocumentLauncher = registerForActivityResult(CreateDocumentContract())
    }

    Function("canSaveToPublicFolder") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
    }

    AsyncFunction("generatePdfAsync") Coroutine { documentId: String, pageUris: List<String> ->
      generatePdf(documentId, pageUris)
    }

    AsyncFunction("saveToPublicFolderAsync") Coroutine { sourceUri: String, fileName: String, mimeType: String, collection: String ->
      saveToPublicFolder(sourceUri, fileName, mimeType, collection)
    }

    AsyncFunction("saveWithPickerAsync") Coroutine { sourceUri: String, fileName: String, mimeType: String ->
      saveWithPicker(sourceUri, fileName, mimeType)
    }

    AsyncFunction("isAvailableAsync") {
      isPlayServicesAvailable(context)
    }

    AsyncFunction("scanDocumentAsync") Coroutine { options: ScanOptions ->
      scan(options)
    }

    OnDestroy {
      pendingIntentSender = null
    }
  }

  private suspend fun scan(options: ScanOptions): Map<String, Any?> {
    if (!scanInProgress.compareAndSet(false, true)) {
      throw DocumentScannerException(ScannerErrorCode.SCAN_IN_PROGRESS, "A scan is already in progress")
    }
    try {
      val ctx = context
      if (!isPlayServicesAvailable(ctx)) {
        throw DocumentScannerException(ScannerErrorCode.SCANNER_UNAVAILABLE, "Google Play services is not available")
      }
      val documentId = resolveDocumentId(options.documentId)
      val result = launchScanner(buildScannerOptions(options), documentId) ?: return cancelledResult()
      return persistResult(ctx, documentId, result)
    } finally {
      pendingIntentSender = null
      scanInProgress.set(false)
    }
  }

  private suspend fun launchScanner(
    scannerOptions: GmsDocumentScannerOptions,
    documentId: String,
  ): GmsDocumentScanningResult? = withContext(Dispatchers.Main) {
    val activity = appContext.currentActivity
      ?: throw DocumentScannerException(ScannerErrorCode.SCAN_LAUNCH_ERROR, "No foreground activity")
    val scanner = GmsDocumentScanning.getClient(scannerOptions)

    pendingIntentSender = requestIntentSender(scanner, activity)
    val activityResult = try {
      scanLauncher.launch(ScanRequest(documentId))
    } catch (error: DocumentScannerException) {
      throw error
    } catch (error: Exception) {
      throw DocumentScannerException(ScannerErrorCode.SCAN_LAUNCH_ERROR, error.message ?: "Failed to launch scanner", error)
    } finally {
      pendingIntentSender = null
    }
    parseActivityResult(activityResult)
  }

  private suspend fun requestIntentSender(scanner: GmsDocumentScanner, activity: Activity): IntentSender =
    suspendCancellableCoroutine { continuation ->
      scanner.getStartScanIntent(activity)
        .addOnSuccessListener { continuation.resume(it) }
        .addOnFailureListener { continuation.resumeWithException(mapInitError(it)) }
    }

  private fun parseActivityResult(result: ScanActivityResult): GmsDocumentScanningResult? {
    if (result.resultCode == Activity.RESULT_OK) {
      return GmsDocumentScanningResult.fromActivityResultIntent(result.data)
        ?: throw DocumentScannerException(ScannerErrorCode.SCAN_RESULT_ERROR, "Scanner returned no result")
    }
    if (result.data?.hasExtra(StartIntentSenderForResult.EXTRA_SEND_INTENT_EXCEPTION) == true) {
      throw DocumentScannerException(ScannerErrorCode.SCAN_LAUNCH_ERROR, "Scanner activity could not be started")
    }
    return null
  }

  private suspend fun persistResult(
    ctx: Context,
    documentId: String,
    result: GmsDocumentScanningResult,
  ): Map<String, Any?> = withContext(Dispatchers.IO) {
    val pageUris = result.pages.orEmpty().map { it.imageUri }
    if (pageUris.isEmpty()) {
      throw DocumentScannerException(ScannerErrorCode.SCAN_RESULT_ERROR, "Scanner returned no pages")
    }
    val pdfUri = result.pdf?.uri
    val store = DocumentFileStore(ctx.filesDir, ctx.cacheDir, ctx.contentResolver)

    try {
      val scanId = System.currentTimeMillis().toString(Character.MAX_RADIX)
      val persisted = store.persist(documentId, scanId, pageUris, pdfUri)
      mapOf(
        "cancelled" to false,
        "documentId" to persisted.documentId,
        "pages" to persisted.pages.map {
          mapOf("pageNumber" to it.pageNumber, "uri" to Uri.fromFile(it.file).toString())
        },
        "pdfUri" to persisted.pdf?.let { Uri.fromFile(it).toString() },
        "pageCount" to persisted.pages.size,
      )
    } finally {
      store.deleteScannerOutput(pageUris + listOfNotNull(pdfUri))
    }
  }

  // ------------------------------------------------------------------ PDF & export

  private suspend fun generatePdf(documentId: String, pageUris: List<String>): String =
    withContext(Dispatchers.IO) {
      val documentDir = File(documentsRoot(), resolveDocumentId(documentId))
      val images = pageUris.map { requireDocumentFile(it, documentDir) }
      val output = File(documentDir, "document.pdf")
      PdfGenerator.generate(images, output)
      Uri.fromFile(output).toString()
    }

  private suspend fun saveToPublicFolder(
    sourceUri: String,
    fileName: String,
    mimeType: String,
    collection: String,
  ): Map<String, Any?> = withContext(Dispatchers.IO) {
    val source = requireExportableFile(sourceUri)
    val target = PublicCollection.entries.firstOrNull { it.name.equals(collection, ignoreCase = true) }
      ?: throw DocumentScannerException(ScannerErrorCode.EXPORT_ERROR, "Unknown collection: $collection")
    val exported = PublicExporter(context.contentResolver)
      .saveToCollection(source, safeFileName(fileName), requireMimeType(mimeType), target)
    mapOf("uri" to exported.uri.toString(), "displayPath" to exported.displayPath)
  }

  private suspend fun saveWithPicker(sourceUri: String, fileName: String, mimeType: String): Map<String, Any?> {
    if (!exportInProgress.compareAndSet(false, true)) {
      throw DocumentScannerException(ScannerErrorCode.EXPORT_IN_PROGRESS, "An export is already in progress")
    }
    try {
      val source = requireExportableFile(sourceUri)
      val request = CreateDocumentRequest(safeFileName(fileName), requireMimeType(mimeType))
      val target = withContext(Dispatchers.Main) { createDocumentLauncher.launch(request) }
        ?: return mapOf("cancelled" to true)
      withContext(Dispatchers.IO) { PublicExporter(context.contentResolver).copyTo(source, target) }
      return mapOf("cancelled" to false, "uri" to target.toString())
    } finally {
      exportInProgress.set(false)
    }
  }

  private fun documentsRoot() = File(context.filesDir, "documents")

  /** Exports may come from scanned documents or from PDF Tools (filesDir/pdf-files). */
  private fun requireExportableFile(uri: String): File {
    val roots = listOf(documentsRoot(), File(context.filesDir, "pdf-files"))
    val attempts = roots.map { root -> runCatching { requireDocumentFile(uri, root) } }
    attempts.firstNotNullOfOrNull { it.getOrNull() }?.let { return it }
    throw attempts.first().exceptionOrNull() ?: DocumentScannerException(ScannerErrorCode.FILE_NOT_FOUND, "Not exportable")
  }

  /** Accepts only existing file:// URIs inside `root` (blocks path traversal and foreign files). */
  private fun requireDocumentFile(uriString: String, root: File): File {
    val uri = Uri.parse(uriString)
    val path = uri.path
    if (uri.scheme != "file" || path == null) {
      throw DocumentScannerException(ScannerErrorCode.FILE_NOT_FOUND, "Not an app file URI")
    }
    val file = File(path).canonicalFile
    if (!file.path.startsWith(root.canonicalPath + File.separator)) {
      throw DocumentScannerException(ScannerErrorCode.FILE_NOT_FOUND, "File is outside the document storage")
    }
    if (!file.isFile) {
      throw DocumentScannerException(ScannerErrorCode.FILE_NOT_FOUND, "File does not exist: ${file.name}")
    }
    return file
  }

  private fun requireMimeType(mimeType: String): String {
    if (mimeType !in EXPORTABLE_MIME_TYPES) {
      throw DocumentScannerException(ScannerErrorCode.EXPORT_ERROR, "Unsupported MIME type: $mimeType")
    }
    return mimeType
  }

  private fun safeFileName(name: String): String =
    name.replace(UNSAFE_FILE_NAME_CHARS, "_").trim().take(MAX_FILE_NAME_LENGTH).ifEmpty { "document" }

  // -------------------------------------------------------------------- scanning

  private fun buildScannerOptions(options: ScanOptions): GmsDocumentScannerOptions {
    val formats = if (options.includePdf) {
      intArrayOf(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG, GmsDocumentScannerOptions.RESULT_FORMAT_PDF)
    } else {
      intArrayOf(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
    }
    return GmsDocumentScannerOptions.Builder()
      .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
      .setGalleryImportAllowed(options.galleryImport)
      .setPageLimit(options.pageLimit.coerceIn(1, MAX_PAGE_LIMIT))
      .setResultFormats(formats.first(), *formats.drop(1).toIntArray())
      .build()
  }

  private fun resolveDocumentId(requested: String?): String {
    if (requested == null) return UUID.randomUUID().toString()
    if (!DOCUMENT_ID_PATTERN.matches(requested)) {
      throw DocumentScannerException(ScannerErrorCode.SCAN_INIT_ERROR, "Invalid documentId")
    }
    return requested
  }

  private fun mapInitError(error: Exception): DocumentScannerException {
    val unavailable = error is MlKitException && error.errorCode == MlKitException.UNAVAILABLE
    val code = if (unavailable) ScannerErrorCode.SCANNER_UNAVAILABLE else ScannerErrorCode.SCAN_INIT_ERROR
    return DocumentScannerException(code, error.message ?: "Failed to initialize scanner", error)
  }

  private fun isPlayServicesAvailable(ctx: Context): Boolean =
    GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(ctx) == ConnectionResult.SUCCESS

  private fun cancelledResult(): Map<String, Any?> = mapOf("cancelled" to true)
}
