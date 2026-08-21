import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

type GameHeaderProps = {
	score: number;
	lives: number;
};

export function GameHeader({ score, lives }: GameHeaderProps) {
	return (
		<ThemedView style={styles.container}>
			<ThemedText style={styles.score}>⭐ {score}</ThemedText>

			<ThemedText style={styles.lives}>{'❤️'.repeat(lives)}</ThemedText>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},

	score: {
		fontSize: 24,
		fontWeight: '700',
	},

	lives: {
		fontSize: 20,
	},
});
