import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ConnectionStatus } from '../types/remote-webcam.types';

type ConnectionStatusBannerProps = {
	status: ConnectionStatus;
	errorMessage: string | null;
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
	idle: 'Chưa kết nối',
	connecting: 'Đang kết nối...',
	streaming: 'Đang stream tới desktop',
	error: 'Lỗi kết nối',
};

export const ConnectionStatusBanner = ({ status, errorMessage }: ConnectionStatusBannerProps) => {
	return (
		<ThemedView style={styles.container}>
			<ThemedText style={STATUS_TEXT_STYLE[status]} type="smallBold">
				{STATUS_LABEL[status]}
			</ThemedText>
			{errorMessage ? (
				<ThemedText themeColor="textSecondary" type="small">
					{errorMessage}
				</ThemedText>
			) : null}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
		gap: Spacing.half,
	},
	idle: { color: '#60646C' },
	connecting: { color: '#D9A441' },
	streaming: { color: '#3FA34D' },
	error: { color: '#D9534F' },
});

const STATUS_TEXT_STYLE: Record<ConnectionStatus, (typeof styles)[ConnectionStatus]> = {
	idle: styles.idle,
	connecting: styles.connecting,
	streaming: styles.streaming,
	error: styles.error,
};
