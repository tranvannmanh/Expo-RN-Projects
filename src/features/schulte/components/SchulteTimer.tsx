import { ThemedText } from '@/components';
import { StyleSheet } from 'react-native';

type SchulteTimerProps = {
  elapsedMs: number;
};

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);

  return `${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(
    2,
    '0',
  )}`;
}

export function SchulteTimer({ elapsedMs }: SchulteTimerProps) {
  return <ThemedText style={styles.timer}>{formatTime(elapsedMs)}</ThemedText>;
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 42,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
