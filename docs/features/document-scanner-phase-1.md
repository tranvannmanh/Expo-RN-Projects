# Document Scanner: Kết quả Phase 1

> Phase 1 gồm: Expo native module (Kotlin) tích hợp Google ML Kit Document Scanner, lưu kết quả scan vào bộ nhớ riêng của app, và màn hình prototype để kiểm thử.
> Ngày cập nhật: 2026-11-17. Nền tảng: chỉ Android.

## 1. Tóm tắt

| Hạng mục | Trạng thái |
|---|---|
| Native module `document-scanner` (Kotlin + Expo Modules API) | ✅ Hoàn thành, build thành công |
| Mở UI scanner của ML Kit (tự nhận diện cạnh, chụp tự động hoặc thủ công, crop, xoay, filter) | ✅ Đã test trên emulator |
| Scan nhiều trang (tối đa 50) | ✅ Đã test với 2 và 3 trang |
| Xuất JPEG và PDF | ✅ Đã test |
| Copy kết quả sang bộ nhớ riêng, dọn file tạm trong cache | ✅ Đã kiểm tra bằng `adb run-as` |
| Xử lý khi người dùng huỷ | ✅ Đã test |
| Mã lỗi có cấu trúc, dùng chung giữa Kotlin và TypeScript | ✅ Đã cài đặt (chưa test từng loại lỗi) |
| Màn hình prototype: lưới trang, preview toàn màn hình | ✅ Đã test, light và dark mode |
| Lưu vào SQLite, danh sách document | ⏳ Phase 2 |
| Sắp xếp lại, xoá trang, export, share | ⏳ Phase 3–4 |
| Unit test (Jest) | ⏳ Phase 5 |

## 2. Tính năng đã có

### 2.1 Scan tài liệu (native)
- Mở UI scanner của Google ML Kit ở chế độ `SCANNER_MODE_FULL`, gồm:
  - tự nhận diện cạnh và chỉnh phối cảnh
  - chụp tự động hoặc thủ công
  - crop, xoay, filter (Original, Auto, Color, Grayscale, B&W) và Enhance
  - thêm, xoá trang ngay trong scanner
  - import ảnh từ gallery (đã bật, **chưa test thực tế**)
- Giới hạn 50 trang, có thể truyền `pageLimit` từ 1 đến 50.
- Kết quả trả về gồm ảnh JPEG của từng trang và một file PDF (có thể tắt bằng `includePdf: false`).
- Mỗi lúc chỉ chạy một phiên scan. Gọi lần thứ hai khi đang scan sẽ nhận lỗi `SCAN_IN_PROGRESS`.

### 2.2 Lưu trữ file
```
filesDir/documents/{documentId}/
├── original/                         # tạo sẵn, để trống (xem Hạn chế #2)
├── processed/
│   ├── page_{scanId}_001.jpg
│   └── page_{scanId}_002.jpg
└── document.pdf
```
- Dùng `filesDir` (bộ nhớ lâu dài, riêng của app), không dùng cache.
- Mỗi file được ghi ra file tạm `.part` trước rồi mới đổi tên, nên app crash giữa chừng sẽ không để lại file hỏng.
- Trước khi copy, module kiểm tra dung lượng trống (cần thêm 10 MB dự phòng). Thiếu dung lượng thì trả lỗi `STORAGE_FULL`.
- Nếu lỗi giữa chừng, toàn bộ file của lần scan đó bị xoá. Thư mục document cũng bị xoá nếu lần scan đó là lần tạo ra nó.
- File tạm của ML Kit trong cache bị xoá sau khi copy xong, kể cả khi copy lỗi. Module chỉ xoá file nằm trong `cacheDir`.
- Tên file là định danh cố định. Thứ tự trang sẽ do database quản lý ở Phase 2, nên khi reorder không phải đổi tên file.
- `documentId` truyền từ JS được kiểm tra bằng regex `^[A-Za-z0-9_-]{1,64}$` để chống path traversal.

