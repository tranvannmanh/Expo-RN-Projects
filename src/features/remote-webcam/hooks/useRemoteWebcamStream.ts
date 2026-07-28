import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
	MediaStream,
	mediaDevices,
	RTCIceCandidate,
	RTCPeerConnection,
	RTCSessionDescription,
	type MediaStreamTrack,
} from 'react-native-webrtc';

import { createSignalingConnection, type SignalingConnection } from '../api/signaling.api';
import { ICE_SERVERS, RESOLUTION_PRESETS, SIGNALING_PROTOCOL_VERSION } from '../constants/remote-webcam.constants';
import { useRemoteWebcamStore } from '../store/remote-webcam.store';

export const useRemoteWebcamStream = () => {
	const status = useRemoteWebcamStore((state) => state.status);
	const hostIp = useRemoteWebcamStore((state) => state.hostIp);
	const port = useRemoteWebcamStore((state) => state.port);
	const facing = useRemoteWebcamStore((state) => state.facing);
	const resolution = useRemoteWebcamStore((state) => state.resolution);
	const errorMessage = useRemoteWebcamStore((state) => state.errorMessage);
	const setHostIp = useRemoteWebcamStore((state) => state.setHostIp);
	const setPort = useRemoteWebcamStore((state) => state.setPort);
	const setFacing = useRemoteWebcamStore((state) => state.setFacing);
	const setResolution = useRemoteWebcamStore((state) => state.setResolution);
	const setStatus = useRemoteWebcamStore((state) => state.setStatus);
	const setError = useRemoteWebcamStore((state) => state.setError);
	const reset = useRemoteWebcamStore((state) => state.reset);

	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
	const signalingRef = useRef<SignalingConnection | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);

	const teardown = useCallback(() => {
		signalingRef.current?.close();
		signalingRef.current = null;
		peerConnectionRef.current?.close();
		peerConnectionRef.current = null;
		localStreamRef.current?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
		localStreamRef.current = null;
	}, []);

	const disconnect = useCallback(() => {
		signalingRef.current?.send({ type: 'bye', version: SIGNALING_PROTOCOL_VERSION });
		teardown();
		reset();
	}, [reset, teardown]);

	const connect = useCallback(async () => {
		if (Platform.OS !== 'android') {
			setError('Remote webcam chỉ hỗ trợ Android.');
			return;
		}

		setStatus('connecting');

		try {
			const { width, height } = RESOLUTION_PRESETS[resolution];
			const localStream = (await mediaDevices.getUserMedia({
				video: { facingMode: facing, width, height },
				audio: true,
			})) as MediaStream;
			localStreamRef.current = localStream;

			const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
			peerConnectionRef.current = peerConnection;
			localStream.getTracks().forEach((track: MediaStreamTrack) => peerConnection.addTrack(track, localStream));

			peerConnection.onicecandidate = (event: { candidate: RTCIceCandidate | null }) => {
				if (event.candidate) {
					signalingRef.current?.send({
						type: 'ice-candidate',
						version: SIGNALING_PROTOCOL_VERSION,
						candidate: {
							candidate: event.candidate.candidate,
							sdpMid: event.candidate.sdpMid ?? null,
							sdpMLineIndex: event.candidate.sdpMLineIndex ?? null,
						},
					});
				}
			};

			peerConnection.onconnectionstatechange = () => {
				if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
					setError('Mất kết nối tới desktop.');
					teardown();
				}
			};

			const signaling = createSignalingConnection(`ws://${hostIp}:${port}`, {
				onOpen: async () => {
					const offer = await peerConnection.createOffer({});
					await peerConnection.setLocalDescription(offer);
					signaling.send({
						type: 'offer',
						version: SIGNALING_PROTOCOL_VERSION,
						sdp: offer.sdp ?? '',
					});
				},
				onMessage: async (message) => {
					if (message.type === 'answer') {
						await peerConnection.setRemoteDescription(
							new RTCSessionDescription({ type: 'answer', sdp: message.sdp }),
						);
						setStatus('streaming');
					} else if (message.type === 'ice-candidate') {
						await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
					} else if (message.type === 'bye') {
						teardown();
						reset();
					}
				},
				onError: () => {
					setError('Không thể kết nối tới desktop. Hãy bật USB tethering và thử lại.');
					teardown();
				},
				onClose: () => {
					if (useRemoteWebcamStore.getState().status === 'streaming') {
						setError('Kết nối tới desktop đã đóng.');
					}
				},
			});
			signalingRef.current = signaling;
		} catch {
			setError('Không thể truy cập camera/micro hoặc kết nối tới desktop.');
			teardown();
		}
	}, [facing, hostIp, port, resolution, setError, setStatus, teardown, reset]);

	useEffect(() => teardown, [teardown]);

	const canEditCameraSettings = status === 'idle' || status === 'error';
	const localStreamUrl = localStreamRef.current?.toURL() ?? null;

	return {
		status,
		hostIp,
		port,
		facing,
		resolution,
		canEditCameraSettings,
		errorMessage,
		localStreamUrl,
		setHostIp,
		setPort,
		setFacing,
		setResolution,
		connect,
		disconnect,
	};
};
