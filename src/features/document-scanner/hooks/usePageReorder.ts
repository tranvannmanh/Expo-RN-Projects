import { useState } from 'react';

import type { PageView } from '../types/document';

/** Local draft order while the user rearranges pages; committed via `onSave`. */
export function usePageReorder(pages: PageView[]) {
  const [draft, setDraft] = useState<PageView[] | null>(null);
  const isReordering = draft !== null;

  const start = () => setDraft(pages);
  const cancel = () => setDraft(null);

  const move = (index: number, offset: -1 | 1) =>
    setDraft((current) => {
      if (!current) return current;
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const isDirty = draft !== null && draft.some((page, index) => page.id !== pages[index]?.id);

  return {
    isReordering,
    isDirty,
    /** Pages to render: the draft while reordering, otherwise the saved order */
    pages: (draft ?? pages).map((page, index) => ({ ...page, pageNumber: index + 1 })),
    orderedIds: (draft ?? pages).map((page) => page.id),
    start,
    cancel,
    move,
  };
}
