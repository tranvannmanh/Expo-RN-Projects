import { generateBoard } from '../generateBoard';

describe('generateBoard', () => {
  it('should generate a 5x5 board', () => {
    const board = generateBoard(5);

    expect(board).toHaveLength(25);
  });

  it('should contain every number exactly once', () => {
    const board = generateBoard(5);

    expect([...board].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 1),
    );
  });

  it('should support different board sizes', () => {
    expect(generateBoard(3)).toHaveLength(9);
    expect(generateBoard(4)).toHaveLength(16);
    expect(generateBoard(6)).toHaveLength(36);
  });
});
