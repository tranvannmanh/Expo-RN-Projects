package expo.modules.hardwarekeys

import android.app.Activity
import android.view.KeyEvent
import android.view.Window
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Forwards camera-related hardware keys to JS while enabled:
 * - `focus`   KEYCODE_FOCUS  (half-press of a two-stage shutter, e.g. Sony Xperia)
 * - `shutter` KEYCODE_CAMERA (full press)
 *
 * Keys are consumed only while enabled. Volume keys are never intercepted.
 * Interception wraps the Activity's Window.Callback; no MainActivity changes.
 */
class HardwareKeysModule : Module() {
  @Volatile private var enabled = false

  override fun definition() = ModuleDefinition {
    Name("HardwareKeys")

    Events(KEY_EVENT)

    Function("setEnabled") { value: Boolean ->
      enabled = value
      appContext.currentActivity?.let { activity ->
        activity.runOnUiThread { if (value) install(activity) else uninstall(activity) }
      }
    }

    OnActivityEntersForeground {
      val activity = appContext.currentActivity ?: return@OnActivityEntersForeground
      if (enabled) activity.runOnUiThread { install(activity) }
    }

    OnDestroy {
      appContext.currentActivity?.let { activity -> activity.runOnUiThread { uninstall(activity) } }
    }
  }

  private fun install(activity: Activity) {
    val window = activity.window ?: return
    val current = window.callback ?: return
    if (current is KeyInterceptor) return
    window.callback = KeyInterceptor(current, ::handle)
  }

  private fun uninstall(activity: Activity) {
    val window = activity.window ?: return
    val current = window.callback
    if (current is KeyInterceptor) window.callback = current.base
  }

  /** Returns true when the key was consumed. */
  private fun handle(event: KeyEvent): Boolean {
    if (!enabled) return false
    val key = when (event.keyCode) {
      KeyEvent.KEYCODE_FOCUS -> "focus"
      KeyEvent.KEYCODE_CAMERA -> "shutter"
      else -> return false
    }
    val action = when (event.action) {
      KeyEvent.ACTION_DOWN -> if (event.repeatCount == 0) "down" else return true
      KeyEvent.ACTION_UP -> "up"
      else -> return true
    }
    sendEvent(KEY_EVENT, mapOf("key" to key, "action" to action))
    return true
  }

  private class KeyInterceptor(
    val base: Window.Callback,
    private val onKey: (KeyEvent) -> Boolean,
  ) : Window.Callback by base {
    override fun dispatchKeyEvent(event: KeyEvent): Boolean = onKey(event) || base.dispatchKeyEvent(event)
  }

  companion object {
    private const val KEY_EVENT = "onKey"
  }
}
