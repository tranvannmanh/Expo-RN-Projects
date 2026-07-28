export type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'error';

export type CameraFacing = 'user' | 'environment';

export type ResolutionPreset = '480p' | '720p' | '1080p';

export type IceCandidateInit = {
	candidate: string;
	sdpMid: string | null;
	sdpMLineIndex: number | null;
};

export type SignalingMessage =
	| { type: 'offer'; version: number; sdp: string }
	| { type: 'answer'; version: number; sdp: string }
	| { type: 'ice-candidate'; version: number; candidate: IceCandidateInit }
	| { type: 'bye'; version: number };
