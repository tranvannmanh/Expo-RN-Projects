import { GAME_CONFIG } from '../constants/GameConfigs';

export class ScoreManager {
	calculateCorrectScore(combo: number, difficulty: number): number {
		const multiplier =
			GAME_CONFIG.score.difficultyMultiplier[
				difficulty as keyof typeof GAME_CONFIG.score.difficultyMultiplier
			];

		const baseScore = GAME_CONFIG.score.base * multiplier;

		const comboBonus = combo * 10;

		return baseScore + comboBonus;
	}
}
