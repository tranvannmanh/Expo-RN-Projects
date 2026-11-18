import { useState } from 'react';

/** Ordered multi-selection: tap toggles, arrows reorder; the order is the merge order. */
export function useMergeSelection(initial: string[]) {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const move = (id: string, offset: -1 | 1) =>
    setSelected((current) => {
      const index = current.indexOf(id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return { selected, toggle, move, orderOf: (id: string) => selected.indexOf(id) };
}
