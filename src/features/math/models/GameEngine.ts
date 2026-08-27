import { GAME_CONFIG } from '../constants/GameConfigs';
import { AnswerResult, GameState } from '../types';
import { AnswerValidator } from './AnswerValidator';
import { QuestionGenerator } from './QuestionGenerator';
import { ScoreManager } from './ScoreManager';

const DIFF_LEVEL = 1;
export class GameEngine {
	private readonly questionGenerator: QuestionGenerator;
	private readonly answerValidator: AnswerValidator;
	private readonly scoreManager: ScoreManager;

	private state: GameState;
	private questionStartedAt: number | null = null;

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
			question: this.questionGenerator.generate(DIFF_LEVEL),
			bestCombo: 0,
			totalQuestions: 0,
			correctAnswers: 0,
			result: null,
		};
		this.questionStartedAt = Date.now();
	}

	submitAnswer(answer: number): AnswerResult {
		if (this.state.status !== 'playing' || !this.state.question) {
			return {
				correct: false,
				earnedScore: 0,
			};
		}

		if (this.isTimeExpired()) {
			this.submitTimeout();

			return {
				correct: false,
				earnedScore: 0,
			};
		}

		const correct = this.answerValidator.validate(this.state.question, answer);

		let earnedScore = 0;

		this.state.totalQuestions += 1;

		if (correct) {
			earnedScore = this.scoreManager.calculateCorrectScore(this.state.combo);

			this.state.score += earnedScore;
			this.state.combo += 1;
			this.state.correctAnswers += 1;

			this.state.bestCombo = Math.max(this.state.bestCombo, this.state.combo);
		} else {
			this.state.lives -= 1;
			this.state.combo = 0;
		}

		this.state.result = {
			score: this.state.score,
			bestCombo: this.state.bestCombo,
			totalQuestions: this.state.totalQuestions,
			correctAnswers: this.state.correctAnswers,
		};

		if (this.state.lives <= 0) {
			this.finishGame();
		}

		return {
			correct,
			earnedScore,
		};
	}

	getRemainingTimeMs(): number {
		if (this.questionStartedAt === null) {
			return 0;
		}
		const elapsed = Date.now() - this.questionStartedAt;
		return Math.max(0, GAME_CONFIG.questionTimeLimitMs - elapsed);
	}

	isTimeExpired(): boolean {
		return this.getRemainingTimeMs() <= 0;
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
		this.questionStartedAt = null;
	}

	private finishGame(): void {
		this.state.status = 'game_over';

		this.state.question = null;

		this.state.result = {
			score: this.state.score,
			bestCombo: this.state.bestCombo,
			totalQuestions: this.state.totalQuestions,
			correctAnswers: this.state.correctAnswers,
		};

		this.questionStartedAt = null;
	}

	private generateNextQuestion(): void {
		this.state.question = this.questionGenerator.generate(DIFF_LEVEL);
		this.questionStartedAt = Date.now();
	}

	submitTimeout(): void {
		if (this.state.status !== 'playing') {
			return;
		}

		this.state.totalQuestions += 1;
		this.state.combo = 0;
		this.state.lives -= 1;

		if (this.state.lives <= 0) {
			this.finishGame();
			return;
		}

		this.generateNextQuestion();
	}

	nextQuestion(): void {
		if (this.state.status !== 'playing') {
			return;
		}

		this.generateNextQuestion();
	}
}
