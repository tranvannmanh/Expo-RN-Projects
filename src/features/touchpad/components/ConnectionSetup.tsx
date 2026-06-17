import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

import { DEFAULT_PORT } from '../constants';
import { useTouchpadConnection } from '../hooks/useTouchpadConnection';
import { useTouchpadStore } from '../store/touchpadStore';

export function ConnectionSetup() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const config = useTouchpadStore((s) => s.config);
  const setConfig = useTouchpadStore((s) => s.setConfig);
  const errorMessage = useTouchpadStore((s) => s.errorMessage);
  const { connect, connectionStatus } = useTouchpadConnection();

  const [portText, setPortText] = useState(String(config.port || DEFAULT_PORT));

  const isConnecting = connectionStatus === 'connecting';
  const hasError = connectionStatus === 'error';

  function handlePortChange(text: string) {
    setPortText(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 65536) {
      setConfig({ port: parsed });
    }
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>Remote Touchpad</ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: colors.textSecondary }]}>
        Make sure your Mac is running the server and both devices are on the same Wi-Fi
      </ThemedText>

      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <ThemedText type="smallBold">Server IP Address</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }]}
            placeholder="192.168.1.100"
            placeholderTextColor={colors.textSecondary}
            value={config.host}
            onChangeText={(text) => setConfig({ host: text })}
            keyboardType="decimal-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="smallBold">Port</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }]}
            placeholder={String(DEFAULT_PORT)}
            placeholderTextColor={colors.textSecondary}
            value={portText}
            onChangeText={handlePortChange}
            keyboardType="number-pad"
          />
        </View>

        {hasError && (
          <ThemedText type="small" style={styles.errorText}>
            {errorMessage ?? 'Connection failed. Check IP and ensure server is running.'}
          </ThemedText>
        )}

        <Pressable
          style={[
            styles.connectButton,
            { backgroundColor: colors.text },
            isConnecting && styles.connectButtonDisabled,
          ]}
          onPress={connect}
          disabled={isConnecting || !config.host.trim()}>
          {isConnecting ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <ThemedText type="smallBold" style={{ color: colors.background }}>
              Connect
            </ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  form: {
    width: '100%',
    maxWidth: 360,
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  input: {
    height: 48,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  connectButton: {
    height: 52,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
  },
});