### 2.3 API TypeScript
```ts
import { scanDocument, isScannerAvailable, DocumentScannerError } from '@modules/document-scanner';

const result = await scanDocument({ pageLimit: 50, galleryImport: true, includePdf: true });
// result: {
//   cancelled: boolean;
//   documentId?: string;
//   pages?: { pageNumber: number; uri: string }[];   // file:// URIs
//   pdfUri?: string | null;
//   pageCount?: number;
// }
```
- Khi người dùng huỷ, hàm **resolve** về `{ cancelled: true }` chứ không throw.
- Khi lỗi, hàm **reject** với `DocumentScannerError { code, message, cause }`.
- `isScannerAvailable()` kiểm tra module native đã được link và máy có Google Play Services.
- Trên iOS, web hoặc Expo Go, module trả `null` và các hàm báo `SCANNER_UNAVAILABLE`, không crash.
- Không truyền dữ liệu ảnh qua bridge, chỉ trả về URI.

### 2.4 Mã lỗi
| Code | Khi nào |
|---|---|
| `SCAN_IN_PROGRESS` | Đang có một phiên scan khác |
| `SCANNER_UNAVAILABLE` | Không có hoặc lỗi thời Google Play Services, module ML Kit không khả dụng, hoặc đang chạy trên Expo Go |
| `SCAN_INIT_ERROR` | Không khởi tạo được scanner, hoặc `documentId` không hợp lệ |
| `SCAN_LAUNCH_ERROR` | Không có Activity ở foreground, hoặc không mở được `IntentSender` |
| `SCAN_RESULT_ERROR` | ML Kit trả về kết quả rỗng hoặc không đọc được |
| `FILE_COPY_ERROR` | Lỗi I/O khi copy |
| `FILE_NOT_FOUND` | File output của ML Kit không còn |
| `STORAGE_FULL` | Không đủ dung lượng |

Các mã lỗi được định nghĩa ở hai nơi và phải giữ khớp nhau: `ScannerErrorCode` trong Kotlin và `SCANNER_ERROR_CODES` trong TypeScript. Thông báo hiển thị cho người dùng nằm ở `features/document-scanner/utils/scanErrorMessage.ts`.

### 2.5 Giao diện (màn hình prototype)
- Header, trạng thái trống (empty state) và nút "Scan document" cố định ở dưới. Khi đang scan, nút hiện spinner và bị khoá.
- Thẻ "Last scan" ghi số trang, có nhãn PDF và lưới thumbnail tỉ lệ A4: 3 cột trên điện thoại, 4 cột khi màn hình rộng từ 600dp.
- Bấm vào thumbnail sẽ mở **preview toàn màn hình**, vuốt ngang để chuyển trang, có bộ đếm "Page x / n". Đóng bằng nút X hoặc nút Back của Android.
- **Zoom trong preview** (`usePinchZoom`: gesture-handler kết hợp Reanimated, chạy trên UI thread):
  - Pinch zoom quanh điểm giữa hai ngón tay, từ 100% đến 400%.
  - Double tap: zoom 250% vào đúng điểm chạm. Double tap lần nữa để về 100%.
  - Nút kính lúp −/+ (mỗi lần ×1.5) và nhãn %. Bấm vào nhãn % để về 100%. Nút tự khoá khi đã chạm giới hạn.
  - Kéo (pan) chỉ bật khi đang zoom. Phạm vi kéo được giới hạn theo kích thước ảnh thật (tính từ tỉ lệ ảnh), nên không lộ viền đen.
  - Khi đang zoom, vuốt chuyển trang bị khoá, để pan không bị nhầm thành chuyển trang.
- Có banner riêng cho lỗi và cho trường hợp huỷ.
- Hỗ trợ light và dark mode qua theme token, tuân thủ quy tắc trong `.claude/` (không inline style, không số "magic").

## 3. Kiến trúc

