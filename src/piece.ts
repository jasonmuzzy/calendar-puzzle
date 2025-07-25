class Variation {

    coordinates: [number, number][];
    piece: Piece;
    shape: string[];

    constructor(piece: Piece, shape: string[]) {
        // Convert the shape into relative (x, y) coordinates it covers
        this.coordinates = shape
            .map((row, y) => row.split('')
                .map((v, x) => [v, x] as [string, number])
                .filter(([v, _]) => v === 'X')
                .map(([_, x]) => [x, y] as [number, number]))
            .flat();
        this.piece = piece;
        this.shape = shape;
    }

}

class Piece {

    area: number;
    id: number;
    static nextId = 0;
    variations: Variation[] = [];

    constructor(shape: string[]) {
        this.area = shape.reduce((area, row) => area + row.split('').filter(v => v === 'X').length, 0);
        this.id = Piece.nextId++;
        this.variations = Piece.Dedupe(Piece.Permute(shape)).map(shape => new Variation(this, shape));
    }

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

}

export {
    Piece,
    Variation,
}