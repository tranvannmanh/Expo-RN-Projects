# Document Scanner: Kết quả Phase 3 (Giao diện)

> Phase 3 gồm: điều hướng bằng Expo Router, màn hình Scan (nhập tên), màn hình chi tiết document (preview, sắp xếp lại, xoá trang, thêm trang, đổi tên).
> Ngày cập nhật: 2026-11-17. Nền tảng: Android.

## 1. Tóm tắt

| Hạng mục | Trạng thái |
|---|---|
| DocumentListScreen `/`: danh sách, tên, số trang, ngày, xoá, mở chi tiết, tạo mới | ✅ Đã test |
| ScanScreen `/scan`: nhập tên, mở scanner, hiển thị tiến trình, xử lý huỷ và lỗi | ✅ Đã test |
| DocumentDetailScreen `/documents/[id]`: lưới thumbnail, số trang | ✅ Đã test |
| Preview toàn màn hình (vuốt, pinch, double tap, nút zoom) | ✅ Đã test ở Phase 1 (dùng lại) |
| Sắp xếp lại trang (◀ ▶, Lưu/Huỷ) | ✅ Đã test, đối chiếu DB |
| Xoá trang (có xác nhận; xoá trang cuối thì xoá cả document) | ✅ Đã test (trường hợp trang cuối chưa test) |
| Thêm trang vào document có sẵn | ✅ Đã test, đối chiếu DB |
| Đổi tên (dialog, kiểm tra tên rỗng) | ✅ Đã test |
| Nút Back của Android | ✅ Header native; Modal dùng `onRequestClose` |
| Trạng thái loading, rỗng, lỗi; chống bấm trùng | ✅ |
| Xuất và chia sẻ PDF | ⏳ Phase 4 |

## 2. Điều hướng

```
src/app/
├── _layout.tsx            # Stack: index (không header), scan, documents/[id] (header native)
├── index.tsx              # DocumentListScreen
├── scan.tsx               # ScanScreen
└── documents/[id].tsx     # DocumentDetailScreen
```

- Danh sách: bấm "Scan document" mở `/scan`; bấm vào một document mở `/documents/[id]`.
- Scan thành công thì `router.replace` sang màn hình chi tiết, để nút Back quay về danh sách thay vì quay lại màn hình Scan.
- Màu header lấy từ theme của React Navigation (`DarkTheme`/`DefaultTheme`).

## 3. Màn hình

### ScanScreen
- Ô "Document name" có thể để trống. Khi trống, tên mặc định là `Scan <ngày giờ>` (hiện sẵn làm placeholder). Tối đa 120 ký tự.
- Khi scanner đang mở: nút bị khoá và hiện "Scanning…", kèm dòng giải thích rằng scanner đang mở.
- Huỷ: hiện banner "Scan cancelled. Nothing was saved." và vẫn ở lại màn hình.
- Lỗi: hiện banner với thông báo dễ hiểu và mã lỗi. Chi tiết kỹ thuật được ghi bằng `console.error`.

### DocumentDetailScreen
- **Card thông tin:** tên (nút bút chì để đổi tên), số trang, ngày tạo, và trạng thái PDF: "PDF ready" hoặc "PDF will be rebuilt on export" nếu trang đã thay đổi.
- **Lưới trang:** 3 cột trên điện thoại, 4 cột khi màn hình rộng từ 600dp. Bấm vào trang để mở preview; nút thùng rác để xoá trang.
- **Chế độ sắp xếp:** mỗi trang có nút ◀ ▶; mũi tên ở hai đầu tự khoá. Thứ tự nháp nằm trong state cục bộ (`usePageReorder`), chỉ ghi vào DB khi bấm "Save order". Bấm "Cancel" thì bỏ thay đổi. Nếu không có thay đổi thì không ghi DB.
- **Xoá trang cuối cùng:** app báo rằng document cần ít nhất 1 trang và đề nghị xoá cả document, sau đó quay về danh sách.
- **Thêm trang:** mở scanner với `{ documentId, includePdf: false }`, rồi nối trang mới vào cuối.
- **Trang bị mất file** (bị xoá từ bên ngoài app): hiện ô "Missing" thay vì ảnh trắng.
- Khi có thao tác đang chạy (`busy`), mọi nút đều bị khoá.

