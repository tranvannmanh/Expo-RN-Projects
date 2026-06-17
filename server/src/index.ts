import * as os from 'os';
import { WebSocket, WebSocketServer } from 'ws';

import { handleEvent } from './mouse-controller';

const PORT = parseInt(process.env.PORT ?? '8765', 10);

const wss = new WebSocketServer({ port: PORT });

function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }
  return ips;
}

wss.on('listening', () => {
  const ips = getLocalIPs();
  console.log('\n🖱️  Remote Touchpad Server running\n');
  console.log(`  Port: ${PORT}`);
  console.log('  Your IP addresses:');
  ips.forEach((ip) => console.log(`    → ${ip}`));
  console.log('\nEnter one of the IPs above in the mobile app to connect.\n');
  console.log('Note: Grant Accessibility permission if macOS prompts you.\n');
});

wss.on('connection', (ws: WebSocket, req) => {
  const clientIP = req.socket.remoteAddress ?? 'unknown';
  // Disable Nagle's algorithm: send each packet immediately without buffering
  req.socket.setNoDelay(true);
  console.log(`[+] Client connected: ${clientIP}`);

  ws.on('message', (data) => {
    try {
      const event = JSON.parse(data.toString());
      handleEvent(event);
    } catch (err) {
      console.error('Failed to handle event:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[-] Client disconnected: ${clientIP}`);
  });

  ws.on('error', (err) => {
    console.error(`[!] WebSocket error from ${clientIP}:`, err.message);
  });
});

wss.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  wss.close(() => process.exit(0));
});