```
modules/document-scanner/                  # Local Expo module (Android)
├── android/build.gradle                   # ML Kit 16.0.0
├── android/src/main/java/expo/modules/documentscanner/
│   ├── DocumentScannerModule.kt           # Module definition, launch, parse result
│   ├── ScanContract.kt                    # Bọc IntentSender cho Activity Result API của Expo
│   ├── DocumentFileStore.kt               # Copy, kiểm tra dung lượng, rollback, dọn cache
│   ├── DocumentScannerException.kt        # Mã lỗi
│   └── ScanOptions.kt                     # Record options
├── src/                                   # Types, error class, binding module native
└── index.ts                               # Public API

src/
├── app/_layout.tsx                        # Stack + AppProviders
├── app/index.tsx                          # Màn hình prototype
├── components/app-icon.tsx                # Icon dùng chung (expo-symbols)
└── features/document-scanner/
    ├── components/                        # PageGrid, PageThumbnail, PagePreviewModal, ...
    ├── hooks/                             # useDocumentScan, usePagePreview
    ├── constants/
    └── utils/scanErrorMessage.ts
```

Luồng xử lý: Screen gọi hook `useDocumentScan`, hook gọi `scanDocument()` (JS), JS gọi Kotlin, Kotlin mở UI scanner của ML Kit, nhận kết quả, copy file vào `filesDir` rồi trả URI về JS.

**Điểm kỹ thuật chính:**
- **Activity Result:** dùng `RegisterActivityContracts` và `registerForActivityResult` của expo-modules-core 56, không dùng `startActivityForResult` đã bị deprecated. ML Kit trả về `IntentSender`, nên module bọc nó trong envelope `ACTION_INTENT_SENDER_REQUEST`. Registry của Expo hỗ trợ sẵn envelope này.
- Các thao tác UI chạy trên `Dispatchers.Main`, copy file chạy trên `Dispatchers.IO`.

## 4. Thay đổi ngoài tính năng
- Xoá tab template: `explore.tsx`, `(tabs)/home.tsx`, `(auth)/login.tsx`, `app-tabs*.tsx`, `hint-row.tsx`. Chuyển navigation sang `Stack`.
- Mount `AppProviders` (React Query) trong root layout.
- Sửa `storage.service.ts` cho MMKV v4 (`createMMKV()`, `remove()`).
- Thêm các theme token: `primary`, `primaryPressed`, `onPrimary`, `danger`, `dangerSurface`, `scrim`, `onScrim`.
- Thêm `Motion` constants và các themed component `ThemedPressable`, `ThemedTouchableOpacity`, `AnimatedThemedView`, `AnimatedThemedButton`.
- Thêm alias `@modules/*` trong `tsconfig.json`.
- `npx tsc --noEmit` không báo lỗi. Lỗi MMKV đã sửa trong code. Hai lỗi import `.css` biến mất sau khi chạy lại Expo (`expo-env.d.ts` được sinh lại), không phải do sửa code.

## 5. Dependency

| Package | Version | Lý do |
|---|---|---|
| `expo-file-system` | ~56.0.11 | Trước đây chỉ có gián tiếp, giờ khai báo trực tiếp (sẽ dùng cho Phase 2 và 4) |
| `expo-dev-client` | ~56.0.28 | Cần cho Development Build |
| `com.google.android.gms:play-services-mlkit-document-scanner` | 16.0.0 | Scanner (khai báo trong Gradle của module) |

Không nâng cấp Expo, React Native hay bất kỳ package nào khác.

**Môi trường build:** Expo SDK 56.0.12, RN 0.85.3, Gradle 9.3.1, AGP 8.12.0, Kotlin 2.1.20, compileSdk và targetSdk 36, minSdk 24, New Architecture bật, Hermes.

## 6. Cách chạy

```bash
npx expo prebuild --platform android --clean   # khi đổi native code, plugin hoặc dependency native
npx expo run:android                           # build và cài dev build
npx expo start --dev-client                    # Metro (KHÔNG đặt CI=1, vì chế độ CI tắt watch)
```

