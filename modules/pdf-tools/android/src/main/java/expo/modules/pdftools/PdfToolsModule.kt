package expo.modules.pdftools

import android.content.Context
import android.net.Uri
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean

class PdfToolsModule : Module() {
  /** PDF work is memory-hungry: run one operation at a time. */
  private val operationLock = Mutex()
  /**
   * Viewer pages use their own lock so scrolling stays responsive while a long operation
   * (compress, merge…) runs; PdfPreviewRenderer is only ever touched under this lock.
   */
  private val previewLock = Mutex()
  private val pickerOpen = AtomicBoolean(false)
  private lateinit var pickLauncher: AppContextActivityResultLauncher<PickPdfRequest, List<Uri>>

  private val context: Context
    get() = appContext.reactContext
      ?: throw PdfToolsException(PdfToolsErrorCode.PDF_OPERATION_ERROR, "React context is not available")

  private val paths get() = PathGuard(context.filesDir, context.cacheDir)

  override fun definition() = ModuleDefinition {
    Name("PdfTools")

    OnCreate {
      appContext.reactContext?.let { PDFBoxResourceLoader.init(it.applicationContext) }
    }

    RegisterActivityContracts {
      pickLauncher = registerForActivityResult(PickPdfContract())
    }

    AsyncFunction("pickPdfsAsync") Coroutine { allowMultiple: Boolean ->
      pick(allowMultiple)
    }

    AsyncFunction("getInfoAsync") Coroutine { uri: String ->
      io {
        val file = paths.input(uri)
        mapOf("pageCount" to PdfPageOperations.pageCount(file), "sizeBytes" to file.length())
      }
    }

    AsyncFunction("renderThumbnailAsync") Coroutine { input: String, output: String, widthPx: Int ->
      io {
        val target = paths.output(output)
        PdfThumbnailRenderer.render(paths.input(input), target, widthPx)
        Uri.fromFile(target).toString()
      }
    }

    AsyncFunction("getPageSizesAsync") Coroutine { input: String ->
      preview { PdfPreviewRenderer.pageSizes(paths.input(input)) }
    }

    AsyncFunction("renderPageAsync") Coroutine { input: String, pageIndex: Int, output: String, widthPx: Int ->
      preview {
        val target = paths.previewFile(output)
        PdfPreviewRenderer.render(paths.input(input), pageIndex, target, widthPx)
        Uri.fromFile(target).toString()
      }
    }

    OnDestroy {
      PdfPreviewRenderer.close()
    }

    AsyncFunction("compressAsync") Coroutine { input: String, output: String, preset: String ->
      io {
        val result = PdfCompressor.compress(paths.input(input), paths.output(output), CompressionPreset.from(preset))
        mapOf(
          "uri" to Uri.fromFile(paths.output(output)).toString(),
          "inputBytes" to result.inputBytes,
          "outputBytes" to result.outputBytes,
          "imagesRecompressed" to result.imagesRecompressed,
        )
      }
    }

    AsyncFunction("mergeAsync") Coroutine { inputs: List<String>, output: String ->
      io { describe(PdfPageOperations.merge(inputs.map(paths::input), paths.output(output))) }
    }

    AsyncFunction("splitAsync") Coroutine { input: String, ranges: List<List<Int>>, outputs: List<String> ->
      io {
        val parsed = ranges.map {
          if (it.size != 2) throw PdfToolsException(PdfToolsErrorCode.INVALID_PAGE_RANGE, "Range must be [from, to]")
          it[0]..it[1]
        }
        PdfPageOperations.split(paths.input(input), parsed, outputs.map(paths::output)).map(::describe)
      }
    }

    AsyncFunction("watermarkAsync") Coroutine { input: String, output: String, options: WatermarkOptions ->
      io {
        val target = paths.output(output)
        val pages = PdfWatermarker.apply(context, paths.input(input), target, options)
        describe(PdfFileResult(target, pages))
      }
    }
  }

  private suspend fun pick(allowMultiple: Boolean): Map<String, Any?> {
    if (!pickerOpen.compareAndSet(false, true)) {
      throw PdfToolsException(PdfToolsErrorCode.PICKER_IN_PROGRESS, "A file picker is already open")
    }
    try {
      val uris = withContext(Dispatchers.Main) { pickLauncher.launch(PickPdfRequest(allowMultiple)) }
      if (uris.isEmpty()) return mapOf("cancelled" to true)
      val imported = io { PdfImporter(context.contentResolver, File(paths.outputRoot, "imports")).import(uris) }
      return mapOf(
        "cancelled" to false,
        "files" to imported.map {
          mapOf(
            "uri" to Uri.fromFile(it.file).toString(),
            "name" to it.displayName,
            "pageCount" to it.pageCount,
            "sizeBytes" to it.file.length(),
          )
        },
      )
    } finally {
      pickerOpen.set(false)
    }
  }

  private suspend fun <T> preview(block: () -> T): T =
    previewLock.withLock { withContext(Dispatchers.IO) { block() } }

  private suspend fun <T> io(block: () -> T): T =
    operationLock.withLock {
      withContext(Dispatchers.IO) {
        try {
          block()
        } catch (error: OutOfMemoryError) {
          throw PdfToolsException(PdfToolsErrorCode.PDF_OPERATION_ERROR, "Not enough memory for this PDF", error)
        }
      }
    }

  private fun describe(result: PdfFileResult) = mapOf(
    "uri" to Uri.fromFile(result.file).toString(),
    "pageCount" to result.pageCount,
    "sizeBytes" to result.file.length(),
  )
}
