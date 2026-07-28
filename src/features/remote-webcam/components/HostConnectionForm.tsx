import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ConnectionStatus } from '../types/remote-webcam.types';

type HostConnectionFormProps = {
	hostIp: string;
	port: number;
	status: ConnectionStatus;
	onHostIpChange: (hostIp: string) => void;
	onPortChange: (port: number) => void;
	onConnectPress: () => void;
	onDisconnectPress: () => void;
};

export const HostConnectionForm = ({
	hostIp,
	port,
	status,
	onHostIpChange,
	onPortChange,
	onConnectPress,
	onDisconnectPress,
}: HostConnectionFormProps) => {
	const isConnecting = status === 'connecting';
	const isStreaming = status === 'streaming';

	return (
		<ThemedView style={styles.container}>
			<ThemedView type="backgroundElement" style={styles.field}>
				<ThemedText themeColor="textSecondary" type="small">
					Host IP
				</ThemedText>
				<TextInput
					value={hostIp}
					onChangeText={onHostIpChange}
					editable={!isConnecting && !isStreaming}
					autoCapitalize="none"
					autoCorrect={false}
					keyboardType="numbers-and-punctuation"
				/>
			</ThemedView>
			<ThemedView type="backgroundElement" style={styles.field}>
				<ThemedText themeColor="textSecondary" type="small">
					Port
				</ThemedText>
				<TextInput
					value={String(port)}
					onChangeText={(value) => onPortChange(Number(value.replace(/[^0-9]/g, '')) || 0)}
					editable={!isConnecting && !isStreaming}
					keyboardType="number-pad"
				/>
			</ThemedView>
			<Pressable
				disabled={isConnecting}
				onPress={isStreaming ? onDisconnectPress : onConnectPress}
				style={styles.button}
			>
				<ThemedView type="backgroundSelected" style={styles.buttonInner}>
					<ThemedText type="smallBold">{isStreaming ? 'Ngắt kết nối' : 'Kết nối'}</ThemedText>
				</ThemedView>
			</Pressable>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: Spacing.three,
		paddingBottom: Spacing.three,
		gap: Spacing.two,
	},
	field: {
		borderRadius: Spacing.two,
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
		gap: Spacing.half,
	},
	button: {
		alignSelf: 'stretch',
	},
	buttonInner: {
		borderRadius: Spacing.two,
		paddingVertical: Spacing.three,
		alignItems: 'center',
	},
});
