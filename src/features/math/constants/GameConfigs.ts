export const GAME_CONFIG = {
	// 3 lives for each game
	initialLives: 3,

	// 10s for each question
	questionTimeLimitMs: 10_000,

	// 100 points for each base correct answer
	score: {
		base: 100,

		difficultyMultiplier: {
			1: 1,
			2: 1.5,
			3: 2,
			4: 3,
		},
	},

	// game levels
	difficulty: {
		initial: 1,
		max: 4,
		questionsPerLevel: 10,
	},

	question: {
		// 4 options for each question
		optionsCount: 4,
	},
} as const;
