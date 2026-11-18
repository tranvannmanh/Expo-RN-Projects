package expo.modules.pdftools

import android.graphics.Bitmap
import com.tom_roush.pdfbox.cos.COSBase
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.PDResources
import com.tom_roush.pdfbox.pdmodel.graphics.form.PDFormXObject
import com.tom_roush.pdfbox.pdmodel.graphics.image.JPEGFactory
import com.tom_roush.pdfbox.pdmodel.graphics.image.PDImageXObject
import java.io.File
import java.util.IdentityHashMap
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Presets: longest image edge + JPEG quality. For an A4 page (11.7 in tall):
 * 2000 px ≈ 170 dpi (print-friendly), 1600 px ≈ 135 dpi (screen), 1100 px ≈ 95 dpi (smallest
 * file that keeps body text readable on a phone).
 */
internal enum class CompressionPreset(val maxEdgePx: Int, val jpegQuality: Float) {
  LIGHT(2000, 0.85f),
  BALANCED(1600, 0.7f),
  STRONG(1100, 0.5f);

  companion object {
    fun from(name: String) = entries.firstOrNull { it.name.equals(name, ignoreCase = true) }
      ?: throw PdfToolsException(PdfToolsErrorCode.PDF_OPERATION_ERROR, "Unknown preset: $name")
  }
}

/** Images smaller than this are not worth re-encoding (icons, logos, decorations). */
private const val MIN_IMAGE_BYTES = 20 * 1024

/**
 * Shrinks a PDF by down-sampling and re-encoding embedded raster images as JPEG.
 * Text, vector graphics, fonts and links are left untouched. Images that would lose
 * information in JPEG (transparency, masks, 1-bit scans) are skipped, and a re-encoded image
 * only replaces the original when it is actually smaller.
 */
internal object PdfCompressor {

  data class Result(val inputBytes: Long, val outputBytes: Long, val imagesRecompressed: Int)

  fun compress(input: File, output: File, preset: CompressionPreset): Result {
    var recompressed = 0
    PdfIo.use(input) { document ->
      val replaced = IdentityHashMap<COSBase, PDImageXObject>()
      val visitedForms = IdentityHashMap<COSBase, Boolean>()
      for (page in document.pages) {
        recompressed += processResources(document, page.resources, preset, replaced, visitedForms)
      }
      PdfIo.save(document, output)
    }
    return Result(input.length(), output.length(), recompressed)
  }

  private fun processResources(
    document: PDDocument,
    resources: PDResources?,
    preset: CompressionPreset,
    replaced: IdentityHashMap<COSBase, PDImageXObject>,
    visitedForms: IdentityHashMap<COSBase, Boolean>,
  ): Int {
    if (resources == null) return 0
    var count = 0
    for (name in resources.xObjectNames.toList()) {
      when (val xObject = resources.getXObject(name)) {
        is PDImageXObject -> {
          // Images shared by several pages are re-encoded once and reused.
          val key = xObject.cosObject
          val replacement = replaced.getOrPut(key) { recompress(document, xObject, preset) ?: xObject }
          if (replacement !== xObject) {
            resources.put(name, replacement)
            count++
          }
        }
        is PDFormXObject -> {
          if (visitedForms.put(xObject.cosObject, true) == null) {
            count += processResources(document, xObject.resources, preset, replaced, visitedForms)
          }
        }
      }
    }
    return count
  }

  private fun recompress(document: PDDocument, image: PDImageXObject, preset: CompressionPreset): PDImageXObject? {
    val originalBytes = image.cosObject.length
    val skip = image.isStencil ||
      image.bitsPerComponent <= 1 ||
      image.softMask != null ||
      image.mask != null ||
      originalBytes < MIN_IMAGE_BYTES
    if (skip) return null

    val longestEdge = max(image.width, image.height)
    // Integer sub-sampling while decoding keeps peak memory close to the target size.
    val subsampling = max(1, longestEdge / preset.maxEdgePx)
    val decoded = try {
      image.getImage(null, subsampling)
    } catch (error: OutOfMemoryError) {
      return null
    } ?: return null

    val bitmap = scaleToFit(decoded, preset.maxEdgePx)
    return try {
      val candidate = JPEGFactory.createFromImage(document, bitmap, preset.jpegQuality)
      if (candidate.cosObject.length < originalBytes) candidate else null
    } finally {
      if (bitmap !== decoded) bitmap.recycle()
      decoded.recycle()
    }
  }

  private fun scaleToFit(bitmap: Bitmap, maxEdge: Int): Bitmap {
    val longest = max(bitmap.width, bitmap.height)
    if (longest <= maxEdge) return bitmap
    val scale = maxEdge.toFloat() / longest
    return Bitmap.createScaledBitmap(
      bitmap,
      (bitmap.width * scale).roundToInt().coerceAtLeast(1),
      (bitmap.height * scale).roundToInt().coerceAtLeast(1),
      true,
    )
  }
}
