import * as fs from 'node:fs/promises';
import * as path from 'node:path';

class Orientation {

    colorIndex: number | undefined = undefined;
    coordinates: [number, number][];
    piece: Piece;
    shape: string[];

    constructor(piece: Piece, shape: string[]) {
        // Convert the shape into relative (x, y) coordinates it covers
        this.coordinates = shape.map((row, y) => row.split('').map((v, x) => [v, x] as [string, number]).filter(([v, _]) => v === 'X').map(([_, x]) => [x, y] as [number, number])).flat();
        this.piece = piece;
        this.shape = shape;
    }

}

class Piece {

    // Static
    static nextId = 0;

    static Dedupe(shapes: string[][]): string[][] {
        return shapes.filter((piece, pieceIndex, allPieces) =>
            pieceIndex === allPieces.findIndex((otherPiece) =>
                otherPiece.every((row, rowIndex) => row === piece[rowIndex])
            )
        );
    }

    static Permute(shape: string[]): string[][] {
        const perms: string[][] = [];
        let myPiece = [...shape];
        for (let i = 0; i < 2; i++) {
            perms.push(myPiece);
            for (let j = 0; j < 3; j++) {
                myPiece = this.Rotate(myPiece);
                perms.push(myPiece);
            }
            myPiece = this.Rotate(myPiece).toReversed();
        }
        return perms;
    }

    static Rotate(shape: string[]): string[] {
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

    // Instance
    private _id: number;
    orientations: Orientation[] = [];

    constructor(shape: string[]) {
        this._id = Piece.nextId++;
        this.orientations = Piece.Dedupe(Piece.Permute(shape)).map(orientation => new Orientation(this, orientation));
    }

    get id() {
        return this._id;
    }

}

type SpaceType = 'day' | 'month' | 'date' | 'blocked';
type Days = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
type Months = 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';
type Dates = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31;
type Blocked = '#';

class Space<T extends Days | Months | Dates | Blocked> {

    // The four-color theorem states that any map in a plane can be colored using a max of four colors
    static ColorPalette = [101, 102, 104, 40]; // Red, green, blue, black
    coveredBy: null | Orientation = null;
    type: SpaceType;
    value: T;

    constructor(type: SpaceType, value: T) {
        this.type = type;
        this.value = value;
    }

    cover(orientation: Orientation) {
        this.coveredBy = orientation;
    }

    isEmpty() {
        return this.type !== 'blocked' && !this.coveredBy;
    }

    get label() {
        let label: string;
        if (this.type === 'blocked') label = '  ';
        else if (this.coveredBy) label = `\x1b[${Space.ColorPalette[this.coveredBy.colorIndex ?? 0]}m  \x1b[0m`;
        else label = typeof this.value === 'number' ? this.value.toString().padStart(2, ' ') : this.value.substring(0, 2);
        return label;
    }

    uncover() {
        this.coveredBy = null;
    }

}

class DaySpace extends Space<Days> {
    constructor(value: Days) {
        super('day', value);
    }
}

class MonthSpace extends Space<Months> {
    constructor(value: Months) {
        super('month', value);
    }
}

class DateSpace extends Space<Dates> {
    constructor(value: Dates) {
        super('date', value);
    }
}

class BlockedSpace extends Space<Blocked> {
    constructor() {
        super('blocked', '#');
    }
}

interface Solution {
    day: DaySpace | undefined,
    month: MonthSpace | undefined,
    date: DateSpace | undefined
}

class Board {

    spaces = [
        [new MonthSpace('Jan'), new MonthSpace('Feb'), new MonthSpace('Mar'), new MonthSpace('Apr'), new MonthSpace('May'), new MonthSpace('Jun'), new BlockedSpace()],
        [new MonthSpace('Jul'), new MonthSpace('Aug'), new MonthSpace('Sep'), new MonthSpace('Oct'), new MonthSpace('Nov'), new MonthSpace('Dec'), new BlockedSpace()],
        [new DateSpace(1), new DateSpace(2), new DateSpace(3), new DateSpace(4), new DateSpace(5), new DateSpace(6), new DateSpace(7)],
        [new DateSpace(8), new DateSpace(9), new DateSpace(10), new DateSpace(11), new DateSpace(12), new DateSpace(13), new DateSpace(14)],
        [new DateSpace(15), new DateSpace(16), new DateSpace(17), new DateSpace(18), new DateSpace(19), new DateSpace(20), new DateSpace(21)],
        [new DateSpace(22), new DateSpace(23), new DateSpace(24), new DateSpace(25), new DateSpace(26), new DateSpace(27), new DateSpace(28)],
        [new DateSpace(29), new DateSpace(30), new DateSpace(31), new DaySpace('Sun'), new DaySpace('Mon'), new DaySpace('Tue'), new DaySpace('Wed')],
        [new BlockedSpace(), new BlockedSpace(), new BlockedSpace(), new BlockedSpace(), new DaySpace('Thu'), new DaySpace('Fri'), new DaySpace('Sat')]
    ]

    fits(orientation: Orientation, x: number, y: number) {
        return orientation.coordinates.every(([x1, y1]) => this.spaces[y + y1][x + x1].isEmpty());
    }

