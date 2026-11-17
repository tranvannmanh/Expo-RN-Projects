# Document Scanner: Kết quả Phase 4 (PDF, xuất file, chia sẻ)

> Phase 4 gồm: sinh lại PDF theo thứ tự trang hiện tại, xuất PDF ra Documents/ScannerApp hoặc vị trí người dùng chọn, chia sẻ PDF, và xuất hoặc chia sẻ ảnh từng trang.
> Ngày cập nhật: 2026-11-17. Nền tảng: Android.

## 1. Tóm tắt

| Hạng mục | Trạng thái |
|---|---|
| Lưu PDF trong bộ nhớ riêng (`documents/{id}/document.pdf`), sinh lại khi trang thay đổi | ✅ Đã test |
| Xuất ra **Documents/ScannerApp** (MediaStore, Android 10+) | ✅ Đã test |
| Xuất ra **vị trí người dùng chọn** (SAF `ACTION_CREATE_DOCUMENT`) | ✅ Đã test |
| Chia sẻ PDF (share sheet của Android) | ✅ Đã test |
| Xuất ảnh từng trang ra Pictures/ScannerApp, chia sẻ ảnh trang | ✅ Đã test |
| Không xin quyền storage | ✅ Không thêm permission nào |
| Giữ bản riêng sau khi xuất; xoá bản đã xuất không ảnh hưởng bản riêng | ✅ Đã test |

## 2. Luồng xử lý

```
Bấm Share / Save / Save as…
  → ensurePdf(db, id)
      PDF trong DB còn đúng và file tồn tại?  → dùng luôn
      Ngược lại → kiểm tra mọi trang còn file → Kotlin generatePdfAsync(pages theo thứ tự)
               → UPDATE pdf_path ... WHERE updated_at = <giá trị lúc đọc>   (khoá lạc quan)
  → Share:   copy sang cache/share/<Tên>.pdf → expo-sharing (FileProvider) → share sheet
  → Save:    Kotlin saveToPublicFolderAsync → MediaStore Documents/ScannerApp (IS_PENDING)
  → Save as: Kotlin saveWithPickerAsync → ACTION_CREATE_DOCUMENT → stream vào URI đã chọn
```

- **Sinh lại PDF khi cần:** Phase 2 đã đặt `pdf_path = NULL` và xoá file PDF mỗi khi thêm, xoá hoặc sắp xếp lại trang. Lần xuất tiếp theo sẽ sinh lại theo thứ tự hiện tại.
- **Khoá lạc quan:** nếu trang bị thay đổi trong lúc đang sinh PDF, `setPdfPath` không ghi gì (vì `updated_at` đã khác), nên DB không bao giờ trỏ tới một PDF đã cũ. Gọi `ensurePdf` nhiều lần cùng lúc cho cùng một document thì chỉ chạy một lần build.
- **Tên file khi xuất** lấy theo tên document, đã lọc ký tự không hợp lệ (ví dụ `Hop dong thue nha.pdf`, `Hop dong thue nha - page 2.jpg`). Nếu trùng tên, MediaStore tự thêm ` (1)`, và app hiển thị đúng tên cuối cùng.

## 3. Bộ tạo PDF (Kotlin)

**Quyết định:** tự viết một bộ ghi PDF 1.4 tối giản, nhúng nguyên byte JPEG (`/DCTDecode`), thay vì dùng `android.graphics.pdf.PdfDocument`.

**Lý do (đã đo trên emulator):** với 3 trang ảnh 3000×3000 px (mỗi ảnh khoảng 1.1 MB):

| Cách làm | Kích thước PDF |
|---|---|
| `PdfDocument` (bitmap được nén lại dạng FlateDecode) | **32.9 MB** (khoảng 11 MB/trang) |
| Nhúng nguyên JPEG (DCTDecode) | **3.4 MB** (bằng tổng các file JPEG) |

Ưu điểm khác của cách nhúng JPEG:
- Không phải decode bitmap, nên tốn rất ít RAM kể cả với 50 trang.
- Chất lượng giữ nguyên như output của ML Kit.
- Nhanh hơn: khoảng 2 giây cho cả luồng 3 trang 3000 px.

**Chi tiết:**
- Trang rộng 595 pt (A4), chiều cao theo tỉ lệ của từng ảnh.
- Kích thước ảnh và số kênh màu được đọc từ header JPEG, không cần decode.
- Ảnh không nhúng thẳng được (ví dụ JPEG CMYK hoặc định dạng khác) sẽ được encode lại thành JPEG chất lượng 90, cạnh dài tối đa 3000 px.
- File được ghi ra `.part` rồi mới đổi tên. Bảng xref đã được kiểm tra bằng script: 11/11 offset đúng.
- PDF đã được kiểm tra bằng Quick Look trên macOS: hiển thị đúng.

## 4. Quyền và bảo mật
- **Không thêm permission nào.** MediaStore (Android 10+) cho phép app tạo file trong Documents và Pictures mà không cần quyền. SAF chỉ cấp quyền truy cập đúng file vừa tạo.
- Android 7–9 không có MediaStore `RELATIVE_PATH`, nên app ẩn nút "Save" và chỉ hiện "Save as…" (SAF).
- Hàm native chỉ nhận URI `file://` nằm trong `filesDir/documents` (đường dẫn được chuẩn hoá để chặn path traversal), và chỉ chấp nhận MIME `application/pdf` hoặc `image/jpeg`. Tên file được lọc bỏ ký tự không hợp lệ.
- Khi ghi vào MediaStore, file được đánh dấu `IS_PENDING=1` trong lúc ghi để app khác chưa thấy file dở. Nếu lỗi thì xoá entry. Nếu ghi SAF lỗi thì xoá file đích.
- Bản copy để chia sẻ nằm trong `cache/share/` và bị xoá ở lần chia sẻ sau. Đây là file tạm, không phải dữ liệu lâu dài.
- **Config plugin của `expo-sharing`:** cài gói này sẽ tự thêm plugin vào `app.json`. Mặc định plugin này **không** biến app thành nơi nhận share (`android.enabled` và `ios.enabled` đều là `false`); nó chỉ cung cấp FileProvider để chia sẻ file ra ngoài.

