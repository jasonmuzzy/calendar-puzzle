import * as fs from 'node:fs/promises';
import * as path from 'node:path';

class Orientation {

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
        if (this.type === 'blocked') label = ' ';
        else if (this.coveredBy) label = this.coveredBy.piece.id.toString();
        else label = this instanceof DaySpace ? 'd' : this instanceof MonthSpace ? 'm' : 'D';
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

interface BoardDate {
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

    date() {
        return this.spaces.flat().filter(space => space.isEmpty()).reduce((pv, space) => {
            if (space instanceof DaySpace) {
                pv.day = space;
            } else if (space instanceof MonthSpace) {
                pv.month = space;
            } else if (space instanceof DateSpace) {
                pv.date = space;
            }
            return pv;
        }, { day: undefined, month: undefined, date: undefined } as BoardDate);
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

    fits(orientation: Orientation, x: number, y: number) {
        return orientation.coordinates.every(([x1, y1]) => this.spaces[y + y1][x + x1].isEmpty());
    }

    isValid(solution: BoardDate) {
        return solution.day !== undefined && solution.month !== undefined && solution.date !== undefined && solution.date.value <= (solution.month?.value === 'Feb' ? 29 : ['Apr', 'Jun', 'Sep', 'Nov'].includes(solution.month?.value.toString()) ? 30 : 31);
    }

    lay(orientation: Orientation, x: number, y: number) {
        orientation.coordinates.forEach(([x1, y1]) => this.spaces[y + y1][x + x1].cover(orientation));
    }

    remove(orientation: Orientation, x: number, y: number) {
        orientation.coordinates.forEach(([x1, y1]) => this.spaces[y + y1][x + x1].uncover());
    }

    toString(solution: BoardDate) {
        return `${solution.day?.value} ${solution.month?.value} ${solution.date?.value.toString().padStart(2, ' ')} `
            + this.spaces.map(row => row.map(space => space.label).join('')).join('');
    }

}

function placeNext(board: Board, pieces: Piece[], solutions: Set<string>, skip0_0: boolean) {

    let checked = 0;
    let placed = false;

    for (const [x, y] of board.emptySpaces(skip0_0)) {

        // Early exit: we don't need to check more than 3 empty spaces since that's the max that can be empty
        if (++checked > 3) {
            if (placed) {
                return;
            } else {
                throw new Error('Invalid');
            }
        }

        for (const [i, piece] of pieces.entries()) {
            for (const orientation of piece.orientations) {
                if (board.fits(orientation, x, y)) {
                    board.lay(orientation, x, y);
                    if (pieces.length === 1) {
                        const date = board.date();
                        if (board.isValid(date)) {
                            const solution = board.toString(date);
                            if (!solutions.has(solution)) {
                                solutions.add(solution);
                                console.log(solution);
                            }
                        }
                    } else {
                        try {
                            placeNext(board, pieces.filter((piece, j) => j !== i), solutions, skip0_0);
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
    const solutions: Set<string> = new Set();
    placeNext(board, pieces, solutions, true); // Shift starting piece to the right of (0, 0)
    placeNext(board, pieces, solutions, false);

    const filePath = path.join(__dirname, '..', 'solutions.txt');
    await fs.writeFile(filePath, [...solutions].sort((a, b) => a < b ? -1 : 1).join('\n'), { encoding: 'utf-8' });

}

// main: 2:47:06.840 (h:mm:ss.mmm)
// 8,153 solutions
console.time('main');
main();
console.timeEnd('main');

export {
    Board,
    Orientation,
    Piece,
    Space
}