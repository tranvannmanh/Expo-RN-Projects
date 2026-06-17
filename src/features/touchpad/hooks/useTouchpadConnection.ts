import { useCallback } from 'react';

import { touchpadSocket } from '../api/touchpadSocket';
import { useTouchpadStore } from '../store/touchpadStore';

export function useTouchpadConnection() {
  const config = useTouchpadStore((s) => s.config);
  const connectionStatus = useTouchpadStore((s) => s.connectionStatus);
  const setConnectionStatus = useTouchpadStore((s) => s.setConnectionStatus);

  const connect = useCallback(() => {
    if (!config.host.trim()) return;
    setConnectionStatus('connecting');
    touchpadSocket.connect(config.host.trim(), config.port, {
      onOpen: () => setConnectionStatus('connected'),
      onClose: () => setConnectionStatus('disconnected'),
      onError: (err) => setConnectionStatus('error', err.message),
    });
  }, [config, setConnectionStatus]);

  const disconnect = useCallback(() => {
    touchpadSocket.disconnect();
    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  return { connect, disconnect, connectionStatus, config };
}