| Thay đổi | Cần làm |
|---|---|
| Chỉ sửa TS/JS | Fast Refresh hoặc reload Metro |
| Sửa Kotlin, `build.gradle`, `expo-module.config.json` | `npx expo run:android` |
| Thêm package native, sửa plugin trong `app.json` | `prebuild --clean` rồi `run:android` |
| EAS | `eas build -p android --profile development` (chưa có `eas.json`) |

> `/android` nằm trong `.gitignore` vì project dùng CNG (prebuild sinh lại thư mục này). **Không sửa tay** thư mục này.

## 7. Kết quả kiểm thử

**Môi trường:** emulator Pixel 7 Pro, Android 14 (API 34), Google Play Services 26.43.

| Kịch bản | Kết quả |
|---|---|
| Build debug (`expo run:android`) | ✅ BUILD SUCCESSFUL (4 phút 32 giây) |
| Lần đầu mở scanner: Play Services tải module ML Kit | ✅ Tải xong rồi mở scanner |
| Scan 2 trang, chụp thủ công, filter, Next | ✅ 2 JPEG và 1 PDF trong `files/documents/{id}` |
| Scan 3 trang, chụp tự động, Next | ✅ Lưới 3 thumbnail |
| Dọn cache ML Kit sau khi scan | ✅ Không còn `.jpg`/`.pdf` trong `cache/` |
| Huỷ (Discard scan, Discard) | ✅ Nhận `{ cancelled: true }`, không tạo thư mục rác |
| Preview: mở trang 2, vuốt sang trang 3, Back | ✅ |
| Zoom: nút +, nhãn % để reset, double tap vào điểm chạm (250%), pan giới hạn ở mép ảnh, double tap để về 100%, sau đó vuốt chuyển trang | ✅ |
| Pinch hai ngón | ⚠️ Chưa test (cần máy thật) |
| Dark mode | ✅ |
| `tsc --noEmit` | ✅ |

**Chưa test:** import ảnh từ gallery; scan 50 trang; trường hợp hết bộ nhớ; máy không có Play Services; Activity bị huỷ giữa chừng; máy thật với camera thật; release build; EAS Build; unit test.

## 8. Hạn chế đã biết
1. **Lần scan đầu tiên trên mỗi máy cần internet**, vì Google Play Services tải module scanner theo nhu cầu. Từ lần sau chạy offline được.
2. **ML Kit không trả ảnh gốc chưa xử lý.** Thư mục `original/` chỉ được tạo sẵn cho một luồng chụp ảnh gốc riêng trong tương lai.
3. **Activity bị huỷ** trong lúc scanner đang mở (bộ nhớ thấp, hoặc bật "Don't keep activities"): promise có thể không bao giờ resolve. Callback dự phòng của Expo SDK 56 chưa hoạt động, chính code Expo cũng ghi chú điều này.
4. **Chưa lưu vào database:** kết quả chỉ nằm trong state, khởi động lại app sẽ mất danh sách, dù file vẫn còn trên đĩa. Các thư mục scan trước đó vẫn nằm trong `filesDir/documents/` và sẽ được dọn ở Phase 2.
5. **PDF của ML Kit chỉ đúng tại thời điểm scan.** Sau khi reorder, xoá hoặc thêm trang, PDF phải được sinh lại bằng `android.graphics.pdf.PdfDocument` (Phase 4, đã thống nhất).
6. Pinch-zoom hai ngón chưa test trên máy thật, vì `adb input` không giả lập được multi-touch. Các phần đã test là nút zoom, double tap và pan.
7. Chưa có ESLint config. `expo lint` sẽ tự tạo config ở lần chạy đầu.

## 9. Phase tiếp theo
**Phase 2: lưu trữ cục bộ**
- Cài `expo-sqlite`; tạo schema `documents` và `document_pages`, migration, bật foreign key.
- Repository CRUD với query có tham số, transaction cho các thao tác trên nhiều trang.
- File storage service (JS) để xoá document hoặc trang và đồng bộ với DB.
- Khi khởi động app, đối chiếu thư mục trên đĩa với DB và dọn thư mục mồ côi.
- Tạo document từ kết quả `scanDocument()`, hiển thị danh sách document.
