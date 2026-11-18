package expo.modules.pdftools

import android.content.Context
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.PDPage
import com.tom_roush.pdfbox.pdmodel.PDPageContentStream
import com.tom_roush.pdfbox.pdmodel.common.PDRectangle
import com.tom_roush.pdfbox.pdmodel.font.PDFont
import com.tom_roush.pdfbox.pdmodel.font.PDType0Font
import com.tom_roush.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState
import com.tom_roush.pdfbox.util.Matrix
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File
import kotlin.math.atan2
import kotlin.math.hypot

/**
 * Liberation Sans ships inside pdfbox-android and covers the full Vietnamese alphabet
 * (verified: every precomposed Vietnamese letter has a glyph), so no extra font is bundled.
 */
private const val FONT_ASSET = "com/tom_roush/pdfbox/resources/ttf/LiberationSans-Regular.ttf"

/** Diagonal text never spans more than this share of the page diagonal. */
private const val DIAGONAL_MAX_SPAN = 0.8f
private const val TILE_ANGLE_DEGREES = 30.0
/** Gap between tiled repetitions, as a multiple of the font size. */
private const val TILE_GAP_EM = 4f
private const val BOTTOM_MARGIN_PT = 24f
private const val MAX_TEXT_LENGTH = 120

internal class WatermarkOptions : Record {
  @Field val text: String = ""
  /** PDF points (1/72 in). */
  @Field val fontSize: Float = 48f
  /** 0.05–1 */
  @Field val opacity: Float = 0.25f
  /** #RRGGBB */
  @Field val color: String = "#FF0000"
  /** diagonal | tiled | bottom */
  @Field val position: String = "diagonal"
}

internal object PdfWatermarker {

  fun apply(context: Context, input: File, output: File, options: WatermarkOptions): Int {
    val text = options.text.trim().replace(Regex("\\s+"), " ").take(MAX_TEXT_LENGTH)
    if (text.isEmpty()) throw PdfToolsException(PdfToolsErrorCode.PDF_OPERATION_ERROR, "Watermark text is empty")
    val rgb = parseColor(options.color)

    return PdfIo.use(input) { document ->
      val font = context.assets.open(FONT_ASSET).use { PDType0Font.load(document, it, true) }
      val state = PDExtendedGraphicsState().apply {
        nonStrokingAlphaConstant = options.opacity.coerceIn(0.05f, 1f)
      }
      for (page in document.pages) {
        PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true).use { stream ->
          stream.saveGraphicsState()
          stream.setGraphicsStateParameters(state)
          stream.setNonStrokingColor(rgb[0], rgb[1], rgb[2])
          // Draw in the page's *displayed* orientation, even when /Rotate is set.
          stream.transform(displayToUserSpace(page))
          val box = displayedSize(page)
          when (options.position) {
            "tiled" -> drawTiled(stream, font, text, options.fontSize, box)
            "bottom" -> drawBottom(stream, font, text, options.fontSize, box)
            else -> drawDiagonal(stream, font, text, options.fontSize, box)
          }
          stream.restoreGraphicsState()
        }
      }
      PdfIo.save(document, output)
      document.numberOfPages
    }
  }

  private fun drawDiagonal(stream: PDPageContentStream, font: PDFont, text: String, requestedSize: Float, box: Size) {
    val diagonal = hypot(box.width, box.height)
    val size = fitFontSize(font, text, requestedSize, diagonal * DIAGONAL_MAX_SPAN)
    val angle = atan2(box.height.toDouble(), box.width.toDouble())
    drawCentered(stream, font, text, size, box.width / 2, box.height / 2, angle)
  }

  private fun drawTiled(stream: PDPageContentStream, font: PDFont, text: String, size: Float, box: Size) {
    val textWidth = width(font, text, size)
    val stepX = textWidth + size * TILE_GAP_EM
    val stepY = size * TILE_GAP_EM
    val angle = Math.toRadians(TILE_ANGLE_DEGREES)
    // Cover the rotated grid generously; content outside the page is clipped by the viewer.
    val reach = hypot(box.width, box.height)
    var y = -reach
    var row = 0
    while (y < reach * 2) {
      var x = -reach + if (row % 2 == 0) 0f else stepX / 2
      while (x < reach * 2) {
        drawCentered(stream, font, text, size, x, y, angle)
        x += stepX
      }
      y += stepY
      row++
    }
  }

  private fun drawBottom(stream: PDPageContentStream, font: PDFont, text: String, requestedSize: Float, box: Size) {
    val size = fitFontSize(font, text, requestedSize, box.width - BOTTOM_MARGIN_PT * 2)
    drawCentered(stream, font, text, size, box.width / 2, BOTTOM_MARGIN_PT + size / 2, 0.0)
  }

  private fun drawCentered(
    stream: PDPageContentStream,
    font: PDFont,
    text: String,
    size: Float,
    centerX: Float,
    centerY: Float,
    angle: Double,
  ) {
    val halfWidth = width(font, text, size) / 2
    // Cap height ≈ 0.7 em: centres the glyphs vertically on the anchor point.
    val halfHeight = size * 0.35f
    val matrix = Matrix.getRotateInstance(angle, centerX, centerY)
    matrix.translate(-halfWidth, -halfHeight)
    stream.beginText()
    stream.setFont(font, size)
    stream.setTextMatrix(matrix)
    stream.showText(text)
    stream.endText()
  }

  private fun fitFontSize(font: PDFont, text: String, requested: Float, maxWidth: Float): Float {
    val natural = width(font, text, requested)
    return if (natural <= maxWidth) requested else requested * maxWidth / natural
  }

  private fun width(font: PDFont, text: String, size: Float) = font.getStringWidth(text) / 1000f * size

  private data class Size(val width: Float, val height: Float)

  private fun displayedSize(page: PDPage): Size {
    val box: PDRectangle = page.cropBox
    val rotated = page.rotation % 180 != 0
    return if (rotated) Size(box.height, box.width) else Size(box.width, box.height)
  }

  /** Maps coordinates of the displayed (rotated) page into PDF user space. */
  private fun displayToUserSpace(page: PDPage): Matrix {
    val box = page.cropBox
    val matrix = Matrix.getTranslateInstance(box.lowerLeftX, box.lowerLeftY)
    when ((page.rotation % 360 + 360) % 360) {
      90 -> { matrix.translate(box.width, 0f); matrix.rotate(Math.PI / 2) }
      180 -> { matrix.translate(box.width, box.height); matrix.rotate(Math.PI) }
      270 -> { matrix.translate(0f, box.height); matrix.rotate(-Math.PI / 2) }
    }
    return matrix
  }

  private fun parseColor(hex: String): FloatArray {
    val match = Regex("^#([0-9a-fA-F]{6})$").find(hex)
      ?: throw PdfToolsException(PdfToolsErrorCode.PDF_OPERATION_ERROR, "Color must be #RRGGBB")
    val value = match.groupValues[1].toInt(16)
    return floatArrayOf((value shr 16 and 0xFF) / 255f, (value shr 8 and 0xFF) / 255f, (value and 0xFF) / 255f)
  }
}
