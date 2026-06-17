import { TouchpadEvent } from '../types';

const CONNECTION_TIMEOUT_MS = 5000;

type SocketCallbacks = {
  onOpen: () => void;
  onClose: () => void;
  onError: (error: Error) => void;
};

class TouchpadSocketManager {
  private socket: WebSocket | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  connect(host: string, port: number, callbacks: SocketCallbacks): void {
    this.disconnect();

    try {
      this.socket = new WebSocket(`ws://${host}:${port}`);
    } catch {
      callbacks.onError(new Error('Invalid host or port'));
      return;
    }

    this.timeoutId = setTimeout(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        // Null out onclose before disconnect so it doesn't overwrite the error state
        if (this.socket) this.socket.onclose = null;
        this.disconnect();
        callbacks.onError(new Error('Connection timed out — check IP and server'));
      }
    }, CONNECTION_TIMEOUT_MS);

    this.socket.onopen = () => {
      this.clearTimeout();
      callbacks.onOpen();
    };

    this.socket.onclose = () => {
      this.clearTimeout();
      callbacks.onClose();
    };

    this.socket.onerror = () => {
      this.clearTimeout();
      // WebSocket always fires onclose right after onerror.
      // Null it out so the error state is not immediately overwritten with 'disconnected'.
      if (this.socket) this.socket.onclose = null;
      callbacks.onError(new Error('Cannot reach server — check IP, port, and firewall'));
    };
  }

  send(event: TouchpadEvent): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
    }
  }

  disconnect(): void {
    this.clearTimeout();
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private clearTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

export const touchpadSocket = new TouchpadSocketManager();
