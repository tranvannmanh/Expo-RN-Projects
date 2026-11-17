# Document Scanner: Kết quả Phase 2 (Lưu trữ cục bộ)

> Phase 2 gồm: SQLite làm nguồn dữ liệu chính, repository, file storage service, tạo/xoá/liệt kê document và dọn file mồ côi.
> Ngày cập nhật: 2026-11-17. Nền tảng: Android.

## 1. Tóm tắt

| Hạng mục | Trạng thái |
|---|---|
| `expo-sqlite`, migration theo `PRAGMA user_version`, bật foreign key và WAL | ✅ Đã test (schema v1) |
| Model TypeScript `ScannedDocument`, `DocumentPage`, `DocumentSummary` | ✅ |
| Repository CRUD, toàn bộ query có tham số, dùng transaction cho thao tác nhiều trang | ✅ |
| File storage service (`expo-file-system` API mới) | ✅ |
| Tạo document từ kết quả scan | ✅ Đã test trên emulator |
| Danh sách document (ảnh bìa, tên, số trang, ngày, nhãn PDF) | ✅ Đã test |
| Xoá document (DB, cascade, file) | ✅ Đã test |
| Dữ liệu còn sau khi khởi động lại app | ✅ Đã test |
| Dọn thư mục mồ côi khi khởi động | ✅ Đã test |
| Repository: `appendPages`, `deletePage`, `reorderPages`, `renameDocument` | ✅ Đã viết. SQL đã chạy thử bằng `sqlite3`, chưa có UI (Phase 3) |
| Unit test Jest | ⏳ Phase 5 |

## 2. Schema (v1)

```sql
documents (
  id TEXT PK, name TEXT NOT NULL, pdf_path TEXT, page_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
)
document_pages (
  id TEXT PK, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL, original_path TEXT, processed_path TEXT NOT NULL,
  is_blank INTEGER, sharpness_score REAL, created_at INTEGER NOT NULL,
  UNIQUE (document_id, page_number)
)
INDEX idx_documents_created_at ON documents(created_at DESC)
```

- **Đường dẫn được lưu dạng tương đối** (`documents/{id}/processed/page_x_001.jpg`), chỉ ghép thành `file://` khi hiển thị. Nhờ vậy dữ liệu vẫn đúng khi đường dẫn tuyệt đối của `filesDir` thay đổi (backup/restore, chuyển máy).
- `is_blank` và `sharpness_score` có giá trị **NULL nghĩa là chưa phân tích**. Không có giá trị giả.
- `original_path` luôn NULL, vì ML Kit không trả ảnh gốc.
- `page_count` là bản sao lưu sẵn để đọc nhanh, được tính lại trong cùng transaction mỗi khi trang thay đổi.
- Thời gian lưu dạng epoch milliseconds.
- **Migration:** mảng chỉ được thêm vào, không sửa bản cũ. Mỗi bước chạy trong một exclusive transaction. Nếu DB có version mới hơn app đang hỗ trợ, app báo lỗi thay vì chạy tiếp.

## 3. Quy tắc nhất quán giữa DB và file

| Thao tác | Thứ tự | Khi lỗi |
|---|---|---|
| Tạo document | Native ghi file, sau đó insert document và các trang trong **1 transaction** | Xoá toàn bộ thư mục vừa tạo, trả `DATABASE_ERROR` |
| Thêm trang | Native ghi file, sau đó `appendPages` trong 1 transaction | Chỉ xoá các file trang mới |
| Xoá document | Xoá row trước (cascade xoá các trang), sau đó xoá thư mục | Nếu xoá file lỗi thì chỉ còn thư mục mồ côi, sẽ được dọn ở lần khởi động sau |
| Xoá trang | Trong transaction: xoá row, đánh số lại, cập nhật `page_count` và `pdf_path = NULL`. Sau đó xoá file | Như trên |
| Reorder | Kiểm tra danh sách id đúng bằng tập trang hiện có, sau đó đánh số lại trong transaction | Rollback |
| Mọi thay đổi trang | PDF cũ không còn đúng: `pdf_path` đặt về NULL và file PDF bị xoá | Phase 4 sẽ sinh lại PDF |

- **Đánh số lại 2 bước** (đổi sang số âm rồi lật dấu lại) để ràng buộc `UNIQUE(document_id, page_number)` không bao giờ gặp trùng tạm thời.
- **Dọn file mồ côi:** `reconcileStorage` chạy một lần mỗi phiên app. Nó xoá thư mục trong `documents/` không có row tương ứng. Mỗi lần scan đều chờ bước này chạy xong trước, nên thư mục của lần scan mới không bao giờ bị nhầm là mồ côi.

## 4. Kiến trúc

