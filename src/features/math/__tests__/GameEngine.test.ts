import { describe, expect, it } from '@jest/globals';
import { GameEngine } from '../models/GameEngine';

describe('GameEngine', () => {
	it('should start the game correctly', () => {
		const game = new GameEngine();

		game.start();

		const state = game.getState();

		expect(state.status).toBe('playing');
		expect(state.score).toBe(0);
		expect(state.combo).toBe(0);
		expect(state.lives).toBe(3);
		expect(state.question).not.toBeNull();
	});

	it('should increase score when answer is correct', () => {
		const game = new GameEngine();

		game.start();

		const question = game.getState().question!;

		const result = game.submitAnswer(question.answer);

		expect(result).toBe(true);

		const state = game.getState();

		expect(state.score).toBe(100);
		expect(state.combo).toBe(1);
		expect(state.lives).toBe(3);
	});

	it('should decrease life when answer is wrong', () => {
		const game = new GameEngine();

		game.start();

		const question = game.getState().question!;

		const wrongAnswer = question.options.find(
			(option) => option !== question.answer,
		)!;

		const result = game.submitAnswer(wrongAnswer);

		expect(result).toBe(false);

		const state = game.getState();

		expect(state.score).toBe(0);
		expect(state.combo).toBe(0);
		expect(state.lives).toBe(2);
	});
});
