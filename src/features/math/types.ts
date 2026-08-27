export type Operation = '+' | '-' | '×' | '÷';

export type Question = {
	expression: string;
	answer: number;
	options: number[];
	difficulty: number;
};

export type GameStatus = 'idle' | 'playing' | 'game_over';

export type GameState = {
	status: GameStatus;

	score: number;

	combo: number;

	bestCombo: number;

	lives: number;

	totalQuestions: number;

	correctAnswers: number;

	question: Question | null;

	result: GameResult | null;
};

export type GameResult = {
	score: number;
	bestCombo: number;
	totalQuestions: number;
	correctAnswers: number;
};

export type AnswerResult = {
	correct: boolean;
	earnedScore: number;
};
