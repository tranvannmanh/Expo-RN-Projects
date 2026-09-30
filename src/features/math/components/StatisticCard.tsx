import { ThemedText, ThemedView } from '@/components';
import { StyleSheet } from 'react-native';

type StatisticCardProps = {
  icon: string;
  title: string;
  value: string | number;
};

export function StatisticCard({ icon, title, value }: StatisticCardProps) {
  return (
    <ThemedView style={styles.card} type="backgroundElement">
      <ThemedText style={styles.icon}>{icon}</ThemedText>

      <ThemedText style={styles.value} numberOfLines={1}>
        {value}
      </ThemedText>

      <ThemedText style={styles.title} numberOfLines={1}>
        {title}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 120,
    padding: 16,
    borderRadius: 20,
    // backgroundColor: 'rgba(128, 128, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 28,
    marginBottom: 8,
  },

  value: {
    fontSize: 24,
    fontWeight: '800',
  },

  title: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
  },
});
