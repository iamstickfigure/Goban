import { Board } from './game';

test('stoneRadius', () => {
    const board = new Board(null, 38, 38);

    expect(board.stoneRadius).toBe(1);
});