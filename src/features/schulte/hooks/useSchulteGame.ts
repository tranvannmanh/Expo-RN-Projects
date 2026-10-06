import { useCallback, useEffect, useRef, useState } from 'react';

import { SchulteGameEngine } from '../models/SchulteGameEngine';
import { SchulteGameState } from '../types';

export function useSchulteGame(size = 5) {
  const engineRef = useRef<SchulteGameEngine | null>(null);

  if (engineRef.current === null) {
    engineRef.current = new SchulteGameEngine(size);
  }

  const engine = engineRef.current;

  const [state, setState] = useState<SchulteGameState>(() => engine.getState());

  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (state.status !== 'playing') {
      return;
    }

    const updateTimer = () => {
      setElapsedMs(engine.getElapsedMs());
    };

    updateTimer();

    const interval = setInterval(updateTimer, 50);

    return () => {
      clearInterval(interval);
    };
  }, [engine, state.status]);

  const startGame = useCallback(() => {
    engine.start();

    const nextState = engine.getState();

    setState(nextState);
    setElapsedMs(0);
  }, [engine]);

  const selectNumber = useCallback(
    (number: number) => {
      const correct = engine.selectNumber(number);
      const nextState = engine.getState();

      setState(nextState);

      if (nextState.status === 'completed') {
        setElapsedMs(nextState.elapsedMs);
      }

      return correct;
    },
    [engine],
  );

  const resetGame = useCallback(() => {
    engine.reset();

    const nextState = engine.getState();

    setState(nextState);
    setElapsedMs(0);
  }, [engine]);

  return {
    state,
    elapsedMs,
    startGame,
    selectNumber,
    resetGame,
  };
}
