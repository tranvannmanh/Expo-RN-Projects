import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ScreenLayout } from '@/components/screen-layout';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { Spacing } from '@/constants/theme';
import { MergeRow } from '@/features/pdf-tools/components/MergeRow';
import { TOOL_ICONS } from '@/features/pdf-tools/constants';
import { useMergeSelection } from '@/features/pdf-tools/hooks/useMergeSelection';
import { usePdfFiles } from '@/features/pdf-tools/hooks/usePdfFiles';
import { useMergePdfs } from '@/features/pdf-tools/hooks/usePdfToolMutations';
import { MAX_PDF_NAME_LENGTH } from '@/features/pdf-tools/services/pdfTools.service';
import { useT } from '@/shared/i18n';

export default function MergeScreen() {
  const t = useT();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const router = useRouter();
  const files = usePdfFiles().data ?? [];
  const merge = useMergePdfs();
  const selection = useMergeSelection(first ? [first] : []);
  const [name, setName] = useState(t.pdfTools.mergeScreen.defaultName);
  const busy = merge.isPending;

  // Selected files first, in merge order; then the rest, newest first.
  const ordered = [
    ...selection.selected.flatMap((id) => files.filter((f) => f.id === id)),
    ...files.filter((f) => selection.orderOf(f.id) < 0),
  ];
  const pageTotal = ordered
    .filter((f) => selection.orderOf(f.id) >= 0)
    .reduce((sum, f) => sum + f.pageCount, 0);

  const run = () =>
    merge.mutate(
      { ids: selection.selected, name },
      {
        onSuccess: (created) =>
          router.replace({ pathname: '/pdf-tools/[id]', params: { id: created.id } }),
      },
    );

  return (
    <ScreenLayout
      footer={
        <ActionButton
          label={busy ? t.pdfTools.mergeScreen.running : t.pdfTools.mergeScreen.run(selection.selected.length)}
          variant="primary"
          icon={TOOL_ICONS.merge}
          disabled={busy || selection.selected.length < 2 || !name.trim()}
          onPress={run}
        />
      }>
      {merge.error && <StatusBanner variant="error" error={merge.error} />}
      <ThemedText type="small" themeColor="textSecondary">
        {t.pdfTools.mergeScreen.intro}
        {selection.selected.length >= 2 ? t.pdfTools.mergeScreen.result(pageTotal) : ''}
      </ThemedText>

      <View style={styles.field}>
        <ThemedText type="smallBold">{t.pdfTools.mergeScreen.nameLabel}</ThemedText>
        <ThemedTextInput
          value={name}
          onChangeText={setName}
          maxLength={MAX_PDF_NAME_LENGTH}
          editable={!busy}
          invalid={!name.trim()}
          accessibilityLabel={t.pdfTools.mergeScreen.nameLabel}
        />
      </View>

      {ordered.map((file) => {
        const order = selection.orderOf(file.id);
        return (
          <MergeRow
            key={file.id}
            file={file}
            order={order}
            isFirst={order === 0}
            isLast={order === selection.selected.length - 1}
            disabled={busy}
            onToggle={() => selection.toggle(file.id)}
            onMove={(offset) => selection.move(file.id, offset)}
          />
        );
      })}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
});