## 4. Kiến trúc

| Lớp | File |
|---|---|
| Screen (chỉ render và điều hướng) | `app/index.tsx`, `app/scan.tsx`, `app/documents/[id].tsx` (138 dòng) |
| Hook gom state của màn hình | `hooks/useDocumentDetailScreen.ts` |
| Query | `useDocuments`, `useDocument`, `useDocumentPages` |
| Mutation | `useScanNewDocument`, `useDeleteDocument`, `useDocumentMutations.ts` (`useRenameDocument`, `useDeletePage`, `useReorderPages`, `useAddPages`) |
| State UI | `usePageReorder`, `usePagePreview`, `usePinchZoom` |
| Component | `DocumentSummaryCard`, `PageGrid`, `PageThumbnail` (chế độ view/reorder), `RenameDocumentDialog`, `ActionButton`, `ScanTips`, `ScanStatusBanner`, `EmptyScanState`, `PagePreviewModal` |
| Dùng chung | `components/themed-text-input.tsx` |

- Mọi mutation đi qua `useDocumentMutation`: lỗi được chuẩn hoá thành `DocumentError`, có log, và mọi query có tiền tố `['documents']` được invalidate sau `onSettled`.
- Thêm hằng số `MAX_PAGE_LIMIT` vào TS API của module. Giá trị phải khớp với `ScanOptions.kt`.

## 5. Kết quả kiểm thử (emulator Pixel 7 Pro, API 34)

| Kịch bản | Kết quả |
|---|---|
| Danh sách, Scan document, mở `/scan` | ✅ |
| Nhập "Hop dong 2026", scan 3 trang | ✅ Tự chuyển sang chi tiết, tiêu đề đúng tên |
| Reorder: đưa trang 3 lên trước, Save | ✅ DB: `001, 003, 002`; `pdf_path = NULL`; file PDF bị xoá; nhãn chuyển sang "rebuilt on export" |
| Xoá trang 2, xác nhận | ✅ DB: `001, 002` đánh số lại liền mạch; file `003` bị xoá; `page_count = 2` |
| Add pages, scan 1 trang | ✅ DB: thêm `page_mwkdrop2_001` làm trang 3; `page_count = 3`; không có PDF mới |
| Đổi tên thành "Hop dong thue nha" | ✅ Header, card và danh sách đều cập nhật |
| Nút Back của Android từ chi tiết | ✅ Về danh sách |
| Mở scanner rồi đóng bằng nút X | ✅ Hiện banner huỷ, ở lại `/scan` |
| `tsc --noEmit` | ✅ |

**Lỗi tìm ra và đã sửa khi test:**
- Ở chế độ sắp xếp, cả thumbnail bị mờ vì Pressable bị khoá. Đã đổi sang view thường cho chế độ này.
- Mũi tên ở hai đầu không trông như bị khoá vì opacity riêng của nút đè style `disabled`. Đã bỏ opacity riêng.

**Chưa test:** xoá trang cuối cùng (luồng xoá cả document); scan lỗi thật (ví dụ thiếu Play Services); dark mode cho các màn hình mới; tablet hoặc màn hình xoay ngang; TalkBack.

## 6. Hạn chế
1. Sắp xếp lại dùng nút ◀ ▶, chưa có kéo thả. Nếu cần kéo thả có thể làm thêm bằng gesture-handler kết hợp Reanimated (đã có sẵn) hoặc một thư viện sortable.
2. Preview không dùng thứ tự nháp khi đang ở chế độ sắp xếp, vì bấm vào trang bị tắt trong chế độ này.
3. Nếu bạn rời màn hình trong lúc scanner đang mở thì promise vẫn chạy. Kết quả vẫn được lưu nhưng không có màn hình nào hiển thị.

## 7. Phase tiếp theo
**Phase 4: PDF**
- Sinh lại PDF từ các ảnh JPEG theo thứ tự hiện tại, bằng `android.graphics.pdf.PdfDocument` trong module Kotlin.
- Xuất PDF ra thư mục do người dùng chọn qua SAF (`Directory.pickDirectoryAsync`), không xin quyền storage.
- Chia sẻ PDF bằng share sheet của Android.
