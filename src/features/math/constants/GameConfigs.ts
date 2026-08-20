export const GAME_CONFIG = {
	// 3 lives for each game
	initialLives: 3,

	// 10s for each question
	questionTimeLimitMs: 10_000,

	// 100 points for each base correct answer
	baseScore: 100,

	// game levels
	difficulty: {
		initial: 1,
	},

	question: {
		// 4 options for each question
		optionsCount: 4,
	},
} as const;
