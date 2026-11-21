import { create } from 'zustand';

import { DEFAULT_ADJUSTMENTS } from '../constants/adjustments.constants';
import { DEFAULT_GEOMETRY, MAX_HISTORY } from '../constants/editor.constants';
import { NO_EFFECTS } from '../constants/effects.constants';
import { DEFAULT_FILM_ID, IDENTITY_CURVES } from '../constants/film-presets.constants';
import type {
  AdjustmentKey,
  EditorTool,
  EffectSelection,
  EditRecipe,
  SourcePhoto,
} from '../types/editor.types';

export const createDefaultRecipe = (): EditRecipe => ({
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  filmId: DEFAULT_FILM_ID,
  effects: NO_EFFECTS,
  curves: IDENTITY_CURVES,
  geometry: DEFAULT_GEOMETRY,
});

type EditorState = {
  photo: SourcePhoto | null;
  recipe: EditRecipe;
  past: EditRecipe[];
  future: EditRecipe[];
  tool: EditorTool;
  /** Selected crop aspect option id (session UI state, not part of history). */
  aspectId: string;

  /** Opens a photo with a fresh recipe, optionally pre-filled (e.g. the film used when shooting). */
  openPhoto: (photo: SourcePhoto, initial?: Partial<EditRecipe>) => void;
  closePhoto: () => void;
  setTool: (tool: EditorTool) => void;
  /** Records the current recipe in history (call before a live change). */
  checkpoint: () => void;
  /** Live update without a history entry (used while dragging). */
  setLive: (patch: Partial<EditRecipe>) => void;
  /** checkpoint + setLive. */
  apply: (patch: Partial<EditRecipe>) => void;
  undo: () => void;
  redo: () => void;
  resetAll: () => void;
  setAdjustment: (key: AdjustmentKey, value: number) => void;
  selectFilm: (filmId: string) => void;
  setEffects: (patch: Partial<EffectSelection>) => void;
  /** Applies color edits of another recipe, keeping this photo's geometry. */
  pasteRecipe: (recipe: EditRecipe) => void;
  setAspectId: (aspectId: string) => void;
};

/**
 * Fills fields missing from recipes saved by older versions (album entries),
 * so new adjustments never reach the shader as undefined.
 */
const withDefaults = (recipe: Partial<EditRecipe> = {}): EditRecipe => {
  const base = createDefaultRecipe();
  return {
    ...base,
    ...recipe,
    adjustments: { ...base.adjustments, ...recipe.adjustments },
    effects: { ...base.effects, ...recipe.effects },
  };
};

const pushHistory = (past: EditRecipe[], recipe: EditRecipe) =>
  [...past, recipe].slice(-MAX_HISTORY);

export const useEditorStore = create<EditorState>()((set, get) => ({
  photo: null,
  recipe: createDefaultRecipe(),
  past: [],
  future: [],
  tool: 'film',
  aspectId: 'free',

  openPhoto: (photo, initial) =>
    set({
      photo,
      recipe: withDefaults(initial),
      past: [],
      future: [],
      tool: 'film',
      aspectId: 'free',
    }),
  closePhoto: () => set({ photo: null, past: [], future: [] }),
  setTool: (tool) => set({ tool }),

  checkpoint: () => {
    const { past, recipe } = get();
    set({ past: pushHistory(past, recipe), future: [] });
  },
  setLive: (patch) => set((s) => ({ recipe: { ...s.recipe, ...patch } })),
  apply: (patch) => {
    get().checkpoint();
    get().setLive(patch);
  },

  undo: () => {
    const { past, future, recipe } = get();
    const previous = past.at(-1);
    if (!previous) return;
    set({ recipe: previous, past: past.slice(0, -1), future: [recipe, ...future] });
  },
  redo: () => {
    const { past, future, recipe } = get();
    const [next, ...rest] = future;
    if (!next) return;
    set({ recipe: next, past: pushHistory(past, recipe), future: rest });
  },
  resetAll: () => {
    get().apply(createDefaultRecipe());
    set({ aspectId: 'free' });
  },
  setAdjustment: (key, value) =>
    get().apply({ adjustments: { ...get().recipe.adjustments, [key]: value } }),
  selectFilm: (filmId) =>
    get().apply({ filmId, adjustments: { ...get().recipe.adjustments, filmStrength: 100 } }),
  setEffects: (patch) => get().apply({ effects: { ...get().recipe.effects, ...patch } }),
  pasteRecipe: (recipe) => {
    const { adjustments, filmId, effects, curves } = withDefaults(recipe);
    get().apply({ adjustments, filmId, effects, curves });
  },
  setAspectId: (aspectId) => set({ aspectId }),
}));
