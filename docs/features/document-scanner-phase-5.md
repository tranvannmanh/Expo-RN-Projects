# Document Scanner: Kết quả Phase 5 (Kiểm thử và tối ưu)

> Phase 5 gồm: hạ tầng Jest, 72 unit/integration test, sửa lỗi phát hiện qua test, tối ưu bộ nhớ, và checklist test thủ công.
> Ngày cập nhật: 2026-11-17.

## 1. Tóm tắt

| Hạng mục | Trạng thái |
|---|---|
| Jest (`jest-expo`) và mock native module, file system, sharing | ✅ |
| Repository chạy trên **SQLite thật** (`node:sqlite`, cùng schema và SQL với app) | ✅ |
| 72 test, chạy khoảng 1 giây, ổn định qua 5 lần chạy liên tiếp | ✅ |
| Kiểm tra độ nhạy của test (cố ý làm hỏng code) | ✅ 2/2 lỗi cố ý đều bị bắt |
| Lỗi thật phát hiện nhờ test: khoá lạc quan dùng `updated_at` | ✅ Đã sửa và có test |
| Tối ưu bộ nhớ khi preview document lớn | ✅ |
| Dọn bản copy chia sẻ lúc khởi động | ✅ |
| Checklist test thủ công trên máy thật | ✅ [document-scanner-manual-test-checklist.md](document-scanner-manual-test-checklist.md) |

## 2. Chạy test

```bash
yarn test              # hoặc: npx jest
yarn test --coverage
```

**Yêu cầu Node ≥ 22.5**, vì test dùng `node:sqlite` có sẵn trong Node. Node sẽ in cảnh báo `ExperimentalWarning: SQLite`; đây là cảnh báo bình thường.

## 3. Hạ tầng

| File | Vai trò |
|---|---|
| `jest/sqliteTestDatabase.ts` | Bọc `node:sqlite` theo đúng phần API của expo-sqlite mà app dùng (`runAsync`, `getFirstAsync`, `getAllAsync`, `execAsync`, `withExclusiveTransactionAsync` với BEGIN EXCLUSIVE, COMMIT và ROLLBACK) |
| `jest/mocks/expoFileSystem.ts` | `File`, `Directory`, `Paths` chạy trong bộ nhớ, kèm helper `memoryFs` |
| `jest/mocks/nativeScanner.ts` | Native module dạng `jest.fn()`, và `nativeError(code)` giả lập lỗi trả về từ native |
| `jest/setup.ts` | Đăng ký mock và reset trạng thái trước mỗi test |
| `jest/fixtures.ts` | `createMigratedDatabase`, `fakeScan` (giả lập output của native: file và URI), `pageOrder` |

- **Native scanner được mock ở tầng `DocumentScannerModule.ts`.** Vì vậy phần JS bọc ngoài (`index.ts`: chuyển lỗi native thành mã lỗi, kiểm tra module có tồn tại không) vẫn được test bằng code thật. UI scanner của ML Kit không chạy trong Jest.
- **Dependency thêm (dev):** `jest ~29.7.0`, `jest-expo ~56.0.6`, `@types/jest 29.5.14`, `@react-native/jest-preset 0.85.3` (peer dependency bắt buộc của jest-expo 56, cùng phiên bản với React Native).
- `tsconfig.json`: thêm `"types": ["jest"]`, vì TypeScript 6 không còn tự nạp global types.
- `package.json`: thêm script `test`, `test:watch` và khối cấu hình `jest`.

## 4. Các test

| File | Số test | Nội dung |
|---|---|---|
| `shared/database/__tests__/migrations.test.ts` | 3 | Tạo schema v1; chạy lại không đổi gì; từ chối DB có version mới hơn app |
| `__tests__/document.repository.test.ts` | 17 | CRUD; danh sách và ảnh bìa; **rollback transaction**; foreign key; append; xoá trang và đánh số lại; reorder (thiếu, trùng, trang của document khác thì rollback); đổi tên; cascade; `setPdfPath`; **document 50 trang** |
| `__tests__/document.service.test.ts` | 15 | Tạo document từ scan; **xoá file khi lưu DB lỗi**; thêm trang (lỗi thì chỉ xoá file mới); xoá document và trang (kể cả khi file đã mất sẵn); reorder; đổi tên; chuẩn hoá tên; **khôi phục sau khởi động lại** (dọn thư mục mồ côi, dọn bản copy chia sẻ, chỉ chạy 1 lần mỗi phiên) |
| `__tests__/export.service.test.ts` | 21 | Dùng lại PDF còn đúng; sinh lại theo thứ tự mới; sinh lại khi file PDF mất; **PDF cũ đi trong lúc build thì không ghi nhận**; nhiều lời gọi cùng lúc chỉ build 1 lần; trang mất file thì báo `FILE_NOT_FOUND`; mã lỗi native được giữ nguyên và có thể thử lại; lưu Documents với tên đã lọc; picker bị huỷ; bản riêng vẫn còn sau khi xuất; chia sẻ qua cache; `SHARE_UNAVAILABLE`; xuất ảnh trang; `exportBaseName` |
| `__tests__/scanResultMapping.test.ts` | 6 | Ánh xạ URI sang đường dẫn tương đối và sắp theo số trang; từ chối kết quả bị huỷ, rỗng, thiếu id, hoặc URI nằm ngoài thư mục documents |
| `__tests__/errors.test.ts` | 8 | Mã lỗi native sang `DocumentScannerError` sang `DocumentError`; mã lạ thì dùng mã dự phòng; mọi mã lỗi đều có thông báo hiển thị |
| `__tests__/nativeModuleMissing.test.ts` | 2 | Không có native module (iOS, web, Expo Go): báo `SCANNER_UNAVAILABLE`, không crash |

