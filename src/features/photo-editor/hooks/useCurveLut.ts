import { useMemo } from 'react';

import { IDENTITY_CURVES } from '../constants/film-presets.constants';
import { isIdentityCurveSet, makeCurveLut } from '../lib/curve';
import type { CurveSet, FilmPreset } from '../types/editor.types';

/** 256x2 curve texture (film row + user row), rebuilt only when curves change. */
export function useCurveLut(film: FilmPreset, userCurves: CurveSet = IDENTITY_CURVES) {
  const lut = useMemo(() => makeCurveLut(film.curves, userCurves), [film, userCurves]);
  const hasUserCurve = useMemo(() => !isIdentityCurveSet(userCurves), [userCurves]);
  return { lut, hasUserCurve };
}
