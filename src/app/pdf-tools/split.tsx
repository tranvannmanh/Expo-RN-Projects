import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ScreenLayout } from '@/components/screen-layout';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing } from '@/constants/theme';
import { type ChipOption, OptionChips } from '@/features/pdf-tools/components/OptionChips';
import { TOOL_ICONS } from '@/features/pdf-tools/constants';
import { usePdfFile } from '@/features/pdf-tools/hooks/usePdfFiles';
import { useSplitPdf } from '@/features/pdf-tools/hooks/usePdfToolMutations';
import { everyPage, formatRange, parsePageRanges } from '@/features/pdf-tools/utils/pageRanges';
import { toAppError } from '@/shared/errors/appError';
import { type Messages, useT } from '@/shared/i18n';

type Mode = 'ranges' | 'every';
const modes = (t: Messages): ChipOption<Mode>[] => [
  { value: 'ranges', label: t.pdfTools.split.ranges, description: t.pdfTools.split.rangesDescription },
  { value: 'every', label: t.pdfTools.split.every, description: t.pdfTools.split.everyDescription },
];

/** Above this many outputs, list only the first few in the preview. */
const PREVIEW_LIMIT = 6;

export default function SplitScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const file = usePdfFile(id).data;
  const split = useSplitPdf(id);
  const [mode, setMode] = useState<Mode>('ranges');
  const [text, setText] = useState('');

  const parsed = useMemo(() => {
    if (!file) return { ranges: [], error: null };
    if (mode === 'every') return { ranges: everyPage(file.pageCount), error: null };
    if (!text.trim()) return { ranges: [], error: null };
    try {
      return { ranges: parsePageRanges(text, file.pageCount), error: null };
    } catch (error) {
      return { ranges: [], error: toAppError(error).message };
    }
    // `t` is a dependency so validation messages follow a language change.
  }, [file, mode, text, t]);

  const run = () =>
    split.mutate(parsed.ranges, { onSuccess: () => router.dismissTo('/pdf-tools') });

  return (
    <ScreenLayout
      footer={
        <ActionButton
          label={split.isPending ? t.pdfTools.split.running : t.pdfTools.split.run(parsed.ranges.length)}
          variant="primary"
          icon={TOOL_ICONS.split}
          disabled={!file || split.isPending || parsed.ranges.length === 0}
          onPress={run}
        />
      }>
      {split.error && <StatusBanner variant="error" error={split.error} />}
      {file && (
        <ThemedText type="small" themeColor="textSecondary">
          {t.pdfTools.split.intro(file.name, file.pageCount)}
        </ThemedText>
      )}

      <OptionChips
        label={t.pdfTools.split.how}
        options={modes(t)}
        value={mode}
        disabled={split.isPending}
        onChange={setMode}
      />

      {mode === 'ranges' && (
        <View style={styles.field}>
          <ThemedText type="smallBold">{t.pdfTools.split.pagesLabel}</ThemedText>
          <ThemedTextInput
            value={text}
            onChangeText={setText}
            placeholder={file ? t.pdfTools.split.placeholder(Math.min(2, file.pageCount), file.pageCount) : ''}
            keyboardType="numbers-and-punctuation"
            editable={!split.isPending}
            invalid={parsed.error !== null}
            accessibilityLabel={t.pdfTools.split.pagesA11y}
          />
          {parsed.error && (
            <ThemedText type="small" themeColor="danger">
              {parsed.error}
            </ThemedText>
          )}
        </View>
      )}

      {parsed.ranges.length > 0 && (
        <View style={styles.field}>
          <ThemedText type="smallBold">{t.pdfTools.split.result}</ThemedText>
          {parsed.ranges.slice(0, PREVIEW_LIMIT).map((range, index) => (
            <ThemedText
              key={`${range.from}-${range.to}-${index}`}
              type="small"
              themeColor="textSecondary">
              {t.pdfTools.split.resultItem(index + 1, formatRange(range))}
            </ThemedText>
          ))}
          {parsed.ranges.length > PREVIEW_LIMIT && (
            <ThemedText type="small" themeColor="textSecondary">
              {t.pdfTools.split.more(parsed.ranges.length - PREVIEW_LIMIT)}
            </ThemedText>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
});
