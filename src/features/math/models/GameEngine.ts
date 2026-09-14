import { GAME_CONFIG } from '../constants/GameConfigs';
import { AnswerResult, GameState } from '../types';
import { AnswerValidator } from './AnswerValidator';
import { QuestionGenerator } from './QuestionGenerator';
import { ScoreManager } from './ScoreManager';

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
      difficulty: GAME_CONFIG.difficulty.initial,
    };
  }

  start(): void {
    this.state = {
      status: 'playing',
      score: 0,
      combo: 0,
      lives: GAME_CONFIG.initialLives,
      question: this.questionGenerator.generate(GAME_CONFIG.difficulty.initial),
      bestCombo: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      result: null,
      difficulty: GAME_CONFIG.difficulty.initial,
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
      earnedScore = this.scoreManager.calculateCorrectScore(
        this.state.combo,
        this.state.difficulty,
      );
      // Tăng điểm và combo
      this.state.score += earnedScore;
      this.state.combo += 1;
      this.state.correctAnswers += 1;
      // Tính best combo
      this.state.bestCombo = Math.max(this.state.bestCombo, this.state.combo);
    } else {
      this.state.lives -= 1;
      this.state.combo = 0;
    }

    this.updateResult();

    if (this.state.lives <= 0) {
      this.finishGame();
    } else {
      this.generateNextQuestion();
    }

    return {
      correct,
      earnedScore,
    };
  }

  submitTimeout(): void {
    if (this.state.status !== 'playing') {
      return;
    }

    this.state.totalQuestions += 1;
    this.state.combo = 0;
    this.state.lives -= 1;

    this.updateResult();

    if (this.state.lives <= 0) {
      this.finishGame();
      return;
    }

    this.generateNextQuestion();
  }

  private updateResult(): void {
    this.state.result = {
      score: this.state.score,
      bestCombo: this.state.bestCombo,
      totalQuestions: this.state.totalQuestions,
      correctAnswers: this.state.correctAnswers,
    };
  }

  private generateNextQuestion(): void {
    const difficulty = this.getCurrentDifficulty();

    this.state.difficulty = difficulty;
    this.state.question = this.questionGenerator.generate(difficulty);

    this.questionStartedAt = Date.now();
  }

  private getCurrentDifficulty(): number {
    const difficulty =
      Math.floor(
        this.state.totalQuestions / GAME_CONFIG.difficulty.questionsPerLevel,
      ) + GAME_CONFIG.difficulty.initial;

    return Math.min(difficulty, GAME_CONFIG.difficulty.max);
  }

  private getTimeLimitMs(): number {
    const difficulty = Math.min(
      this.state.difficulty,
      GAME_CONFIG.difficulty.max,
    );

    return GAME_CONFIG.difficulty.timeLimitMs[
      difficulty as keyof typeof GAME_CONFIG.difficulty.timeLimitMs
    ];
  }

  private finishGame(): void {
    this.state.status = 'game_over';
    this.state.question = null;

    this.updateResult();

    this.questionStartedAt = null;
  }

  nextQuestion(): void {
    if (this.state.status !== 'playing') {
      return;
    }

    this.generateNextQuestion();
  }

  getRemainingTimeMs(): number {
    if (this.questionStartedAt === null) {
      return 0;
    }

    const elapsed = Date.now() - this.questionStartedAt;
    const timeLimitMs = this.getTimeLimitMs();

    return Math.max(0, timeLimitMs - elapsed);
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
      difficulty: GAME_CONFIG.difficulty.initial,
    };

    this.questionStartedAt = null;
  }
}
