import { ThemedPressable, ThemedText, ThemedView } from '@/components';
import { StyleSheet } from 'react-native';

type GameCardProps = {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
};

export function GameCard({ icon, title, description, onPress }: GameCardProps) {
  return (
    <ThemedPressable
      onPress={onPress}
      style={styles.container}
      type="backgroundElement"
    >
      <ThemedView style={styles.iconContainer}>
        <ThemedText style={styles.icon}>{icon}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content} type="backgroundElement">
        <ThemedText style={styles.title}>{title}</ThemedText>

        <ThemedText style={styles.description} numberOfLines={1}>
          {description}
        </ThemedText>
      </ThemedView>

      <ThemedText style={styles.arrow}>›</ThemedText>
    </ThemedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 86,
    padding: 16,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },

  icon: {
    fontSize: 28,
  },

  content: {
    flex: 1,
    marginLeft: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
  },

  description: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.55,
  },

  arrow: {
    marginLeft: 12,
    fontSize: 32,
    fontWeight: '300',
    opacity: 0.5,
  },
});
