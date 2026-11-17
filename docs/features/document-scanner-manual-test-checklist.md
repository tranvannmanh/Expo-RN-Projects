# Document Scanner: Checklist test thủ công (máy Android thật)

> Dùng trước mỗi lần phát hành. Cần **Development Build hoặc bản build từ EAS**; không dùng Expo Go (app sẽ báo `SCANNER_UNAVAILABLE`).
> Ghi lại cho mỗi lần chạy: model máy, phiên bản Android, phiên bản Google Play Services, và ✅/❌ cho từng mục.

## 0. Chuẩn bị
- [ ] Gỡ bản cũ, cài bản mới (`npx expo run:android --device` hoặc APK từ EAS).
- [ ] Nên có ít nhất 3 máy: Android 8 hoặc 9 (chỉ có SAF), Android 10–12, Android 13 trở lên.
- [ ] Chuẩn bị: vài trang giấy A4 có chữ, một trang trắng, một ảnh chụp tài liệu sẵn trong Gallery.

## 1. Lần chạy đầu và chế độ offline
- [ ] **Có mạng**, scan lần đầu: Play Services tải module scanner, rồi scanner mở ra.
- [ ] Bật **chế độ máy bay**, sau đó lặp lại mọi mục bên dưới: tất cả đều chạy được.
- [ ] Máy mới chưa từng scan và đang offline: app báo lỗi dễ hiểu và không crash.

## 2. Scan
- [ ] Danh sách, **Scan document**, nhập tên, **Start scanning**: scanner của ML Kit mở ra.
- [ ] Chụp tự động: viền tài liệu được nhận diện và tự chụp.
- [ ] Chụp thủ công bằng nút chụp.
- [ ] Crop, xoay, filter (Original, Auto, Color, Grayscale, B&W), Enhance.
- [ ] Thêm trang, xoá trang ngay trong scanner.
- [ ] **Import từ Gallery** (nút ảnh): ảnh được thêm thành trang.
- [ ] Bấm Next: tự chuyển sang màn hình chi tiết, đúng tên, đúng số trang, đúng thứ tự.
- [ ] Để trống tên: tên mặc định là `Scan <ngày giờ>`.
- [ ] Huỷ (X hoặc Discard): hiện banner "Scan cancelled", không có document mới.
- [ ] Bấm "Start scanning" hai lần thật nhanh: chỉ mở một scanner.
- [ ] Scan **50 trang**: không crash, đủ 50 thumbnail, preview mượt.

## 3. Danh sách và chi tiết
- [ ] Danh sách hiện ảnh bìa, tên, số trang, ngày; document mới nhất ở trên cùng.
- [ ] Xoay ngang và dùng tablet: layout không vỡ (lưới 4 cột khi rộng từ 600dp).
- [ ] Dark mode: mọi màn hình đọc được rõ.
- [ ] Nút **Back** của Android: preview về chi tiết, chi tiết về danh sách, Scan về danh sách.
- [ ] Đổi tên: tên rỗng thì nút Save bị khoá; tên mới hiện ở header, card và danh sách.

## 4. Thao tác trên trang
- [ ] Preview: vuốt chuyển trang, pinch zoom bằng **hai ngón**, double tap, nút +/− và nhãn %.
- [ ] Khi đang zoom, kéo ảnh không chuyển trang; ảnh không kéo được quá mép.
- [ ] Reorder: dùng ◀ ▶ rồi Save, thứ tự được giữ sau khi khởi động lại app; Cancel thì bỏ thay đổi.
- [ ] Xoá một trang ở giữa: các trang còn lại được đánh số liền mạch.
- [ ] Xoá **trang cuối cùng**: app báo sẽ xoá cả document; xác nhận thì quay về danh sách.
- [ ] Add pages: trang mới được nối vào cuối.
- [ ] Sau khi reorder, xoá hoặc thêm trang: nhãn hiện "PDF will be rebuilt on export".

## 5. PDF và xuất file
- [ ] **Save** (Android 10+): file `Documents/ScannerApp/<tên>.pdf` mở được trong ứng dụng Files hoặc trình đọc PDF; thứ tự trang đúng.
- [ ] Save lần 2: MediaStore tạo `<tên> (1).pdf`; banner hiện đúng tên.
- [ ] **Choose another location…**: chọn thư mục, đổi tên rồi Save, file được tạo ở đó; bấm Huỷ thì không có banner lỗi.
- [ ] Android 8–9: chỉ có nút **Save as…** (SAF) và chạy đúng.
- [ ] **Share**: gửi thật qua Gmail, Drive, Bluetooth; người nhận mở được PDF.
- [ ] Preview: **lưu trang** (vào Pictures/ScannerApp, thấy trong Gallery), **chia sẻ trang**.
- [ ] Xoá file đã xuất trong ứng dụng Files: document trong app vẫn còn nguyên.
- [ ] Xoá document trong app: các file đã xuất vẫn còn (hành vi đúng).
- [ ] Không có hộp thoại xin quyền storage nào xuất hiện.

## 6. Khôi phục và lỗi
- [ ] Đang scan thì vuốt tắt app; mở lại: không có document hỏng hay dở dang, app không crash.
- [ ] Bật Developer options và "Don't keep activities", rồi scan: ghi lại hành vi (hạn chế đã biết: promise có thể không resolve).
- [ ] Bộ nhớ gần đầy (dưới 10 MB trống), rồi scan: hiện "Not enough storage space".
- [ ] Máy không có Google Play Services (nếu có thể): hiện "scanner is not available".
- [ ] Force stop rồi mở lại: danh sách và dữ liệu còn nguyên.

## 7. Trợ năng
- [ ] Bật TalkBack: các nút đọc đúng nhãn (Delete page 2, Move page 3 earlier, Zoom in, …).
- [ ] Cỡ chữ hệ thống lớn nhất: chữ không bị cắt, nút vẫn bấm được.
