import { GameEngine } from '../models/GameEngine';

// Test lose a life when timeout occurs
it('should lose a life when timeout occurs', () => {
	const game = new GameEngine();

	game.start();

	game.submitTimeout();

	const state = game.getState();

	expect(state.lives).toBe(2);
	expect(state.combo).toBe(0);
});

// Test game over when lives reach 0
it('should end the game after timeout three times', () => {
	const game = new GameEngine();

	game.start();

	game.submitTimeout();
	game.submitTimeout();
	game.submitTimeout();

	const state = game.getState();

	expect(state.status).toBe('game_over');
	expect(state.lives).toBe(0);
});

// Test ignore timeout after game over
it('should ignore timeout after game over', () => {
	const game = new GameEngine();

	game.start();

	game.submitTimeout();
	game.submitTimeout();
	game.submitTimeout();

	const stateBefore = game.getState();

	game.submitTimeout();

	const stateAfter = game.getState();

	expect(stateAfter).toEqual(stateBefore);
});
