/*
Ideas for optimization:
1. Use memoization keyed by covered spaces + used pieces so when multiple pieces can cover the same area in multiple ways we don't have to compute all the combos of the remaining pieces after the first time
*/

import { Piece, Variation } from './piece';

const BLOCKED = 'X';
const DATES = [...Array(31).keys().map(i => (i + 1).toString())];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EMPTY = ' ';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Solution {
    day: string,
    month: string,
    date: string,
    str: string,
}

export class Board {

    base = [
        'Jan Feb Mar Apr May Jun X',
        'Jul Aug Sep Oct Nov Dec X',
        '1   2   3   4   5   6   7',
        '8   9   10  11  12  13  14',
        '15  16  17  18  19  20  21',
        '22  23  24  25  26  27  28',
        '29  30  31  Sun Mon Tue Wed',
        'X   X   X   X   Thu Fri Sat',
    ].map(row => row.split(/\s+/g));

    pieces: Piece[];
    spaces: string[][] = this.base.map(row => row.map(space => space === 'X' ? BLOCKED : EMPTY));

    constructor(pieces: string[][]) {
        this.pieces = pieces.map(shape => new Piece(shape));
    }

    async fill(
        free: Piece[],
        onSolution: (solutionStr: string) => void
    ) {
        for (const [i, piece] of free.entries()) {
            for (const variation of piece.variations) {

                const coords = this.spots().slice(0, 3) // Get empty spots next to pieces
                    .map(spot => this.shift(variation, spot)).flat() // Get potential shifted spots up/left
                    .filter(([x, y], i, a) => i === a.findIndex(([x1, y1]) => x1 === x && y1 === y)); // Dedupe

                for (const spot of coords) {
                    const nextFree = free.filter((_, j) => j !== i);
                    const minNextArea = Math.min(...nextFree.map(piece => piece.area));
                    if (this.fits(variation, spot, minNextArea)) {
                        this.place(variation, spot);

                        if (free.length === 1) {
                            const solution = this.solution();
                            const solutionStr = `${solution.day} ${solution.month} ${solution.date.padStart(2, ' ')} ${solution.str}`;
                            await onSolution(solutionStr);
                        } else {
                            await this.fill(nextFree, onSolution);
                        }

                        this.remove(variation, spot);
                    }
                }
            }
        }
    }

    fits(variation: Variation, [x, y]: [number, number], minNextArea: number) {
        if (variation.coordinates.every(([x1, y1]) => y + y1 < this.spaces.length && x + x1 < this.spaces[y + y1].length && this.spaces[y + y1][x + x1] === EMPTY)) {
            // Temporarily place the piece
            const tempSpaces = this.spaces.map(row => [...row]);
            variation.coordinates.forEach(([x1, y1]) => tempSpaces[y + y1][x + x1] = variation.piece.id.toString());

            // Use BFS to find islands of adjacent empty spaces
            let date: string | undefined, day: string | undefined, month: string | undefined;
            const coveredDays: Set<string> = new Set();
            const coveredMonths: Set<string> = new Set();
            const coveredDates: Set<string> = new Set();
            const visiteds: Set<string> = new Set();
            const pools: Map<string, Set<string>> = new Map();
            let twoCount = 0;
            for (let [y, row] of tempSpaces.entries()) {
                for (let [x, space] of row.entries()) {
                    if (space !== EMPTY && space !== BLOCKED) {
                        if (DAYS.includes(this.base[y][x])) coveredDays.add(this.base[y][x]);
                        else if (MONTHS.includes(this.base[y][x])) coveredMonths.add(this.base[y][x]);
                        else coveredDates.add(this.base[y][x]);

                        if (coveredDays.size === 7 || coveredMonths.size === 12 || coveredDates.size === 31) {
                            return false; // All days, months or dates covered
                        }
                    }
                    const key = `${x},${y}`;
                    if (space === EMPTY && !visiteds.has(key)) {
                        visiteds.add(key);
                        const pool: Set<string> = new Set([key]);
                        const showing = [this.base[y][x]];
                        pools.set(key, pool);

                        const q = [[x, y]] as [number, number][];
                        while (q.length > 0) {
                            const [x1, y1] = q.pop()!;
                            for (let [x2, y2] of [[x1, y1 - 1], [x1 + 1, y1], [x1, y1 + 1], [x1 - 1, y1]]) {
                                const nKey = `${x2},${y2}`;
                                if (y2 >= 0 && y2 < tempSpaces.length &&
                                    x2 >= 0 && x2 < tempSpaces[y2].length &&
                                    tempSpaces[y2][x2] === EMPTY &&
                                    !visiteds.has(nKey)
                                ) {
                                    pool.add(nKey);
                                    showing.push(this.base[y2][x2]);
                                    visiteds.add(nKey);
                                    q.push([x2, y2]);
                                }
                            }
                        }

                        if (pool.size === 1) {
                            if (DAYS.includes(this.base[y][x])) {
                                if (day === undefined) {
                                    day = this.base[y][x];
                                } else {
                                    return false; // Can't have 2 days uncovered
                                }
                            } else if (MONTHS.includes(this.base[y][x])) {
                                if (month === undefined) {
                                    month = this.base[y][x];
                                } else {
                                    return false; // Can't have 2 months uncovered
                                }
                            } else {
                                if (date === undefined) {
                                    date = this.base[y][x];
                                } else {
                                    return false; // Can't have 2 dates uncovered
                                }
                            }

                        } else if (pool.size === 2) {
                            twoCount++;
                            if (twoCount === 1) {
                                if (showing.every(space => DAYS.includes(space)) || // Invalid to have 2 days, months or dates together
                                    showing.every(space => MONTHS.includes(space)) ||
                                    showing.every(space => DATES.includes(space))) {
                                    return false;
                                }
                            } else { // Invalid to have more than one pool with area of 2
                                return false;
                            }

                        } else if (pool.size < minNextArea) { // All remaining pieces are larger than this pool
                            return false;
                        }

                        if (month && date) {
                            const d = parseInt(date);
                            if ((month === 'Feb' && d > 29) || (['Apr', 'Jun', 'Sep', 'Nov'].includes(month) && d > 30)) {
                                return false; // Too many days for month
                            }
                        }

                    }
                }
            }
            return true;
        }
        return false;
    }

