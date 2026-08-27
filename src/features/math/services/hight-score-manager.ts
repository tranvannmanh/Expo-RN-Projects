import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({
	id: 'math-game',
});

const HIGH_SCORE_KEY = 'math_game_high_score';

export class HighScoreManager {
	getHighScore(): number {
		return storage.getNumber(HIGH_SCORE_KEY) ?? 0;
	}

	saveIfHigher(score: number): boolean {
		const currentHighScore = this.getHighScore();

		if (score <= currentHighScore) {
			return false;
		}

		storage.set(HIGH_SCORE_KEY, score);

		return true;
	}

	reset(): void {
		storage.remove(HIGH_SCORE_KEY);
	}
}
