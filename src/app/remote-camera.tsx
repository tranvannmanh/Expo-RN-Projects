import { Platform, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CameraSettingsForm } from '@/features/remote-webcam/components/CameraSettingsForm';
import { ConnectionStatusBanner } from '@/features/remote-webcam/components/ConnectionStatusBanner';
import { HostConnectionForm } from '@/features/remote-webcam/components/HostConnectionForm';
import { RemoteWebcamPreview } from '@/features/remote-webcam/components/RemoteWebcamPreview';
import { useRemoteWebcamStream } from '@/features/remote-webcam/hooks/useRemoteWebcamStream';

const AndroidRemoteCameraScreen = () => {
	const {
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
	} = useRemoteWebcamStream();

	return (
		<ThemedView style={styles.container}>
			<RemoteWebcamPreview streamUrl={localStreamUrl} />
			<ConnectionStatusBanner status={status} errorMessage={errorMessage} />
			<CameraSettingsForm
				facing={facing}
				resolution={resolution}
				disabled={!canEditCameraSettings}
				onFacingChange={setFacing}
				onResolutionChange={setResolution}
			/>
			<HostConnectionForm
				hostIp={hostIp}
				port={port}
				status={status}
				onHostIpChange={setHostIp}
				onPortChange={setPort}
				onConnectPress={connect}
				onDisconnectPress={disconnect}
			/>
		</ThemedView>
	);
};

const RemoteCamera = () => {
	if (Platform.OS !== 'android') {
		return (
			<ThemedView style={styles.container}>
				<ThemedText>Remote webcam chỉ hỗ trợ Android.</ThemedText>
			</ThemedView>
		);
	}
	return <AndroidRemoteCameraScreen />;
};

export default RemoteCamera;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
