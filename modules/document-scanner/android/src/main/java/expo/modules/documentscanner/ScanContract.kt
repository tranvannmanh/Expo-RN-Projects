package expo.modules.documentscanner

import android.content.Context
import android.content.Intent
import android.content.IntentSender
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts.StartIntentSenderForResult
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

/** Persisted by Expo across Activity recreation, so it must stay small and Serializable. */
internal data class ScanRequest(val documentId: String) : Serializable

internal data class ScanActivityResult(val resultCode: Int, val data: Intent?)

/**
 * ML Kit hands us an [IntentSender] rather than an [Intent]. Expo's activity-result registry
 * understands the androidx `ACTION_INTENT_SENDER_REQUEST` convention and dispatches it through
 * `startIntentSenderForResult`, so we wrap the sender in that envelope.
 *
 * The sender is not Serializable, so it is supplied lazily right before launch.
 */
internal class ScanContract(
  private val intentSenderProvider: () -> IntentSender?,
) : AppContextActivityResultContract<ScanRequest, ScanActivityResult> {

  override fun createIntent(context: Context, input: ScanRequest): Intent {
    val sender = intentSenderProvider()
      ?: throw DocumentScannerException(ScannerErrorCode.SCAN_LAUNCH_ERROR, "Scanner intent is not ready")
    val request = IntentSenderRequest.Builder(sender).build()
    return Intent(StartIntentSenderForResult.ACTION_INTENT_SENDER_REQUEST)
      .putExtra(StartIntentSenderForResult.EXTRA_INTENT_SENDER_REQUEST, request)
  }

  override fun parseResult(input: ScanRequest, resultCode: Int, intent: Intent?): ScanActivityResult =
    ScanActivityResult(resultCode, intent)
}
