package expo.modules.displaycutout

import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Reports the screen's display cutouts (punch-hole / notch) in dp, relative to
 * the window, so full-screen UI can keep controls out of them. Empty on screens
 * without a cutout (e.g. Sony Xperia) and below Android 9.
 */
class DisplayCutoutModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DisplayCutout")

    Function("getCutouts") {
      val activity = appContext.currentActivity ?: return@Function emptyList<Map<String, Double>>()
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return@Function emptyList<Map<String, Double>>()
      val cutout = activity.window.decorView.rootWindowInsets?.displayCutout
        ?: return@Function emptyList<Map<String, Double>>()
      val density = activity.resources.displayMetrics.density.toDouble()
      cutout.boundingRects.map { rect ->
        mapOf(
          "left" to rect.left / density,
          "top" to rect.top / density,
          "right" to rect.right / density,
          "bottom" to rect.bottom / density,
        )
      }
    }
  }
}
