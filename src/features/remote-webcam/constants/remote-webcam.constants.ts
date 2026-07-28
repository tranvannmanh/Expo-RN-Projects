import type { ResolutionPreset } from '../types/remote-webcam.types';

export const SIGNALING_PROTOCOL_VERSION = 1;

// AOSP RNDIS convention for USB tethering; OEMs vary, so this is only a prefill default.
export const DEFAULT_HOST_IP = '192.168.42.1';
export const DEFAULT_SIGNALING_PORT = 8088;

// Direct point-to-point link over the USB cable — no STUN/TURN needed.
export const ICE_SERVERS: RTCIceServer[] = [];

export const RESOLUTION_PRESETS: Record<ResolutionPreset, { width: number; height: number }> = {
	'480p': { width: 640, height: 480 },
	'720p': { width: 1280, height: 720 },
	'1080p': { width: 1920, height: 1080 },
};
