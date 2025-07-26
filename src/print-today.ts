import { Level } from 'level';

class Piece {

    colorIndex: number | undefined = undefined;
    neighbors: Set<Piece> = new Set();
    value: string;

    constructor(value: string) {
        this.value = value;
    }

}

function colorCoded(value: string) {

    // The four-color theorem states that any map in a plane can be colored using a max of four colors
    const ColorPalette = [101, 102, 104, 100, 103]; // Red, green, blue, gray (103, yellow, is ugly)

    const d = value.substring(0, 2);
    const m = { 'Mar': 'Mr', 'May': 'My', 'Jun': 'Je', 'Jul': 'Jl' }[value.substring(4, 7)] ?? value.substring(4, 6); // Short month names
    const D = value.substring(8, 10);

    const pieces: { [key: string]: Piece } = {};

    const grid: string[][] = [];
    for (let i = 11; i < 67; i += 7) {
        grid.push(value.slice(i, i + 7).split(''));
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

    return grid.map(row => row.map(space => ({ 'd': d, 'm': m, 'D': D, ' ': '  ', 'X': '  ' }[space] ?? `\x1b[${ColorPalette[pieces[space]?.colorIndex ?? 0]}m  \x1b[0m`)).join('')).join('\n');

}

async function main(date: string = dateInPST()) {

    console.log(date);

    const db = new Level<string, string>('./solutions-db', { valueEncoding: 'utf8' });
    await db.open();

    let count = 0;
    for await (const [solution, _] of db.iterator()) {
        if (solution.substring(0, 10) === date) {
            if (count < 5) {
                console.log('\n' + colorCoded(solution));
            }
            count++;
        }
    }

    if (count > 5) {
        console.log(`\n...and ${count - 5} more!`)
    }

    await db.close();

}

function dateInPST(date: Date = new Date()) {
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
            day = part.value.padStart(2, ' ');
        }
    }

    return `${weekday} ${month} ${day}`;
}

if (require.main === module) {
    main();
}

export {
    colorCoded,
    dateInPST,
    main,
    Piece
}
