import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

type ComboDisplayProps = {
	combo: number;
};

export function ComboDisplay({ combo }: ComboDisplayProps) {
	return (
		<ThemedView style={styles.container}>
			<ThemedText style={styles.text}>Combo ×{combo}</ThemedText>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
	},

	text: {
		fontSize: 18,
		fontWeight: '700',
	},
});
