import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';
type QuestionCardProps = {
	expression: string;
};

const QuestionCard = ({ expression }: QuestionCardProps) => {
	return (
		<ThemedView style={styles.container}>
			<ThemedText style={styles.expression}>{expression}</ThemedText>
		</ThemedView>
	);
};

export default QuestionCard;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 24,
	},

	expression: {
		fontSize: 42,
		fontWeight: '800',
	},
});
