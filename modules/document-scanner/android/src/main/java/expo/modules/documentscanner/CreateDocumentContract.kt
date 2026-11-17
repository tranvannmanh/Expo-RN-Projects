package expo.modules.documentscanner

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

private const val EXTERNAL_STORAGE_AUTHORITY = "com.android.externalstorage.documents"
private const val PRIMARY_DOCUMENTS_ID = "primary:Documents"

internal data class CreateDocumentRequest(val fileName: String, val mimeType: String) : Serializable

/**
 * ACTION_CREATE_DOCUMENT (Storage Access Framework): the user picks the folder and file name.
 * Grants access to that single new file only — no storage permission is requested.
 */
internal class CreateDocumentContract : AppContextActivityResultContract<CreateDocumentRequest, Uri?> {

  override fun createIntent(context: Context, input: CreateDocumentRequest): Intent =
    Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = input.mimeType
      putExtra(Intent.EXTRA_TITLE, input.fileName)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        // Hint only: the picker opens in Documents when the provider supports it.
        putExtra(
          DocumentsContract.EXTRA_INITIAL_URI,
          DocumentsContract.buildDocumentUri(EXTERNAL_STORAGE_AUTHORITY, PRIMARY_DOCUMENTS_ID),
        )
      }
    }

  override fun parseResult(input: CreateDocumentRequest, resultCode: Int, intent: Intent?): Uri? =
    if (resultCode == Activity.RESULT_OK) intent?.data else null
}
