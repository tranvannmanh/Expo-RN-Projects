import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { WatermarkOptions, WatermarkPosition } from '@modules/pdf-tools';
import { ActionButton } from '@/components/action-button';
import { ScreenLayout } from '@/components/screen-layout';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing } from '@/constants/theme';
import { type ChipOption, OptionChips } from '@/features/pdf-tools/components/OptionChips';
import { WatermarkPreview } from '@/features/pdf-tools/components/WatermarkPreview';
import { TOOL_ICONS } from '@/features/pdf-tools/constants';
import { usePdfFile } from '@/features/pdf-tools/hooks/usePdfFiles';
import { useWatermarkPdf } from '@/features/pdf-tools/hooks/usePdfToolMutations';
import { type Messages, useT } from '@/shared/i18n';

const MAX_TEXT_LENGTH = 120;

const positions = (t: Messages): ChipOption<WatermarkPosition>[] => [
  { value: 'diagonal', label: t.pdfTools.watermark.diagonal },
  { value: 'tiled', label: t.pdfTools.watermark.tiled },
  { value: 'bottom', label: t.pdfTools.watermark.bottom },
];
/** Font sizes in PDF points. */
const sizes = (t: Messages): ChipOption<number>[] => [
  { value: 32, label: t.pdfTools.watermark.small },
  { value: 56, label: t.pdfTools.watermark.medium },
  { value: 88, label: t.pdfTools.watermark.large },
];
const OPACITIES: ChipOption<number>[] = [
  { value: 0.15, label: '15%' },
  { value: 0.3, label: '30%' },
  { value: 0.5, label: '50%' },
];
const colors = (t: Messages): ChipOption<string>[] => [
  { value: '#D93025', label: t.pdfTools.watermark.red },
  { value: '#5F6368', label: t.pdfTools.watermark.grey },
  { value: '#1A73E8', label: t.pdfTools.watermark.blue },
  { value: '#000000', label: t.pdfTools.watermark.black },
];

export default function WatermarkScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const file = usePdfFile(id).data;
  const watermark = useWatermarkPdf(id);
  const [options, setOptions] = useState<WatermarkOptions>({
    text: t.pdfTools.watermark.defaultText,
    fontSize: 56,
    opacity: 0.3,
    color: '#D93025',
    position: 'diagonal',
  });
  const update =
    <K extends keyof WatermarkOptions>(key: K) =>
    (value: WatermarkOptions[K]) =>
      setOptions((current) => ({ ...current, [key]: value }));
  const busy = watermark.isPending;

  const apply = () =>
    watermark.mutate(options, {
      onSuccess: (created) =>
        router.replace({ pathname: '/pdf-tools/[id]', params: { id: created.id } }),
    });

  return (
    <ScreenLayout
      footer={
        <ActionButton
          label={busy ? t.pdfTools.watermark.running : t.pdfTools.watermark.run}
          variant="primary"
          icon={TOOL_ICONS.watermark}
          disabled={!file || busy || !options.text.trim()}
          onPress={apply}
        />
      }>
      {watermark.error && <StatusBanner variant="error" error={watermark.error} />}

      <WatermarkPreview thumbnailPath={file?.thumbnailPath ?? null} options={options} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {t.pdfTools.watermark.preview}
      </ThemedText>

      <View style={styles.field}>
        <ThemedText type="smallBold">{t.pdfTools.watermark.text}</ThemedText>
        <ThemedTextInput
          value={options.text}
          onChangeText={update('text')}
          maxLength={MAX_TEXT_LENGTH}
          editable={!busy}
          invalid={!options.text.trim()}
          placeholder={t.pdfTools.watermark.textPlaceholder}
          accessibilityLabel={t.pdfTools.watermark.text}
        />
      </View>
      <OptionChips
        label={t.pdfTools.watermark.position}
        options={positions(t)}
        value={options.position}
        disabled={busy}
        onChange={update('position')}
      />
      <OptionChips
        label={t.pdfTools.watermark.size}
        options={sizes(t)}
        value={options.fontSize}
        disabled={busy}
        onChange={update('fontSize')}
      />
      <OptionChips
        label={t.pdfTools.watermark.opacity}
        options={OPACITIES}
        value={options.opacity}
        disabled={busy}
        onChange={update('opacity')}
      />
      <OptionChips
        label={t.pdfTools.watermark.colour}
        options={colors(t)}
        value={options.color}
        disabled={busy}
        onChange={update('color')}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  field: {
    gap: Spacing.two,
  },
});
