import { GAME_CONFIG } from '../constants/GameConfigs';
import { GameState } from '../types';
import { AnswerValidator } from './AnswerValidator';
import { QuestionGenerator } from './QuestionGenerator';
import { ScoreManager } from './ScoreManager';

export class GameEngine {
	private readonly questionGenerator: QuestionGenerator;
	private readonly answerValidator: AnswerValidator;
	private readonly scoreManager: ScoreManager;

	private state: GameState;

	constructor() {
		this.questionGenerator = new QuestionGenerator();
		this.answerValidator = new AnswerValidator();
		this.scoreManager = new ScoreManager();

		this.state = {
			status: 'idle',
			score: 0,
			combo: 0,
			lives: GAME_CONFIG.initialLives,
			question: null,
			bestCombo: 0,
			totalQuestions: 0,
			correctAnswers: 0,
			result: null,
		};
	}

	start(): void {
		this.state = {
			status: 'playing',
			score: 0,
			combo: 0,
			lives: GAME_CONFIG.initialLives,
			question: this.questionGenerator.generate(1),
			bestCombo: 0,
			totalQuestions: 0,
			correctAnswers: 0,
			result: null,
		};
	}

	submitAnswer(answer: number): boolean {
		if (this.state.status !== 'playing' || !this.state.question) {
			return false;
		}

		const correct = this.answerValidator.validate(this.state.question, answer);

		if (correct) {
			const earnedScore = this.scoreManager.calculateCorrectScore(
				this.state.combo,
			);
			this.state.score += earnedScore;
			this.state.combo += 1;
		} else {
			this.state.lives -= 1;
			this.state.combo = 0;
		}

		if (this.state.lives <= 0) {
			this.state.status = 'game_over';
			this.state.question = null;
		} else {
			this.state.question = this.questionGenerator.generate(1);
		}

		return correct;
	}

	getState(): GameState {
		return {
			...this.state,
			question: this.state.question
				? {
						...this.state.question,
						options: [...this.state.question.options],
					}
				: null,
		};
	}

	reset(): void {
		this.state = {
			status: 'idle',
			score: 0,
			combo: 0,
			bestCombo: 0,
			lives: GAME_CONFIG.initialLives,
			totalQuestions: 0,
			correctAnswers: 0,
			question: null,
			result: null,
		};
	}
}
