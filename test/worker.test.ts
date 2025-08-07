import { validState } from '../src/worker';

describe('validState', () => {

    it('Double conflicts with single', () => {

        const board = [
            '777.00#',
            '.87000#',
            '.800002',
            '8882222',
            '4449111',
            '4999161',
            '4955566',
            '####556',
        ].map(row => row.split(''));

        const base = [
        'Jan Feb Mar Apr May Jun #',
        'Jul Aug Sep Oct Nov Dec #',
        '1   2   3   4   5   6   7',
        '8   9   10  11  12  13  14',
        '15  16  17  18  19  20  21',
        '22  23  24  25  26  27  28',
        '29  30  31  Sun Mon Tue Wed',
        '#   #   #   #   Thu Fri Sat',
    ].join(' ').split(/\s+/g);
    
        const actual = validState(board, base, [], 0);
        expect(actual).toBe(false);
    });
});
