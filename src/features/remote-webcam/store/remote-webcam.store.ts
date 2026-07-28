import { create } from 'zustand';

import { DEFAULT_HOST_IP, DEFAULT_SIGNALING_PORT } from '../constants/remote-webcam.constants';
import type { CameraFacing, ConnectionStatus, ResolutionPreset } from '../types/remote-webcam.types';

type RemoteWebcamState = {
	status: ConnectionStatus;
	hostIp: string;
	port: number;
	facing: CameraFacing;
	resolution: ResolutionPreset;
	errorMessage: string | null;
	setHostIp: (hostIp: string) => void;
	setPort: (port: number) => void;
	setFacing: (facing: CameraFacing) => void;
	setResolution: (resolution: ResolutionPreset) => void;
	setStatus: (status: ConnectionStatus) => void;
	setError: (errorMessage: string) => void;
	reset: () => void;
};

export const useRemoteWebcamStore = create<RemoteWebcamState>((set) => ({
	status: 'idle',
	hostIp: DEFAULT_HOST_IP,
	port: DEFAULT_SIGNALING_PORT,
	facing: 'environment',
	resolution: '720p',
	errorMessage: null,
	setHostIp: (hostIp) => set({ hostIp }),
	setPort: (port) => set({ port }),
	setFacing: (facing) => set({ facing }),
	setResolution: (resolution) => set({ resolution }),
	setStatus: (status) => set((state) => ({ status, errorMessage: status === 'error' ? state.errorMessage : null })),
	setError: (errorMessage) => set({ status: 'error', errorMessage }),
	reset: () => set({ status: 'idle', errorMessage: null }),
}));
