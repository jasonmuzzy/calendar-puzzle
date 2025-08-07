import { rotate, shapeToCoordinates, shapeToPiece, shapeToPlacements } from '../src/piece';

describe('rotate', () => {
  it("rotates ['XXX','XX '] to ['XX','XX',' X']", () => {
    const shape = ['XXX', 'XX '];
    const expected = ['XX', 'XX', ' X'];
    const result = rotate(shape);
    expect(result).toEqual(expected); // Order matters, don't use arrayContaining()
  });
});

describe('shapeToCoordinates', () => {
  it("returns correct coordinates for ['XXX','XX '], where 'X' is BLOCKED", () => {
    const shape = ['XXX', 'XX '];
    const expected = [
      [0,0], [1,0], [2,0],
      [0,1], [1,1]
    ];
    const result = shapeToCoordinates(shape);
    expect(result).toEqual(expect.arrayContaining(expected));
    expect(result.length).toBe(5);
  });
});

describe('shapeToPiece', () => {
  it("returns all unique variations for ['XXXX']", () => {
    const shape = ['XXXX'];
    const board = [
      '......#',
      '......#',
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      '####...'
    ].map(row => row.split(''));
    const result = shapeToPiece(shape, 3, board);
    expect(Array.isArray(result.placements)).toBe(true);
    expect(result.placements.length).toBe(55);
    for (const placement of result.placements) {
      for (const [x, y] of placement) {
        expect(board[y][x]).toBe('.');
      }
    }
  });
});

describe('shapeToPlacements', () => {
  it("returns correct placements for shape ['XXX','XX '] and given board", () => {
    const shape = ['XXX', 'XX '];
    const board = [
      '......#',
      '......#',
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      '####...'
    ].map(row => row.split(''));
    const result = shapeToPlacements(shape, board);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(29);
    for (const placement of result) {
      for (const [x, y] of placement) {
        expect(board[y][x]).toBe('.');
      }
    }
  });
});
