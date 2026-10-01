import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedPressable, ThemedText, ThemedView } from '@/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameCard } from '../components/GameCard';

type GameItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  route: string;
};

const GAMES: GameItem[] = [
  {
    id: 'math',
    icon: '🧮',
    title: 'Math Challenge',
    description: 'Test your calculation speed',
    route: '/game/math',
  },
  {
    id: 'tic-tac-toe',
    icon: '❌',
    title: 'Tic Tac Toe',
    description: 'Classic 3 × 3 strategy game',
    route: '/game/tic-tac-toe',
  },
];

export function Home() {
  const handleGamePress = (game: GameItem) => {
    router.push(game.route as never);
  };

  const handleStatisticsPress = () => {
    router.push('/game/statistics');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.header}>
            <ThemedText style={styles.logo}>🧠</ThemedText>

            <ThemedText style={styles.title}>Game Center</ThemedText>

            <ThemedText style={styles.subtitle}>
              Train your brain. Have fun.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Games</ThemedText>

            <ThemedView style={styles.gameList}>
              {GAMES.map((game) => (
                <GameCard
                  key={game.id}
                  icon={game.icon}
                  title={game.title}
                  description={game.description}
                  onPress={() => handleGamePress(game)}
                />
              ))}
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>More</ThemedText>

            <ThemedPressable
              onPress={handleStatisticsPress}
              style={styles.statisticsButton}
              type="backgroundElement"
            >
              <ThemedView style={styles.iconContainer}>
                <ThemedText style={styles.statisticsIcon}>📊</ThemedText>
              </ThemedView>

              <ThemedView
                style={styles.statisticsContent}
                type="backgroundElement"
              >
                <ThemedText style={styles.statisticsTitle}>
                  Statistics
                </ThemedText>

                <ThemedText style={styles.statisticsDescription}>
                  View your game performance
                </ThemedText>
              </ThemedView>

              <ThemedText style={styles.arrow}>›</ThemedText>
            </ThemedPressable>
          </ThemedView>

          <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
  },

  header: {
    alignItems: 'center',
    marginBottom: 36,
  },

  logo: {
    fontSize: 56,
    marginBottom: 12,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    opacity: 0.55,
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '800',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  gameList: {
    gap: 12,
  },

  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },

  statisticsButton: {
    minHeight: 76,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statisticsIcon: {
    fontSize: 26,
  },

  statisticsContent: {
    flex: 1,
    marginLeft: 16,
  },

  statisticsTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  statisticsDescription: {
    marginTop: 3,
    fontSize: 13,
    opacity: 0.55,
  },

  arrow: {
    marginLeft: 12,
    fontSize: 30,
    fontWeight: '300',
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  version: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.35,
  },
});
