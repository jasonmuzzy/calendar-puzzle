import { parentPort, workerData } from 'worker_threads';
import { Coordinate, EMPTY, Piece } from './piece';

export const boardCategories = [
    'm m m m m m #',
    'm m m m m m #',
    'd d d d d d d',
    'd d d d d d d',
    'd d d d d d d',
    'd d d d d d d',
    'd d d w w w w',
    '# # # # w w w',
].map(row => row.split(/\s+/g));

export function validState(board: string[][], base: string[], pieces: Piece[], pieceIndex: number) {

    const visiteds: Set<string> = new Set();
    let twoCount = 0, w = '', m = '', d = '';

    function validSingle(x: number, y: number) {
        const category = boardCategories[y][x];
        const value = base[y * 7 + x];
        if (category === 'w' && w === '') {
            w = value;
        } else if (category === 'm' && m === '') {
            m = value;
        } else if (category === 'd' && d === '') {
            d = value;
        } else {
            return false;
        }
        return true;
    }

    for (const [y, row] of board.entries()) {
        for (const [x, space] of row.entries()) {

            if (space === EMPTY && !visiteds.has(`${x},${y}`)) {

                // Find the "well" of contiguous, uncovered spaces
                const well: Coordinate[] = [];
                const q: Coordinate[] = [[x, y]];
                while (q.length > 0) {

                    const [x1, y1] = q.pop()!;
                    if (!visiteds.has(`${x1},${y1}`)) {

                        well.push([x1, y1]);
                        visiteds.add(`${x1},${y1}`);

                        for (const [x2, y2] of [[x1, y1 - 1], [x1 + 1, y1], [x1, y1 + 1], [x1 - 1, y1]]) {
                            if (y2 >= 0 && y2 < board.length && x2 >= 0 && x2 < board[y2].length && board[y2][x2] === EMPTY) {
                                q.push([x2, y2]);
                            }
                        }

                    }

                }

                if (well.length === 1) {

                    // Single spots must be different categories
                    if (!validSingle(x, y)) {
                        return false;
                    };

                    // Day must be valid in month
                    if (m === 'Feb' && (d === '30' || d === '31')) {
                        return false;
                    } else if (['Apr', 'Jun', 'Sep', 'Nov'].includes(m) && d === '31') {
                        return false;
                    }

                } else if (well.length === 2) {

                    twoCount++;
                    const [[x1, y1], [x2, y2]] = well;

                    // Max 1 double spot
                    if (twoCount > 1) {
                        return false;

                        // Double spot must have 2 different categories
                    } else if (boardCategories[y1][x1] === boardCategories[y2][x2]) {
                        return false;

                        // Double spots must not conflict with other single(s)
                    } else if (!validSingle(x1, y1) || !validSingle(x2, y2)) {
                        return false;
                    }

                } else if (well.length === 3) {

                    // Triple spots are never valid
                    return false;

                } else if (well.length < 6) {

                    // No 4 spots if unused pieces are all 5 area
                    if (well.length === 4 && !pieces.some((piece, i) => i >= pieceIndex && piece.area === 4)) {
                        return false;
                    }

                    // No unused piece that fits in the well
                    if (!pieces.some((piece, i) => i >= pieceIndex && piece.placements.some(placement => placement.every(([px, py]) => well.some(([wx, wy]) => wx === px && wy === py))))) {
                        return false;
                    }

                }
            }
        }
    }
    return true;
}

(async () => {

    if (workerData === null) {
        return;
    }

    const { placementId, board, base, pieces } = workerData as { placementId: number, board: string[][], base: string[], pieces: Piece[] };

    async function placeNext(pieceIndex: number) {
        for (const placement of pieces[pieceIndex].placements) {
            if (placement.every(([x, y]) => board[y][x] === EMPTY)) {
                placement.forEach(([x, y]) => board[y][x] = pieces[pieceIndex].id.toString());
                if (validState(board, base, pieces, pieceIndex + 1)) {
                    if (pieceIndex < 9) {
                        await placeNext(pieceIndex + 1);
                    } else {
                        await sendSolution(board.flat().join(''));
                    }
                }
                placement.forEach(([x, y]) => board[y][x] = EMPTY);
            }
        }
    }

    // Helper function to send solution and wait for ack
    function sendSolution(solutionStr: string): Promise<void> {
        return new Promise((resolve) => {
            parentPort!.once('message', () => resolve()); // wait for ack
            parentPort!.postMessage(solutionStr);
        });
    }

    pieces[0].placements[placementId].forEach(([x, y]) => board[y][x] = pieces[0].id.toString());
    await placeNext(1);
    pieces[0].placements[placementId].forEach(([x, y]) => board[y][x] = EMPTY);

    console.log(`Placement ${placementId} done`);
    parentPort?.close();

})();