```
src/shared/database/
├── database.ts          # DATABASE_NAME, initializeDatabase (PRAGMA + migrate)
└── migrations.ts        # MIGRATIONS[], migrateDatabase
src/providers/AppProviders.tsx   # SQLiteProvider + QueryClientProvider

src/features/document-scanner/
├── types/document.ts, types/errors.ts       # Model + DocumentError
├── repositories/document.repository.ts      # SQL thuần, row ↔ model
├── services/documentFileStorage.ts          # Đường dẫn, xoá file, liệt kê thư mục
├── services/document.service.ts             # Nghiệp vụ + nhất quán DB/file + reconcile
├── utils/scanResultMapping.ts               # Kết quả native → row (kiểm tra + đường dẫn tương đối)
├── utils/documentName.ts, documentErrorMessage.ts
└── hooks/
    ├── useDocuments.ts          # React Query: danh sách (+ reconcile)
    ├── useDocumentPages.ts      # React Query: các trang → file URI
    ├── useScanNewDocument.ts    # Mutation: scan rồi lưu
    └── useDeleteDocument.ts     # Mutation: xoá
```

Luồng xử lý: Screen gọi hook. Hook là React Query, lấy `db` qua `useSQLiteContext`. Hook gọi service, service gọi repository (SQL) và file storage. UI không gọi SQL hay native module trực tiếp.

**Lý do dùng React Query cho dữ liệu SQLite:** dù đây không phải server state, React Query vẫn cho sẵn cache, trạng thái loading/error và invalidate sau mutation. Nhờ vậy không phải đưa dữ liệu document vào Zustand, đúng quy tắc trong `.claude/state.md`.

## 5. Mã lỗi

Đã có từ Phase 1 (scanner): `SCAN_IN_PROGRESS`, `SCANNER_UNAVAILABLE`, `SCAN_INIT_ERROR`, `SCAN_LAUNCH_ERROR`, `SCAN_RESULT_ERROR`, `FILE_COPY_ERROR`, `FILE_NOT_FOUND`, `STORAGE_FULL`.

Mới ở Phase 2 (`DocumentError`):

| Code | Khi nào |
|---|---|
| `SCAN_CANCELLED` | Chỉ để hiển thị thông báo. Việc huỷ được trả về dưới dạng `null`, không phải lỗi |
| `INVALID_INPUT` | Tên document rỗng (tên được trim, gộp khoảng trắng, tối đa 120 ký tự) |
| `DOCUMENT_NOT_FOUND` | Đổi tên một document không tồn tại |
| `DATABASE_ERROR` | Mọi lỗi SQLite |
| `PDF_EXPORT_ERROR` | Dành cho Phase 4 |

Lỗi đều được log kèm `code` và `cause` (`console.error`). UI chỉ hiển thị thông báo dễ hiểu kèm mã lỗi.

## 6. Dependency

| Package | Version | Ghi chú |
|---|---|---|
| `expo-sqlite` | ~56.0.6 | Native module, có thêm config plugin vào `app.json`. **Cần prebuild và build lại** |

## 7. Kết quả kiểm thử (emulator Pixel 7 Pro, API 34)

| Kịch bản | Kết quả |
|---|---|
| `prebuild --clean` và `run:android` | ✅ BUILD SUCCESSFUL (1 phút 27 giây) |
| Tạo thư mục giả `fake-orphan-123`, sau đó khởi động lại | ✅ Thư mục bị xoá, có log `removed orphan folders` |
| Scan 2 trang | ✅ Có 1 document trong danh sách (ảnh bìa, "2 pages", nhãn PDF) |
| Đọc DB (`sqlite3` trên file kéo về máy) | ✅ `user_version=1`; đường dẫn tương đối; trang 1 và 2; `is_blank`/`sharpness_score` NULL |
| Force-stop rồi mở lại | ✅ Document vẫn còn |
| Bấm document | ✅ Preview đúng 2 trang từ DB |
| Xoá, xác nhận | ✅ 0 document, 0 trang (cascade), thư mục bị xoá, hiện empty state |
| SQL reorder, xoá trang ở giữa, cascade (`sqlite3` với cùng schema) | ✅ `e,c,a,b`, sau đó `1,2,3`; `page_count=3`; `pdf_path=NULL`; còn 0 trang |
| `tsc --noEmit` | ✅ |

**Chưa test:** lỗi DB thật giữa lúc insert (cần mock, làm ở Phase 5); hết bộ nhớ; danh sách rất dài; nâng cấp migration từ v1 lên v2.

## 8. Hạn chế và lưu ý
1. Tên mặc định là `Scan <ngày giờ>`. Phần nhập và sửa tên thuộc Phase 3 (ScanScreen); service `renameDocument` đã có sẵn.
2. Bấm document hiện mở preview. Màn hình chi tiết (reorder, xoá trang, thêm trang) làm ở Phase 3.
3. Trang có file bị mất (bị xoá từ bên ngoài app) chưa được đánh dấu riêng: ảnh chỉ không hiển thị. Sẽ xử lý ở màn hình chi tiết.
4. Khi nâng lên Phase 2, các thư mục scan từ Phase 1 chưa từng có trong DB, nên sẽ bị dọn ở lần khởi động đầu tiên. Đây là hành vi đúng.

## 9. Phase tiếp theo
**Phase 3: giao diện**
- ScanScreen: nhập tên, scan, hiển thị tiến trình, xử lý huỷ và lỗi.
- DocumentDetailScreen: lưới trang, preview, sắp xếp lại (kéo thả), xoá trang, thêm trang, đổi tên.
- Điều hướng bằng Expo Router (`/documents/[id]`, `/scan`), hỗ trợ nút Back của Android.
