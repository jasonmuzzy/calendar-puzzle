import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';

import { shapeToPiece } from './piece';

export async function main() {

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

    const pieces = [
        { id: 0, shape: ["XXX", "XX "] },
        { id: 1, shape: ["XXX", "X X"] },
        { id: 2, shape: ["XXXX", "X   "] },
        { id: 3, shape: ["XXXX"] },
        { id: 4, shape: ["XXX", "X  ", "X  "] },
        { id: 5, shape: ["XXX ", "  XX"] },
        { id: 6, shape: ["XX ", " XX"] },
        { id: 7, shape: ["XXX", "X  "] },
        { id: 8, shape: ["XXX", " X ", " X "] },
        { id: 9, shape: ["XX ", " X ", " XX"] },
    ].map(({ id, shape }) => shapeToPiece(shape, id, board)).sort((a, b) => a.placements.length - b.placements.length);

    const maxWorkers = Math.max(1, os.cpus().length - 2);
    let activeWorkers = 0;
    let placementIndex = 0;

    function startWorker(placementId: number) {

        activeWorkers++;

        console.log(`Placement ${placementId} starting...`);
        const worker = new Worker(require.resolve('./worker'), {
            workerData: { placementId, board, base, pieces },
        });

        worker.on('message', async (solution: string) => {
            const empties = [...solution.matchAll(/\./g)].map(({ index }) => index!);
            const weekday = base[empties[2]];
            const month = base[empties[0]];
            const day = base[empties[1]];
            await fs.writeFile(path.join(__dirname, '..', 'solutions', weekday, month, `${weekday}_${month}_${day}.txt`), solution + '\n', { flag: 'a' });
            worker.postMessage('ack');
        });

        worker.on('exit', async () => {
            activeWorkers--;
            if (placementIndex < pieces[0].placements.length) {
                startWorker(placementIndex++);
            } else if (activeWorkers === 0) {
                console.timeEnd('main'); // main: 2:19:59.186 (h:mm:ss.mmm)
            }
        });
    }

    // Create directories and initialize files
    for (const weekday of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
        for (const month of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
            await fs.mkdir(path.join(__dirname, '..', 'solutions', weekday, month), { recursive: true });
            for (const day of [...Array(month === 'Feb' ? 29 : ['Apr', 'Jun', 'Sep', 'Nov'].includes(month) ? 30 : 31).keys()].map(day => (day + 1).toString())) {
                await fs.writeFile(path.join(__dirname, '..', 'solutions', weekday, month, `${weekday}_${month}_${day}.txt`), '');
            }
        }
    }
    
    while (placementIndex < pieces[0].placements.length && activeWorkers < maxWorkers) {
        startWorker(placementIndex++);
    }

}

if (require.main === module) {
    console.time('main');
    main();
}