**Độ phủ test (`--coverage`):**

| File | Lines |
|---|---|
| `document.repository.ts` | 100% |
| `scanResultMapping.ts`, `errors.ts`, `documentErrorMessage.ts`, `migrations.ts` | 100% |
| `documentFileStorage.ts` | 100% |
| `export.service.ts` | 98% |
| `document.service.ts` | 90% (phần chưa phủ: `listDocuments`/`listPages`/`getDocument`, chỉ là lớp bọc mỏng) |
| `modules/document-scanner/index.ts` | 81% |

Hook và component React **chưa có test** (cần thêm `@testing-library/react-native`). Hiện các phần này được kiểm thử thủ công trên emulator.

**Kiểm tra độ nhạy của test:** mình tạm làm hỏng code ở 2 chỗ, chạy test, rồi khôi phục:
1. Bỏ `pdf_path = NULL` khi trang thay đổi: **6 test fail**.
2. Bỏ bước xoá file khi tạo document lỗi: **1 test fail**.

## 5. Lỗi phát hiện và đã sửa

**Khoá lạc quan dùng `updated_at` có thể bỏ sót thay đổi** (phát hiện vì test lúc pass lúc fail):
- `setPdfPath` chỉ ghi khi `updated_at` vẫn bằng giá trị đã đọc trước khi build PDF.
- Nếu reorder, xoá hoặc thêm trang xảy ra **trong cùng một mili giây** với lần đọc, `updated_at` không đổi. Khi đó DB sẽ ghi nhận một PDF có thứ tự trang sai.
- **Cách sửa:** mọi lần ghi đều dùng `updated_at = MAX(now, updated_at + 1)`, nên giá trị luôn tăng thực sự. Đã thêm test riêng cho trường hợp cùng mili giây.

## 6. Tối ưu

| Vấn đề | Cách xử lý |
|---|---|
| Preview dùng `FlatList` với `windowSize` mặc định 21, nên có thể giữ **khoảng 21 ảnh full-size** trong bộ nhớ với document 50 trang | `windowSize=3`, `initialNumToRender=1`, `maxToRenderPerBatch=1`, `removeClippedSubviews`: chỉ trang hiện tại và 2 trang kề bên |
| Bản copy trong `cache/share` chỉ được xoá ở lần chia sẻ sau | `reconcileStorage` xoá chúng khi app khởi động |
| PDF lớn | Đã xử lý ở Phase 4: nhúng nguyên JPEG, 3.4 MB thay vì 32.9 MB, không decode bitmap |
| Thumbnail | `expo-image` tự thu nhỏ ảnh theo kích thước view, nên không decode ảnh full-size cho thumbnail |
| Danh sách document | Đã dùng `FlatList` (virtualized) |

**Chưa đo:** FPS và bộ nhớ thực tế trên máy thật với 50 trang. Nên đo bằng Android Studio Profiler theo checklist.

## 7. Tổng kết các phase

| Phase | Kết quả |
|---|---|
| 0 | Phân tích project |
| 1 | Native module ML Kit, lưu file vào bộ nhớ riêng |
| 2 | SQLite, repository, đồng bộ DB và file, dọn thư mục mồ côi |
| 3 | Giao diện: danh sách, Scan, chi tiết (reorder, xoá, thêm trang, đổi tên), preview kèm zoom |
| 4 | Sinh PDF (nhúng JPEG), xuất qua MediaStore hoặc SAF, chia sẻ, xuất ảnh trang |
| 5 | 72 test, sửa lỗi khoá lạc quan, tối ưu bộ nhớ, checklist test thủ công |

## 8. Việc còn lại / đề xuất
1. **Chạy checklist test thủ công trên máy thật**: chưa có máy thật nào được test.
2. **EAS Build:** chưa có `eas.json`. Cần chạy `eas build:configure` và tạo profile `development` và `production`.
3. Test UI bằng `@testing-library/react-native`, nhất là `usePageReorder` và `useDocumentDetailScreen`.
4. Unit test Kotlin (JVM) cho `PdfGenerator`/`JpegInfo` và phần kiểm tra đường dẫn.
5. Chất lượng ảnh (OpenCV): interface `ImageQualityService` chưa được tạo. Các cột `is_blank` và `sharpness_score` vẫn là NULL (chưa phân tích).
6. Kéo thả để sắp xếp trang; OCR để PDF tìm kiếm được.