    place(variation: Variation, [x, y]: [number, number]) {
        variation.coordinates.forEach(([x1, y1]) => this.spaces[y + y1][x + x1] = variation.piece.id.toString());
    }

    print(solution: Solution) {
        console.log(`${solution.day} ${solution.month} ${solution.date}\n` + this.spaces.map((row, y) => row.map((space, x) => space === EMPTY ? ({ 'Mar': 'Mr', 'May': 'My', 'Jun': 'Je', 'Jul': 'Jl' }[this.base[y][x]] ?? this.base[y][x]).padStart(0, ' ').substring(0, 2) : space.padStart(2, ' ')).join('')).join('\n') + '\n')
    }

    remove(variation: Variation, [x, y]: [number, number]) {
        variation.coordinates.forEach(([x1, y1]) => this.spaces[y + y1][x + x1] = EMPTY);
    }

    // Each piece has empty spaces, so try shifting up and left
    shift(variation: Variation, [x, y]: [number, number]) {
        const results: [number, number][] = [];
        for (let y1 = 0; y1 < Math.max(...variation.coordinates.map(([_, y]) => y)); y1++) {
            for (let x1 = 0; x1 < Math.max(...variation.coordinates.map(([x, _]) => x)); x1++) {
                if (y - y1 >= 0 && y - y1 < this.spaces.length && x - x1 >= 0 && x - x1 < this.spaces[y1].length) {
                    results.push([x - x1, y - y1]);
                }
            }
        }

        // If there were no valid shifted locations then use the given [x, y]
        if (results.length === 0) {
            results.push([x, y]);
        }

        // If the piece covers Jan then also try shifting right
        if (x === 0 && y === 0 && !variation.coordinates.some(([x1, y1]) => x1 === 0 && y1 === 0)) {
            results.push([x + 1, y]);
        }

        return results;
    }

    solution(): Solution {
        let day = '', month = '', date = '';
        let str = this.spaces.map((row, y) => row.map((space, x) => {
            if (space === BLOCKED) return BLOCKED;
            else if (space === EMPTY) {
                if (DAYS.includes(this.base[y][x])) {
                    day = this.base[y][x];
                    return 'd';
                } else if (MONTHS.includes(this.base[y][x])) {
                    month = this.base[y][x];
                    return 'm';
                } else {
                    date = this.base[y][x];
                    return 'D';
                }
            } else return space;
        }).join('')).join('');
        return { day, month, date, str };
    }

    // [x, y] coordinates of empty spaces with at least one occupied neighbor (or [0, 0] if none)
    spots() {
        let results = this.spaces
            .map((row, y) => row
                .map((space, x) => [space, x] as [string, number])
                .filter(([space, x]) => space === EMPTY
                    && [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]
                        .some(([x1, y1]) => y1 >= 0 && y1 < this.spaces.length
                            && x1 >= 0 && x1 < this.spaces[y1].length
                            && ![EMPTY, BLOCKED].includes(this.spaces[y1][x1])))
                .map(([_, x]) => x))
            .map((row, y) => row
                .map(x => [x, y] as [number, number]))
            .filter(row => row.length > 0)
            .flat();

        if (results.length === 0) {
            results = [[0, 0] as [number, number]];
        }

        return results;
    }

}