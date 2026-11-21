package expo.modules.photoexif

import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

/**
 * Re-encoding a photo (film render) drops its metadata. This copies the camera
 * EXIF (device, exposure, lens, time, GPS) from the source file onto the new
 * JPEG, then applies `fallbacks` (only where the source had nothing) and
 * `overrides` (always), e.g. Orientation=1 and the new pixel size.
 */
class PhotoExifModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PhotoExif")

    AsyncFunction("copyExif") {
        sourceUri: String,
        targetUri: String,
        fallbacks: Map<String, String>,
        overrides: Map<String, String> ->
      val target = ExifInterface(filePath(targetUri))
      readSource(sourceUri)?.let { source ->
        for (tag in COPIED_TAGS) {
          source.getAttribute(tag)?.let { target.setAttribute(tag, it) }
        }
      }
      for ((tag, value) in fallbacks) {
        if (target.getAttribute(tag).isNullOrEmpty()) target.setAttribute(tag, value)
      }
      for ((tag, value) in overrides) target.setAttribute(tag, value)
      target.saveAttributes()
    }
  }

  private fun filePath(uri: String): String = Uri.parse(uri).path ?: uri

  /** Source may be a file:// path or a content:// URI (gallery picks). */
  private fun readSource(uri: String): ExifInterface? {
    val parsed = Uri.parse(uri)
    return try {
      if (parsed.scheme == "content") {
        val resolver = appContext.reactContext?.contentResolver ?: throw Exceptions.ReactContextLost()
        resolver.openInputStream(parsed)?.use { ExifInterface(it) }
      } else {
        val file = File(parsed.path ?: uri)
        if (file.exists()) ExifInterface(file) else null
      }
    } catch (_: Exception) {
      null
    }
  }

  companion object {
    private val COPIED_TAGS =
      listOf(
        ExifInterface.TAG_MAKE,
        ExifInterface.TAG_MODEL,
        ExifInterface.TAG_DATETIME,
        ExifInterface.TAG_DATETIME_ORIGINAL,
        ExifInterface.TAG_DATETIME_DIGITIZED,
        ExifInterface.TAG_OFFSET_TIME,
        ExifInterface.TAG_OFFSET_TIME_ORIGINAL,
        ExifInterface.TAG_OFFSET_TIME_DIGITIZED,
        ExifInterface.TAG_SUBSEC_TIME,
        ExifInterface.TAG_SUBSEC_TIME_ORIGINAL,
        ExifInterface.TAG_SUBSEC_TIME_DIGITIZED,
        ExifInterface.TAG_EXPOSURE_TIME,
        ExifInterface.TAG_F_NUMBER,
        ExifInterface.TAG_APERTURE_VALUE,
        ExifInterface.TAG_MAX_APERTURE_VALUE,
        ExifInterface.TAG_SHUTTER_SPEED_VALUE,
        ExifInterface.TAG_PHOTOGRAPHIC_SENSITIVITY,
        ExifInterface.TAG_SENSITIVITY_TYPE,
        ExifInterface.TAG_EXPOSURE_BIAS_VALUE,
        ExifInterface.TAG_EXPOSURE_PROGRAM,
        ExifInterface.TAG_EXPOSURE_MODE,
        ExifInterface.TAG_METERING_MODE,
        ExifInterface.TAG_BRIGHTNESS_VALUE,
        ExifInterface.TAG_FLASH,
        ExifInterface.TAG_WHITE_BALANCE,
        ExifInterface.TAG_FOCAL_LENGTH,
        ExifInterface.TAG_FOCAL_LENGTH_IN_35MM_FILM,
        ExifInterface.TAG_LENS_MAKE,
        ExifInterface.TAG_LENS_MODEL,
        ExifInterface.TAG_DIGITAL_ZOOM_RATIO,
        ExifInterface.TAG_SCENE_CAPTURE_TYPE,
        ExifInterface.TAG_GPS_LATITUDE,
        ExifInterface.TAG_GPS_LATITUDE_REF,
        ExifInterface.TAG_GPS_LONGITUDE,
        ExifInterface.TAG_GPS_LONGITUDE_REF,
        ExifInterface.TAG_GPS_ALTITUDE,
        ExifInterface.TAG_GPS_ALTITUDE_REF,
        ExifInterface.TAG_GPS_TIMESTAMP,
        ExifInterface.TAG_GPS_DATESTAMP,
      )
  }
}
