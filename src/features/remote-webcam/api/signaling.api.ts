import type { SignalingMessage } from '../types/remote-webcam.types';

export type SignalingCallbacks = {
	onOpen?: () => void;
	onMessage?: (message: SignalingMessage) => void;
	onClose?: () => void;
	onError?: (error: Event) => void;
};

export type SignalingConnection = {
	send: (message: SignalingMessage) => void;
	close: () => void;
};

export const createSignalingConnection = (url: string, callbacks: SignalingCallbacks): SignalingConnection => {
	const socket = new WebSocket(url);

	socket.onopen = () => callbacks.onOpen?.();
	socket.onclose = () => callbacks.onClose?.();
	socket.onerror = (error) => callbacks.onError?.(error);
	socket.onmessage = (event) => {
		const message = JSON.parse(event.data as string) as SignalingMessage;
		callbacks.onMessage?.(message);
	};

	return {
		send: (message) => socket.send(JSON.stringify(message)),
		close: () => socket.close(),
	};
};
