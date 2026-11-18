import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { ActionButton } from '@/components/action-button';
import { StatusBanner } from '@/components/status-banner';
import { ThemedStackHeader } from '@/components/themed-stack-header';
import { ScanTips } from '@/features/document-scanner/components/ScanTips';
import { useScanNewDocument } from '@/features/document-scanner/hooks/useScanNewDocument';
import { MAX_NAME_LENGTH } from '@/features/document-scanner/services/document.service';
import { toDocumentError } from '@/features/document-scanner/types/errors';
import { defaultDocumentName } from '@/features/document-scanner/utils/documentName';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/shared/i18n';

export default function ScanScreen() {
  const router = useRouter();
  const theme = useTheme();
  const t = useT();
  const scan = useScanNewDocument();
  const [placeholder] = useState(() => defaultDocumentName(new Date()));
  const [name, setName] = useState('');

  const startScan = () =>
    scan.mutate(name.trim() || placeholder, {
      onSuccess: (document) => {
        if (document) router.replace({ pathname: '/documents/[id]', params: { id: document.id } });
      },
    });

  return (
    <ThemedView style={styles.root}>
      <ThemedStackHeader />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <KeyboardAvoidingView behavior="height" style={styles.fill}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {scan.error && <StatusBanner variant="error" error={toDocumentError(scan.error)} />}
            {scan.isSuccess && scan.data === null && <StatusBanner variant="cancelled" />}

            <ThemedView style={styles.field}>
              <ThemedText type="smallBold">{t.scan.nameLabel}</ThemedText>
              <ThemedTextInput
                value={name}
                onChangeText={setName}
                placeholder={placeholder}
                maxLength={MAX_NAME_LENGTH}
                editable={!scan.isPending}
                returnKeyType="go"
                onSubmitEditing={startScan}
                accessibilityLabel={t.scan.nameLabel}
                accessibilityHint={t.scan.nameA11yHint}
              />
              <ThemedText type="small" themeColor="textSecondary">
                {t.scan.nameHint}
              </ThemedText>
            </ThemedView>

            {scan.isPending ? (
              <ThemedView type="backgroundElement" style={styles.progress}>
                <ActivityIndicator color={theme.primary} />
                <ThemedText type="small" style={styles.fill}>
                  {t.scan.inProgress}
                </ThemedText>
              </ThemedView>
            ) : (
              <ScanTips />
            )}
          </ScrollView>

          <ThemedView style={styles.footer}>
            <ActionButton
              label={scan.isPending ? t.documents.scanning : t.scan.start}
              variant="primary"
              icon={{ ios: 'doc.viewfinder', android: 'document_scanner' }}
              disabled={scan.isPending}
              onPress={startScan}
            />
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  fill: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
});
