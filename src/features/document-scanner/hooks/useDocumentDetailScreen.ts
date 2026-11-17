import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import type { PageView } from '../types/document';
import { toDocumentError } from '../types/errors';
import { usePagePreview } from './usePagePreview';
import { usePageReorder } from './usePageReorder';
import { useDeleteDocument } from './useDeleteDocument';
import { useDocument } from './useDocument';
import { useDocumentExport } from './useDocumentExport';
import { useAddPages, useDeletePage, useRenameDocument, useReorderPages } from './useDocumentMutations';
import { useDocumentPages } from './useDocumentPages';

/** All state and actions for DocumentDetailScreen; the screen only renders. */
export function useDocumentDetailScreen(documentId: string) {
  const router = useRouter();
  const document = useDocument(documentId);
  const pagesQuery = useDocumentPages(documentId);
  const savedPages = pagesQuery.data ?? [];

  const rename = useRenameDocument(documentId);
  const deletePage = useDeletePage();
  const reorderPages = useReorderPages(documentId);
  const addPages = useAddPages(documentId);
  const deleteDocument = useDeleteDocument();
  const exporter = useDocumentExport(documentId, document.data?.name ?? '');

  const reorder = usePageReorder(savedPages);
  const preview = usePagePreview();
  const [isRenaming, setIsRenaming] = useState(false);

  const mutations = [rename, deletePage, reorderPages, addPages, deleteDocument];
  const busy = mutations.some((m) => m.isPending) || exporter.busy;
  const failed =
    mutations.find((m) => m.error)?.error ?? exporter.error ?? document.error ?? pagesQuery.error;

  const removeDocument = () =>
    deleteDocument.mutate(documentId, { onSuccess: () => router.back() });

  const confirmDeletePage = (page: PageView) => {
    if (savedPages.length === 1) {
      Alert.alert('Delete the last page?', 'A document needs at least one page, so the whole document will be deleted.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete document', style: 'destructive', onPress: removeDocument },
      ]);
      return;
    }
    Alert.alert(`Delete page ${page.pageNumber}?`, 'The page image will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePage.mutate(page.id) },
    ]);
  };

  const saveOrder = () => {
    if (!reorder.isDirty) return reorder.cancel();
    reorderPages.mutate(reorder.orderedIds, { onSuccess: reorder.cancel });
  };

  const saveName = (name: string) =>
    rename.mutate(name, { onSuccess: () => setIsRenaming(false) });

  return {
    document: document.data ?? null,
    isLoading: document.isPending || pagesQuery.isPending,
    notFound: document.isSuccess && document.data === null,
    error: failed ? toDocumentError(failed) : null,
    addCancelled: addPages.isSuccess && addPages.data === false,
    busy,
    isAddingPages: addPages.isPending,
    pages: reorder.pages,
    savedPages,
    reorder,
    preview,
    exporter,
    rename: {
      visible: isRenaming,
      saving: rename.isPending,
      open: () => setIsRenaming(true),
      close: () => setIsRenaming(false),
      save: saveName,
    },
    actions: {
      addPages: () => addPages.mutate(undefined),
      confirmDeletePage,
      saveOrder,
    },
  };
}