    *emptySpaces(skip0_0: boolean): Generator<[number, number], void, unknown> {
        for (const [y, row] of this.spaces.entries()) {
            for (const [x, space] of row.entries()) {
                if ((!skip0_0 || y > 0 || x > 0) && space.isEmpty()) {
                    yield [x, y];
                }
            }
        }
    }

    isValid(solution: Solution) {
        return solution.day !== undefined && solution.month !== undefined && solution.date !== undefined && solution.date.value <= (solution.month?.value === 'Feb' ? 29 : ['Apr', 'Jun', 'Sep', 'Nov'].includes(solution.month?.value.toString()) ? 30 : 31);
    }

    lay(orientation: Orientation, x: number, y: number) {
        orientation.coordinates.forEach(([x1, y1]) => this.spaces[y + y1][x + x1].cover(orientation));
    }

    remove(orientation: Orientation, x: number, y: number) {
        orientation.coordinates.forEach(([x1, y1]) => this.spaces[y + y1][x + x1].uncover());
        orientation.colorIndex = undefined;
    }

    solution() {
        return this.spaces.flat().filter(space => space.isEmpty()).reduce((pv, space) => {
            if (space instanceof DaySpace) {
                pv.day = space;
            } else if (space instanceof MonthSpace) {
                pv.month = space;
            } else if (space instanceof DateSpace) {
                pv.date = space;
            }
            return pv;
        }, { day: undefined, month: undefined, date: undefined } as Solution);
    }

    toString(solution: Solution) {

        // Build a graph of all adjacent pieces
        const graph: Map<Orientation, Set<Orientation>> = new Map();
        for (let [y, row] of this.spaces.entries()) {
            for (let [x, space] of row.entries()) {
                if (space.coveredBy) {
                    let neighbors = graph.get(space.coveredBy);
                    if (neighbors === undefined) {
                        neighbors = new Set();
                        graph.set(space.coveredBy!, neighbors);
                    }
                    for (let [x1, y1] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) {
                        if (x1 >= 0 && y1 >= 0 && y1 < this.spaces.length && x1 < this.spaces[y1].length) {
                            if (this.spaces[y1][x1].coveredBy && this.spaces[y1][x1].coveredBy !== space.coveredBy) {
                                neighbors.add(this.spaces[y1][x1].coveredBy);
                            }
                        }
                    }
                }
            }
        }

        // Greedily assign colors
        for (let [orientation, neighbors] of graph.entries()) {
            let usedColors: Set<number> = new Set();
            for (let neighbor of neighbors) {
                if (neighbor.colorIndex !== undefined) {
                    usedColors.add(neighbor.colorIndex);
                }
            }
            orientation.colorIndex = 0;
            while (usedColors.has(orientation.colorIndex)) {
                orientation.colorIndex++;
            }
        }

        return `${solution.day?.value} ${solution.month?.value} ${solution.date?.value}\n`
            + this.spaces.map(row => row.map(space => space.label).join('')).join('\n')
            + '\n\n';
            
    }

}

async function placeNext(board: Board, pieces: Piece[], skip0_0: boolean, fileHandle: fs.FileHandle, level: number) {

    let checked = 0;
    let placed = false;

    for (const [x, y] of board.emptySpaces(skip0_0)) {

        // Early exit: we don't need to check more than 3 empty spaces since that's the max that can be empty
        if (++checked > 3) {
            if (placed) {
                return;
            } else {
                if (level === 0) {
                    console.log(board.toString({ day: undefined, month: undefined, date: undefined }), pieces.length, skip0_0, level);
                }
                throw new Error('Invalid');
            }
        }

        for (const [i, piece] of pieces.entries()) {
            for (const orientation of piece.orientations) {
                if (board.fits(orientation, x, y)) {
                    board.lay(orientation, x, y);
                    if (pieces.length === 1) {
                        const solution = board.solution();
                        if (board.isValid(solution)) {
                            const str = board.toString(solution);
                            console.log(str);
                            await fileHandle.write(str);
                        }
                    } else {
                        try {
                            await placeNext(board, pieces.filter((piece, j) => j !== i), skip0_0, fileHandle, level + 1);
                        } catch { }
                    }
                    placed = true;
                    board.remove(orientation, x, y);
                }
            }
        }

    }

}

async function main() {

    const pieces = [
        ['XXX', 'XX '],
        ['XXX', 'X X'],
        ['XXXX', 'X   '],
        ['XXXX'],
        ['XXX', 'X  ', 'X  '],
        ['XXX ', '  XX'],
        ['XX ', ' XX'],
        ['XXX', 'X  '],
        ['XXX', ' X ', ' X '],
        ['XX ', ' X ', ' XX']
    ].map(shape => new Piece(shape));

    const board = new Board();
    const filePath = path.join(__dirname, '..', 'solutions.txt');
    const fileHandle = await fs.open(filePath, 'w');
    await placeNext(board, pieces, true, fileHandle, 0); // Shift starting piece to the right of (0, 0)
    await placeNext(board, pieces, false, fileHandle, 0);
    await fileHandle.close();

}

main();

export {
    Board,
    Orientation,
    Piece,
    Space
}