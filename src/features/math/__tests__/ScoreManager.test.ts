import { describe, expect, it } from '@jest/globals';
import { ScoreManager } from '../models/ScoreManager';

describe('ScoreManager - Difficulty Balancing', () => {
	const scoreManager = new ScoreManager();

	it('should give 100 points at difficulty 1 with no combo', () => {
		expect(scoreManager.calculateCorrectScore(0, 1)).toBe(100);
	});

	it('should give 150 points at difficulty 2 with no combo', () => {
		expect(scoreManager.calculateCorrectScore(0, 2)).toBe(150);
	});

	it('should give 200 points at difficulty 3 with no combo', () => {
		expect(scoreManager.calculateCorrectScore(0, 3)).toBe(200);
	});

	it('should give 300 points at difficulty 4 with no combo', () => {
		expect(scoreManager.calculateCorrectScore(0, 4)).toBe(300);
	});

	it('should add combo bonus to difficulty score', () => {
		expect(scoreManager.calculateCorrectScore(5, 2)).toBe(200);
	});

	it('should give higher score for higher difficulty', () => {
		const level1 = scoreManager.calculateCorrectScore(0, 1);
		const level2 = scoreManager.calculateCorrectScore(0, 2);
		const level3 = scoreManager.calculateCorrectScore(0, 3);
		const level4 = scoreManager.calculateCorrectScore(0, 4);

		expect(level1).toBeLessThan(level2);
		expect(level2).toBeLessThan(level3);
		expect(level3).toBeLessThan(level4);
	});
});
