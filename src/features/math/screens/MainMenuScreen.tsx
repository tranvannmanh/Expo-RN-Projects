import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function MainMenuScreen() {
  const handlePlay = () => {
    router.push('/game/math');
  };

  const handleStatistics = () => {
    router.push('/statistics');
  };

  const handleSettings = () => {
    // TODO: implement later
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🧠</Text>

        <Text style={styles.title}>Math Challenge</Text>

        <Text style={styles.subtitle}>Test your math skills</Text>
      </View>

      <View style={styles.menu}>
        <MenuButton
          icon="▶️"
          title="Play"
          subtitle="Start a new game"
          onPress={handlePlay}
          // primary
        />

        <MenuButton
          icon="📊"
          title="Statistics"
          subtitle="View your performance"
          onPress={handleStatistics}
        />

        <MenuButton
          icon="⚙️"
          title="Settings"
          subtitle="Customize your game"
          onPress={handleSettings}
        />
      </View>

      <Text style={styles.version}>Math Challenge v1.0.0</Text>
    </View>
  );
}

type MenuButtonProps = {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  primary?: boolean;
};

function MenuButton({
  icon,
  title,
  subtitle,
  onPress,
  primary = false,
}: MenuButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && styles.primaryButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.buttonContent}>
        <Text
          style={[styles.buttonTitle, primary && styles.primaryButtonTitle]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.buttonSubtitle,
            primary && styles.primaryButtonSubtitle,
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <Text style={[styles.arrow, primary && styles.primaryButtonTitle]}>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },

  header: {
    alignItems: 'center',
  },

  logo: {
    fontSize: 64,
    marginBottom: 16,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    opacity: 0.6,
  },

  menu: {
    gap: 14,
  },

  button: {
    minHeight: 78,
    paddingHorizontal: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },

  primaryButton: {
    backgroundColor: '#222',
  },

  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },

  icon: {
    fontSize: 24,
  },

  buttonContent: {
    flex: 1,
    marginLeft: 14,
  },

  buttonTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  primaryButtonTitle: {
    color: '#fff',
  },

  buttonSubtitle: {
    marginTop: 3,
    fontSize: 13,
    opacity: 0.55,
  },

  primaryButtonSubtitle: {
    color: '#fff',
    opacity: 0.7,
  },

  arrow: {
    fontSize: 30,
    fontWeight: '300',
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.4,
  },
});
