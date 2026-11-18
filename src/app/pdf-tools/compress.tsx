import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import type { CompressionPreset } from '@modules/pdf-tools';
import { ActionButton } from '@/components/action-button';
import { ScreenLayout } from '@/components/screen-layout';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { type ChipOption, OptionChips } from '@/features/pdf-tools/components/OptionChips';
import { TOOL_ICONS } from '@/features/pdf-tools/constants';
import { usePdfFile } from '@/features/pdf-tools/hooks/usePdfFiles';
import { useCompressPdf } from '@/features/pdf-tools/hooks/usePdfToolMutations';
import { formatBytes, savedPercent } from '@/features/pdf-tools/utils/formatBytes';
import { type Messages, useT } from '@/shared/i18n';

const presets = (t: Messages): ChipOption<CompressionPreset>[] => [
  { value: 'light', label: t.pdfTools.compress.light, description: t.pdfTools.compress.lightDescription },
  { value: 'balanced', label: t.pdfTools.compress.balanced, description: t.pdfTools.compress.balancedDescription },
  { value: 'strong', label: t.pdfTools.compress.strong, description: t.pdfTools.compress.strongDescription },
];

export default function CompressScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const file = usePdfFile(id).data;
  const compress = useCompressPdf(id);
  const [preset, setPreset] = useState<CompressionPreset>('balanced');
  const result = compress.data;
  const notReduced = compress.error?.code === 'NOT_REDUCED';

  return (
    <ScreenLayout
      footer={
        result ? (
          <ActionButton
            label={t.pdfTools.compress.open}
            variant="primary"
            icon={TOOL_ICONS.pdf}
            onPress={() =>
              router.replace({ pathname: '/pdf-tools/[id]', params: { id: result.file.id } })
            }
          />
        ) : (
          <ActionButton
            label={compress.isPending ? t.pdfTools.compress.running : t.pdfTools.compress.run}
            variant="primary"
            icon={TOOL_ICONS.compress}
            disabled={!file || compress.isPending}
            onPress={() => compress.mutate(preset)}
          />
        )
      }>
      {notReduced && <StatusBanner variant="info" message={t.errors.NOT_REDUCED} />}
      {compress.error && !notReduced && <StatusBanner variant="error" error={compress.error} />}

      {file && (
        <ThemedText type="small" themeColor="textSecondary">
          {t.pdfTools.compress.intro(file.name, formatBytes(file.sizeBytes))}
        </ThemedText>
      )}

      {result ? (
        <ThemedView type="backgroundElement" style={styles.result}>
          <ThemedText type="subtitle">
            −{savedPercent(result.inputBytes, result.outputBytes)}%
          </ThemedText>
          <ThemedText>
            {formatBytes(result.inputBytes)} → {formatBytes(result.outputBytes)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.pdfTools.compress.savedAs(result.file.name)}
          </ThemedText>
        </ThemedView>
      ) : (
        <OptionChips
          label={t.pdfTools.compress.level}
          options={presets(t)}
          value={preset}
          disabled={compress.isPending}
          onChange={setPreset}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  result: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
});
