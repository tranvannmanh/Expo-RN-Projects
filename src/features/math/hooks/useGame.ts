import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../models/GameEngine';
import { GameState } from '../types';

export function useGame() {
	const engineRef = useRef<GameEngine | null>(null);

	if (!engineRef.current) {
		engineRef.current = new GameEngine();
	}

	const engine = engineRef.current;

	const [state, setState] = useState<GameState>(() => engine.getState());
	const [remainingTimeMs, setRemainingTimeMs] = useState(0);

	useEffect(() => {
		if (state.status !== 'playing') {
			return;
		}

		const updateTimer = () => {
			const remaining = engine.getRemainingTimeMs();
			if (remaining <= 0) {
				engine.submitTimeout();
				setState(engine.getState());
				setRemainingTimeMs(0);
				return;
			}
			setRemainingTimeMs(remaining);
		};

		updateTimer();

		// call this function every 100ms to update the timer
		const interval = setInterval(updateTimer, 100);

		return () => {
			// it will prevent memory leak
			clearInterval(interval);
		};
	}, [state.status, state.question]);

	const startGame = useCallback(() => {
		engine.start();
		setState(engine.getState());
	}, [engine]);

	const submitAnswer = useCallback(
		(answer: number) => {
			engine.submitAnswer(answer);
			setState(engine.getState());
		},
		[engine],
	);

	const restartGame = useCallback(() => {
		engine.reset();
		engine.start();

		setState(engine.getState());
	}, [engine]);

	return {
		state,
		startGame,
		submitAnswer,
		restartGame,
		remainingTimeMs,
	};
}
