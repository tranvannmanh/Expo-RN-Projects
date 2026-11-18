import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { toAppError } from '@/shared/errors/appError';
import { getT } from '@/shared/i18n';

import { usePdfFile } from './usePdfFiles';
import {
  useDeletePdf,
  useRenamePdf,
  useSavePdfToDocuments,
  useSavePdfWithPicker,
  useSharePdf,
} from './usePdfToolMutations';

/** State + actions for the PDF detail screen; the screen only renders. */
export function usePdfDetailScreen(id: string) {
  const router = useRouter();
  const file = usePdfFile(id);
  const rename = useRenamePdf(id);
  const remove = useDeletePdf();
  const share = useSharePdf();
  const save = useSavePdfToDocuments();
  const saveAs = useSavePdfWithPicker();
  const [renaming, setRenaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const mutations = [rename, remove, share, save, saveAs];
  const failed = mutations.find((m) => m.error)?.error ?? file.error;

  const confirmDelete = () => {
    if (!file.data) return;
    const t = getT();
    Alert.alert(
      t.pdfTools.deleteTitle,
      t.pdfTools.deleteMessage(file.data.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => remove.mutate(id, { onSuccess: () => router.back() }),
        },
      ],
    );
  };

  return {
    file: file.data ?? null,
    isLoading: file.isPending,
    notFound: file.isSuccess && file.data === null,
    error: failed ? toAppError(failed) : null,
    notice,
    busy: mutations.some((m) => m.isPending),
    rename: {
      visible: renaming,
      saving: rename.isPending,
      open: () => setRenaming(true),
      close: () => setRenaming(false),
      save: (name: string) => rename.mutate(name, { onSuccess: () => setRenaming(false) }),
    },
    actions: {
      share: () => share.mutate(id),
      save: () => save.mutate(id, { onSuccess: (r) => setNotice(getT().common.savedTo(r.displayPath)) }),
      saveAs: () =>
        saveAs.mutate(id, {
          onSuccess: (r) => setNotice(r.cancelled ? null : getT().common.savedToPicked),
        }),
      confirmDelete,
      openTool: (tool: 'compress' | 'watermark' | 'split') =>
        router.push({ pathname: `/pdf-tools/${tool}`, params: { id } }),
      merge: () => router.push({ pathname: '/pdf-tools/merge', params: { first: id } }),
    },
  };
}
