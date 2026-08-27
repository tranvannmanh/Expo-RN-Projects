import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../models/GameEngine';
import { HighScoreManager } from '../services';
import { GameState } from '../types';
import { hapticCorrect, hapticTimeout, hapticWrong } from '../utils/haptics';

export function useGame() {
	const engineRef = useRef<GameEngine>(new GameEngine());
	const highScoreManagerRef = useRef<HighScoreManager>(new HighScoreManager());
	const timeoutHandledRef = useRef(false);

	const engine = engineRef.current;
	const highScoreManager = highScoreManagerRef.current;

	const [highScore, setHighScore] = useState(() =>
		highScoreManager.getHighScore(),
	);
	const [isNewHighScore, setIsNewHighScore] = useState(false);
	const [scoreFeedback, setScoreFeedback] = useState<{
		score: number;
		combo: number;
	} | null>(null);
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

				const nextState = engine.getState();

				if (nextState.status === 'game_over') {
					const newHighScore = highScoreManager.saveIfHigher(nextState.score);

					if (newHighScore) {
						setHighScore(nextState.score);
						setIsNewHighScore(true);
					}

					hapticTimeout();
				}

				setState(nextState);
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
			const result = engine.submitAnswer(answer);

			const nextState = engine.getState();

			if (result.correct) {
				setScoreFeedback({
					score: result.earnedScore,
					combo: nextState.combo,
				});

				hapticCorrect();
			} else {
				setScoreFeedback(null);

				hapticWrong();
			}

			setAnswerFeedback({
				answer,
				result: result.correct ? 'correct' : 'wrong',
			});

			setState(nextState);

			if (nextState.status === 'game_over') {
				const newHighScore = highScoreManager.saveIfHigher(nextState.score);

				if (newHighScore) {
					setHighScore(nextState.score);
					setIsNewHighScore(true);
				}

				setTimeout(() => {
					setScoreFeedback(null);
					setAnswerFeedback(null);
				}, 400);

				return;
			}

			setTimeout(() => {
				engine.nextQuestion();

				setScoreFeedback(null);
				setAnswerFeedback(null);

				setState(engine.getState());
			}, 400);
		},
		[engine, highScoreManager],
	);

	const restartGame = useCallback(() => {
		engine.reset();
		engine.start();
		timeoutHandledRef.current = false; // to enable haptic timeout on next game
		setState(engine.getState());
	}, [engine]);

	return {
		// main game states
		state,
		startGame,
		submitAnswer,
		restartGame,
		remainingTimeMs,

		// feedback on answers and score
		answerFeedback,
		scoreFeedback,

		// high score states
		highScore,
		setIsNewHighScore,
	};
}
