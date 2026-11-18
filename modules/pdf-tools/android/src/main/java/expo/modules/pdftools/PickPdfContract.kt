package expo.modules.pdftools

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

internal data class PickPdfRequest(val allowMultiple: Boolean) : Serializable

/** ACTION_OPEN_DOCUMENT: grants read access to the picked files only; no storage permission. */
internal class PickPdfContract : AppContextActivityResultContract<PickPdfRequest, List<Uri>> {

  override fun createIntent(context: Context, input: PickPdfRequest): Intent =
    Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "application/pdf"
      putExtra(Intent.EXTRA_ALLOW_MULTIPLE, input.allowMultiple)
    }

  override fun parseResult(input: PickPdfRequest, resultCode: Int, intent: Intent?): List<Uri> {
    if (resultCode != Activity.RESULT_OK || intent == null) return emptyList()
    val clip = intent.clipData
    if (clip != null) return (0 until clip.itemCount).mapNotNull { clip.getItemAt(it).uri }
    return listOfNotNull(intent.data)
  }
}
