package expo.modules.documentscanner

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal const val MAX_PAGE_LIMIT = 50

internal class ScanOptions : Record {
  /** Existing document to append pages to. A new id is generated when null. */
  @Field
  val documentId: String? = null

  @Field
  val pageLimit: Int = MAX_PAGE_LIMIT

  @Field
  val galleryImport: Boolean = true

  /** Whether ML Kit should also produce a PDF for this scan session. */
  @Field
  val includePdf: Boolean = true
}
