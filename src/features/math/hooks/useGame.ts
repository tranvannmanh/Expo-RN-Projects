import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../models/GameEngine';
import { GameState } from '../types';
import { hapticCorrect, hapticTimeout, hapticWrong } from '../utils/haptics';

export function useGame() {
	const engineRef = useRef<GameEngine | null>(null);
	const timeoutHandledRef = useRef(false);
	if (!engineRef.current) {
		engineRef.current = new GameEngine();
	}

	const engine = engineRef.current;

	const [state, setState] = useState<GameState>(() => engine.getState());
	const [remainingTimeMs, setRemainingTimeMs] = useState(0);
	const [answerFeedback, setAnswerFeedback] = useState<{
		answer: number;
		result: 'correct' | 'wrong';
	} | null>(null);

	useEffect(() => {
		if (state.status !== 'playing') {
			return;
		}

		const updateTimer = () => {
			const remaining = engine.getRemainingTimeMs();
			if (remaining <= 0) {
				engine.submitTimeout();
				if (!timeoutHandledRef.current) {
					hapticTimeout();
					timeoutHandledRef.current = true;
				}
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
			const correct = engine.submitAnswer(answer);

			if (correct) {
				hapticCorrect();
			} else {
				hapticWrong();
			}

			setAnswerFeedback({
				answer,
				result: correct ? 'correct' : 'wrong',
			});

			setState(engine.getState());

			if (engine.getState().status === 'game_over') {
				setTimeout(() => {
					setAnswerFeedback(null);
				}, 400);

				return;
			}

			setTimeout(() => {
				engine.nextQuestion();

				setAnswerFeedback(null);
				setState(engine.getState());
			}, 400);
		},
		[engine],
	);

	const restartGame = useCallback(() => {
		engine.reset();
		engine.start();
		timeoutHandledRef.current = false; // to enable haptic timeout on next game
		setState(engine.getState());
	}, [engine]);

	return {
		state,
		startGame,
		submitAnswer,
		restartGame,
		remainingTimeMs,
		answerFeedback,
	};
}
