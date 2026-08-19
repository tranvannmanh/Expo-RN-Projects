export class ScoreManager {
	calculateCorrectScore(combo: number): number {
		const baseScore = 100;

		const multiplier = Math.min(1 + combo * 0.1, 2);

		return Math.round(baseScore * multiplier);
	}
}
