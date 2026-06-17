#!/opt/homebrew/bin/python3
"""
Remote Touchpad Server
Runs on your Mac and receives WebSocket events from the mobile app
to control the mouse cursor.

Requirements:
    pip3 install websockets pyautogui

Usage:
    python3 server.py
    PORT=9000 python3 server.py  (custom port)
"""

import asyncio
import json
import os
import socket
import sys

try:
    import websockets
    import pyautogui
except ImportError:
    print("Installing dependencies...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip3", "install", "websockets", "pyautogui"])
    import websockets
    import pyautogui

pyautogui.FAILSAFE = False

PORT = int(os.environ.get("PORT", 8765))

scroll_accum_x = 0.0
scroll_accum_y = 0.0


def handle_event(event: dict) -> None:
    global scroll_accum_x, scroll_accum_y
    t = event.get("type")

    if t == "MOVE":
        dx = event.get("dx", 0)
        dy = event.get("dy", 0)
        x, y = pyautogui.position()
        pyautogui.moveTo(x + dx, y + dy, _pause=False)

    elif t == "LEFT_CLICK":
        pyautogui.click(_pause=False)

    elif t == "RIGHT_CLICK":
        pyautogui.rightClick(_pause=False)

    elif t == "DOUBLE_CLICK":
        pyautogui.doubleClick(_pause=False)

    elif t == "SCROLL":
        scroll_accum_y += event.get("dy", 0)
        scroll_units = int(scroll_accum_y)
        if scroll_units != 0:
            scroll_accum_y -= scroll_units
            # Negate: pyautogui scroll(+) = up, our dy(-) = swipe up = should scroll up
            pyautogui.scroll(-scroll_units, _pause=False)


async def handler(websocket) -> None:
    addr = websocket.remote_address
    client = f"{addr[0]}:{addr[1]}" if addr else "unknown"
    print(f"[+] Connected: {client}")

    # Disable Nagle's algorithm: send each packet immediately without buffering
    try:
        import socket as _socket
        sock = websocket.transport.get_extra_info("socket")
        if sock:
            sock.setsockopt(_socket.IPPROTO_TCP, _socket.TCP_NODELAY, 1)
    except Exception:
        pass

    try:
        async for message in websocket:
            try:
                event = json.loads(message)
                handle_event(event)
            except Exception as e:
                print(f"[!] Event error: {e}")
    except Exception:
        pass

    print(f"[-] Disconnected: {client}")


def get_local_ips() -> list[str]:
    ips = []
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None):
            ip = info[4][0]
            if "." in ip and not ip.startswith("127."):
                ips.append(ip)
    except Exception:
        pass

    # Fallback via connect trick
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            ips.insert(0, s.getsockname()[0])
    except Exception:
        pass

    return list(dict.fromkeys(ips))  # deduplicate, preserve order


async def main() -> None:
    ips = get_local_ips()

    print("\n🖱️  Remote Touchpad Server\n")
    print(f"  Port : {PORT}")
    print("  IPs  :", end="")
    if ips:
        print(f" {ips[0]}")
        for ip in ips[1:]:
            print(f"         {ip}")
    else:
        print(" (could not detect, check ifconfig)")

    print("\nEnter one of the IPs above in the mobile app to connect.")
    print("macOS: grant Accessibility access to Terminal if prompted.\n")

    async with websockets.serve(handler, "0.0.0.0", PORT):
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped.")
