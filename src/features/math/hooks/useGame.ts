import { useCallback, useRef, useState } from 'react';
import { GameEngine } from '../models/GameEngine';
import { GameState } from '../types';

export function useGame() {
	const engineRef = useRef<GameEngine | null>(null);

	if (!engineRef.current) {
		engineRef.current = new GameEngine();
	}

	const engine = engineRef.current;

	const [state, setState] = useState<GameState>(() => engine.getState());

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

	const resetGame = useCallback(() => {
		engine.reset();

		setState(engine.getState());
	}, [engine]);

	return {
		state,
		startGame,
		submitAnswer,
		resetGame,
	};
}
