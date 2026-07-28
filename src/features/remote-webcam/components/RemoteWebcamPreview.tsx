import { StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

type RemoteWebcamPreviewProps = {
	streamUrl: string | null;
};

export const RemoteWebcamPreview = ({ streamUrl }: RemoteWebcamPreviewProps) => {
	if (!streamUrl) {
		return (
			<ThemedView style={styles.placeholder}>
				<ThemedText>Chưa có tín hiệu camera</ThemedText>
			</ThemedView>
		);
	}

	return <RTCView streamURL={streamUrl} style={styles.preview} objectFit="cover" />;
};

const styles = StyleSheet.create({
	preview: {
		flex: 1,
		backgroundColor: Colors.dark.background,
	},
	placeholder: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
