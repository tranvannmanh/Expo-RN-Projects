# Remote Touchpad

Biến điện thoại thành touchpad không dây để điều khiển chuột trên Mac/PC qua cùng mạng Wi-Fi.

---

## Tổng quan kiến trúc

```
┌─────────────────────┐        WebSocket (LAN)        ┌──────────────────────────┐
│   Mobile App        │ ─────────────────────────────▶ │   Desktop Server         │
│  (Expo React Native)│                                │  (Node.js + nut-js)     │
│                     │                                │                          │
│  GestureDetector    │   { type: 'MOVE', dx, dy }    │  mouse.setPosition()     │
│  Pan / Tap gesture  │   { type: 'LEFT_CLICK' }      │  mouse.click()           │
│  WebSocket client   │   { type: 'SCROLL', dx, dy }  │  mouse.scrollDown/Up()   │
└─────────────────────┘                                └──────────────────────────┘
```

---

## Yêu cầu

- **Mobile**: iOS hoặc Android với app đang chạy
- **Desktop**: macOS (đã test), Windows/Linux (có thể hoạt động)
- **Mạng**: Cả hai thiết bị phải cùng Wi-Fi
- **Node.js**: v18+ trên máy tính

---

## Cài đặt Desktop Server

### Option A — Python (Recommended, không cần compile)

> Dùng Homebrew Python (`brew install python` nếu chưa có).

```bash
# Cài một lần
/opt/homebrew/bin/pip3 install websockets pyautogui --break-system-packages

# Chạy server
/opt/homebrew/bin/python3 server/server.py
```

### Option B — Node.js (cần compile native module)

```bash
cd server
npm install      # robotjs cần Xcode CLT: xcode-select --install
npm run dev
```

Sau khi chạy, terminal sẽ hiển thị địa chỉ IP của máy:

```
🖱️  Remote Touchpad Server

  Port : 8765
  IPs  : 192.168.1.100

Enter one of the IPs above in the mobile app to connect.
macOS: grant Accessibility access to Terminal if prompted.
```

### Lưu ý macOS — Accessibility Permission

Cả hai server đều cần quyền **Accessibility** để điều khiển chuột:

1. Mở **System Settings → Privacy & Security → Accessibility**
2. Thêm **Terminal** (hoặc iTerm) vào danh sách được phép
3. Khởi động lại server

---

## Sử dụng Mobile App

1. Mở tab **Touchpad** trong app
2. Nhập IP của máy tính (ví dụ: `192.168.1.100`)
3. Nhập port (mặc định: `8765`)
4. Nhấn **Connect**

---

## Gesture Map

| Gesture | Hành động |
|---------|-----------|
| 1 ngón kéo | Di chuyển con trỏ |
| 1 ngón nhấn nhanh (<300ms) | Click chuột trái |
| 1 ngón nhấn đôi | Double-click |
| 1 ngón giữ (500ms) | Click chuột phải |
| 2 ngón kéo | Scroll |
| Button "Left Click" | Click chuột trái |
| Button "Right Click" | Click chuột phải |

---

## Cấu trúc Feature (Mobile)

```
src/features/touchpad/
├── api/
│   └── touchpadSocket.ts       WebSocket client singleton
├── components/
│   ├── ConnectionSetup.tsx     Form nhập IP / Port
│   └── TouchpadSurface.tsx     Vùng gesture + status bar + click buttons
├── constants/
│   └── index.ts                DEFAULT_PORT, DEFAULT_SENSITIVITY, v.v.
├── hooks/
│   ├── useTouchpadConnection.ts  Quản lý kết nối WebSocket
│   └── useTouchpadGestures.ts    Chuyển đổi gesture → TouchpadEvent
├── store/
│   └── touchpadStore.ts        Zustand store: connectionStatus, config, sensitivity
├── types/
│   └── index.ts                TouchpadEvent, ConnectionStatus, ConnectionConfig
└── index.ts                    Public exports
```

---

## Cấu trúc Desktop Server

```
server/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts               WebSocket server, log IP, xử lý clients
    └── mouse-controller.ts    Nhận TouchpadEvent → gọi @nut-tree/nut-js
```

---

## Event Protocol (JSON qua WebSocket)

```typescript
// Di chuyển chuột (delta pixels)
{ type: 'MOVE', dx: 5.4, dy: -3.2 }

// Click trái
{ type: 'LEFT_CLICK' }

// Click phải
{ type: 'RIGHT_CLICK' }

// Double-click
{ type: 'DOUBLE_CLICK' }

// Scroll (delta units, accumulator trên server)
{ type: 'SCROLL', dx: 0, dy: -2.1 }
```

---

## Cấu hình (Zustand Store)

| Thuộc tính | Mặc định | Mô tả |
|---|---|---|
| `sensitivity` | `1.5` | Hệ số nhân delta cursor (px gesture → px màn hình) |
| `scrollSensitivity` | `0.4` | Hệ số nhân delta scroll |
| `naturalScroll` | `true` | Cuộn thuận chiều tay (giống macOS mặc định) |
| `config.port` | `8765` | WebSocket port |

---

## Tuning

### Cursor quá nhanh / chậm
Chỉnh `sensitivity` trong `touchpadStore.ts`:
```typescript
sensitivity: 1.5  // tăng → nhanh hơn, giảm → chậm hơn
```

### Scroll quá nhanh / chậm  
Chỉnh `scrollSensitivity`:
```typescript
scrollSensitivity: 0.4  // tăng → scroll mạnh hơn
```

### Đổi chiều scroll
```typescript
naturalScroll: false  // false = chiều truyền thống (không phải natural scrolling)
```

### Đổi port server
```bash
PORT=9000 npm run dev
```

---

## Troubleshooting

| Vấn đề | Giải pháp |
|---|---|
| Không kết nối được | Kiểm tra cùng Wi-Fi, IP đúng, server đang chạy |
| "Connection failed" | Kiểm tra firewall không chặn port 8765 |
| Chuột không di chuyển | Cấp quyền Accessibility cho Terminal trên macOS |
| Cursor giật | Giảm `sensitivity` hoặc kiểm tra độ trễ mạng |
| Server crash (Node) | Cần Xcode CLT: `xcode-select --install`, rồi `npm install` |
| Server crash (Python) | Kiểm tra `pip3 install websockets pyautogui` |

---

## Roadmap (chưa implement)

- [ ] Auto-discovery qua mDNS (không cần nhập IP)
- [ ] Drag & Drop (giữ click + move)
- [ ] Keyboard shortcuts (Cmd+C, Cmd+V, v.v.)
- [ ] Multi-monitor support
- [ ] Haptic feedback khi click
- [ ] Settings screen (chỉnh sensitivity trong app)
