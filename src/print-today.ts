import fs from 'node:fs/promises';
import path from 'node:path';
import { EMPTY } from './piece';

export class Piece {

    colorIndex: number | undefined = undefined;
    neighbors: Set<Piece> = new Set();
    value: string;

    constructor(value: string) {
        this.value = value;
    }

}

export function colorCoded(date: string[], solution: string) {

    const pieces: { [key: string]: Piece } = {};

    const grid: string[][] = [];
    for (let i = 0; i < 56; i += 7) {
        grid.push(solution.slice(i, i + 7).split(''));
    }

    // Build a graph of all adjacent pieces
    for (let [y, row] of grid.entries()) {
        for (let [x, value] of row.entries()) {
            if ('0123456789'.includes(grid[y][x])) {

                if (!Object.hasOwn(pieces, value)) {
                    pieces[value] = new Piece(value);
                }
                const piece = pieces[value];

                for (let [x1, y1] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
                    if (x1 >= 0 && y1 >= 0 && y1 < grid.length && x1 < grid[y1].length) {
                        const otherValue = grid[y1][x1];
                        if ('0123456789'.includes(otherValue) && otherValue !== value) {
                            if (!Object.hasOwn(pieces, otherValue)) {
                                pieces[otherValue] = new Piece(otherValue);
                            }
                            const otherPiece = pieces[otherValue];
                            piece.neighbors.add(otherPiece);
                            otherPiece.neighbors.add(piece);
                        }
                    }
                }

            }
        }
    }

    // Assign colors
    for (let piece of Object.values(pieces)) {
        let usedColors: Set<number> = new Set();
        for (let neighbor of piece.neighbors) {
            if (neighbor.colorIndex !== undefined) {
                usedColors.add(neighbor.colorIndex);
            }
        }
        piece.colorIndex = 0;
        while (usedColors.has(piece.colorIndex)) {
            piece.colorIndex++;
        }
    }

    // The four-color theorem states that any map in a plane can be colored using a max of four colors
    const ColorPalette = [101, 102, 104, 103, 100]; // Red, green, blue, yellow, gray
    const bases = date.map(part => (({ 'Mar': 'Mr', 'May': 'My', 'Jun': 'Je', 'Jul': 'Jl' }[part]) ?? part).substring(0, 2).padStart(2, ' '));
    return grid.map(row => row.map(space => (space === EMPTY ? bases.shift() : space === '#' ? '  ' : `\x1b[${ColorPalette[pieces[space]?.colorIndex ?? 0]}m  \x1b[0m`)).join('')).join('\n');

}

export async function main(date = dateInPST()) {

    const [month, day, weekday] = date;
    const filename = `${weekday}_${month}_${day}.txt`;
    const solutions = (await fs.readFile(path.join(__dirname, '..', 'solutions', weekday, month, filename), { encoding: 'utf8' })).split('\n').filter(row => row !== '');

    console.log(weekday, month, day);

    for (const [i, solution] of solutions.entries()) {
        if (i === 5) break;
        console.log('\n' + colorCoded(date, solution));
    }

    if (solutions.length > 5) {
        console.log(`\n...and ${solutions.length - 5} more!`)
    }

}

export function dateInPST(date: Date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    let weekday = '';
    let month = '';
    let day = '';

    for (const part of formatter.formatToParts(date)) {
        if (part.type === 'weekday') {
            weekday = part.value;
        } else if (part.type === 'month') {
            month = part.value;
        } else if (part.type === 'day') {
            day = part.value;
        }
    }

    return [month, day, weekday] as [string, string, string];
}

if (require.main === module) {
    main();
}
