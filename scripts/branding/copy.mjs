/** Store-graphic text per Play Console language. Keep titles short: they render at 72 px. */
export const COPY = {
  vi: {
    featureTitle: 'Scan tài liệu thành PDF,<br/>hoàn toàn offline',
    featureSubtitle: 'Nhận diện cạnh tự động · Nhiều trang · Không cần tài khoản',
    screenshots: {
      list: { title: 'Mọi tài liệu<br/>trong tầm tay', subtitle: 'Lưu riêng trên máy, không cần mạng' },
      scan: { title: 'Scan chỉ với<br/>một chạm', subtitle: 'Tự nhận diện cạnh, tự chụp, nhập từ thư viện' },
      detail: { title: 'Sắp xếp, thêm,<br/>xoá trang dễ dàng', subtitle: 'Quản lý tài liệu nhiều trang' },
      preview: { title: 'Phóng to<br/>từng chi tiết', subtitle: 'Chụm hai ngón hoặc chạm hai lần để zoom' },
      export: { title: 'Xuất PDF<br/>và chia sẻ', subtitle: 'Lưu vào Documents hoặc gửi qua mọi ứng dụng' },
    },
  },
  en: {
    featureTitle: 'Scan documents to PDF,<br/>completely offline',
    featureSubtitle: 'Auto edge detection · Multi-page · No account needed',
    screenshots: {
      list: { title: 'All your documents<br/>in one place', subtitle: 'Stored privately on your device, no internet needed' },
      scan: { title: 'Scan in<br/>one tap', subtitle: 'Auto edge detection, auto capture, gallery import' },
      detail: { title: 'Reorder, add<br/>and delete pages', subtitle: 'Manage multi-page documents with ease' },
      preview: { title: 'Zoom into<br/>every detail', subtitle: 'Pinch or double-tap to zoom' },
      export: { title: 'Export PDF<br/>and share', subtitle: 'Save to Documents or send to any app' },
    },
  },
};

/** Raw captures in assets/branding/screenshots/raw/, in store order. */
export const SCREENSHOTS = [
  { key: 'list', file: '1.png' },
  { key: 'scan', file: '2.png' },
  { key: 'detail', file: '3.png' },
  { key: 'preview', file: '4.png' },
  { key: 'export', file: '5.png' },
];
