import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../models/GameEngine';
import { HighScoreManager } from '../services';
import { GameState } from '../types';
import {
	hapticCorrect,
	hapticLevelUp,
	hapticTimeout,
	hapticWrong,
} from '../utils/haptics';

export function useGame() {
	const engineRef = useRef<GameEngine>(new GameEngine());
	const highScoreManagerRef = useRef<HighScoreManager>(new HighScoreManager());

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

	// game level
	const [levelUp, setLevelUp] = useState<number | null>(null);
	const difficultyRef = useRef(engine.getState().difficulty);

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

		const newState = engine.getState();

		difficultyRef.current = newState.difficulty;

		setLevelUp(null);
		setScoreFeedback(null);
		setAnswerFeedback(null);
		setIsNewHighScore(false);

		setState(newState);
	}, [engine]);

	const dismissLevelUp = useCallback(() => {
		setLevelUp(null);
	}, []);

	const submitAnswer = useCallback(
		(answer: number) => {
			const previousDifficulty = difficultyRef.current;

			const result = engine.submitAnswer(answer);

			const nextState = engine.getState();

			difficultyRef.current = nextState.difficulty;

			if (
				nextState.status === 'playing' &&
				nextState.difficulty > previousDifficulty
			) {
				setLevelUp(nextState.difficulty);
				hapticLevelUp();
			}

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
				setScoreFeedback(null);
				setAnswerFeedback(null);
			}, 400);
		},
		[engine, highScoreManager],
	);

	const restartGame = useCallback(() => {
		engine.reset();
		engine.start();
		const newState = engine.getState();
		difficultyRef.current = newState.difficulty;
		setLevelUp(null);
		setScoreFeedback(null);
		setAnswerFeedback(null);
		setIsNewHighScore(false);
		setState(newState);
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

		// level up
		dismissLevelUp,
		levelUp,
	};
}