## 5. Mã lỗi mới

| Code | Khi nào |
|---|---|
| `PDF_EXPORT_ERROR` | Sinh PDF lỗi (ảnh hỏng, hết RAM, …) |
| `EXPORT_ERROR` | Ghi vào MediaStore hoặc SAF lỗi; MIME không hợp lệ |
| `EXPORT_UNSUPPORTED` | Lưu vào thư mục chung trên Android < 10 |
| `EXPORT_IN_PROGRESS` | Đang mở một bộ chọn SAF khác |
| `SHARE_UNAVAILABLE` | Thiết bị không hỗ trợ chia sẻ |
| `FILE_NOT_FOUND` | Có trang mất file, nên không sinh được PDF (app báo số trang bị mất) |

## 6. Thay đổi file

**Native** (`modules/document-scanner/android/.../documentscanner/`):
- `PdfGenerator.kt`: bộ ghi PDF nhúng JPEG, đọc header JPEG, encode lại khi cần.
- `PublicExporter.kt`: MediaStore và copy sang URI của SAF.
- `CreateDocumentContract.kt`: contract SAF qua Activity Result API của Expo.
- `DocumentScannerModule.kt`: thêm `canSaveToPublicFolder`, `generatePdfAsync`, `saveToPublicFolderAsync`, `saveWithPickerAsync`, và các hàm kiểm tra đường dẫn, MIME, tên file.
- `DocumentScannerException.kt`: thêm 4 mã lỗi mới.

**TypeScript:**
- `modules/document-scanner/index.ts` và `src/*`: API mới, type `PublicFolderExport`, `PickerExport`.
- `services/export.service.ts`: `ensurePdf`, xuất và chia sẻ PDF hoặc ảnh trang, tạo tên file khi xuất.
- `repositories/document.repository.ts`: thêm `setPdfPath` (khoá lạc quan).
- `hooks/useDocumentExport.ts`; `useDocumentMutation` được export để dùng lại.
- `components/PdfActionsCard.tsx`; `ScanStatusBanner` đổi tên thành `StatusBanner` (thêm biến thể `success`); `ActionButton` thêm biến thể `tonal`; `PagePreviewModal` thêm nút chia sẻ và lưu trang.
- `app/documents/[id].tsx` (152 dòng).

**Dependency:** `expo-sharing ~56.0.27` (native, có config plugin). **Cần prebuild và build lại.**

## 7. Kết quả kiểm thử (emulator Pixel 7 Pro, API 34)

| Kịch bản | Kết quả |
|---|---|
| Document đã sắp xếp lại (PDF bị đánh dấu cũ), bấm **Save** | ✅ PDF được sinh lại; `/sdcard/Documents/ScannerApp/Hop dong thue nha.pdf`; banner hiện đường dẫn; nhãn chuyển thành "PDF ready" |
| Kiểm tra cấu trúc PDF | ✅ 3 trang, `/DCTDecode`, xref hợp lệ, Quick Look hiển thị đúng |
| Đo với ảnh 3000 px (thay ảnh tạm rồi khôi phục) | ✅ 3.4 MB, khoảng 2 giây (bản `PdfDocument` cũ là 32.9 MB) |
| **Share** PDF | ✅ Share sheet hiện "Hop dong thue nha.pdf" (Drive, Bluetooth, Print, …) |
| **Choose another location…** | ✅ Bộ chọn SAF mở ở Documents, điền sẵn tên, Save, file được tạo |
| Preview, **lưu trang 2** | ✅ `/sdcard/Pictures/ScannerApp/Hop dong thue nha - page 2.jpg` |
| Preview, **chia sẻ trang 2** | ✅ Share sheet hiện ảnh |
| Xoá mọi bản đã xuất | ✅ `document.pdf` và các trang trong bộ nhớ riêng vẫn còn |
| `tsc --noEmit`, Gradle build | ✅ |

**Chưa test:** Android 7–9 (chỉ có SAF); trường hợp đầy bộ nhớ; 50 trang; chia sẻ thật tới một app cụ thể (mới mở share sheet); trùng tên trong MediaStore (` (1)`); máy thật.

## 8. Hạn chế
1. Không ép được bộ chọn SAF mở ở `Documents/ScannerApp`. App chỉ gợi ý thư mục ban đầu là Documents, còn người dùng tự chọn. Muốn có đúng `Documents/ScannerApp` thì dùng nút **Save** (MediaStore).
2. Xoá document trong app **không** xoá các bản đã xuất ra ngoài. Đây là hành vi đúng theo spec, vì bản xuất thuộc về người dùng.
3. PDF chỉ chứa ảnh, chưa có lớp text (OCR).
4. Bản copy trong `cache/share` chỉ được xoá ở lần chia sẻ tiếp theo (hoặc khi hệ điều hành dọn cache).

## 9. Phase tiếp theo
**Phase 5: kiểm thử và tối ưu**
- Cài Jest (`jest-expo`) và mock native module; viết test cho repository (dùng SQLite trong bộ nhớ), service, ánh xạ kết quả scan, xử lý lỗi, luồng xuất.
- Test với document lớn (50 trang), tối ưu danh sách (FlashList nếu cần).
- Khôi phục sau khi app khởi động lại, kịch bản hết bộ nhớ, và checklist test thủ công trên máy thật.
