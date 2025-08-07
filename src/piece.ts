export const EMPTY = '.';
export const FILLED = 'X';

export type Coordinate = [number, number];

export interface Piece {
    area: number;
    id: number;
    shape: string[];
    placements: Coordinate[][];
}

export function rotate(shape: string[]) {
    const rotated: string[] = [];
    for (let x = 0; x < shape[0].length; x++) {
        let row = '';
        for (let y = shape.length - 1; y >= 0; y--) {
            row += shape[y][x];
        }
        rotated.push(row);
    }
    return rotated;
}

export function shapeToCoordinates(shape: string[]) {
    const coordinates: Coordinate[] = [];
    for (const [y, row] of shape.entries()) {
        for (const [x, space] of row.split('').entries()) {
            if (space === FILLED) {
                coordinates.push([x, y]);
            }
        }
    }
    return coordinates;
}

export function shapeToPiece(shape: string[], id: number, board: string[][]) {
    const placements: Coordinate[][] = [];
    const piece: Piece = { area: shape.join('').split('').filter(space => space === FILLED).length, id, shape, placements };
    const variations: Set<string> = new Set();
    const addPlacements = (shape: string[]) => {
        const variation = shape.join('\n');
        if (!variations.has(variation)) {
            variations.add(variation);
            placements.push(...shapeToPlacements(shape, board));
        }
    };
    let current = [...shape];
    for (let flip = 0; flip < 2; flip++) {
        for (let rot = 0; rot < 4; rot++) {
            addPlacements(current);
            current = rotate(current);
        }
        current = current.toReversed();
    }
    return piece;
}

export function shapeToPlacements(shape: string[], board: string[][]) {
    const placements: Coordinate[][] = [];
    const coordinates = shapeToCoordinates(shape);
    const pieceWidth = Math.max(...coordinates.map(([x, _]) => x)) + 1;
    const pieceHeight = Math.max(...coordinates.map(([_, y]) => y)) + 1;
    const boardWidth = Math.max(...board.map(row => row.length));
    for (let y = 0; y <= board.length - pieceHeight; y++) {
        for (let x = 0; x <= boardWidth - pieceWidth; x++) {
            const placement = coordinates.map(([x1, y1]) => [x + x1, y + y1] as [number, number]);
            if (placement.every(([x1, y1]) => x1 < board[y1].length && board[y1][x1] === EMPTY)) {
                placements.push(placement);
            }
        }
    }
    return placements;
}
