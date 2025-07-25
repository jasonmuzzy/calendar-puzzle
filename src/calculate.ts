import { Worker } from 'worker_threads';
import os from 'os';
import { Level } from 'level';

const pieces: string[][] = [
  ["XXX", "XX "],
  ["XXX", "X X"],
  ["XXXX", "X   "],
  ["XXXX"],
  ["XXX", "X  ", "X  "],
  ["XXX ", "  XX"],
  ["XX ", " XX"],
  ["XXX", "X  "],
  ["XXX", " X ", " X "],
  ["XX ", " X ", " XX"],
];

const maxWorkers = os.cpus().length;
let activeWorkers = 0;
let pieceIndex = 0;

async function main() {
  const db = new Level('./solutions-db', { valueEncoding: 'utf8' });
  await db.open();

  function startWorker(pieceIdx: number) {
    activeWorkers++;
    const worker = new Worker(require.resolve('./worker'), {
      workerData: { pieceIdx, pieces },
    });
    worker.on('message', async (solution: string) => {
      await db.put(solution, '1').catch(() => { });
      worker.postMessage('ack'); // Send ack after DB update
    });
    worker.on('exit', async () => {
      activeWorkers--;
      if (pieceIndex < pieces.length) {
        startWorker(pieceIndex++);
      } else if (activeWorkers === 0) {
        await db.close();
        console.log(`Done. Solutions written to solutions-db`);
      }
    });
  }

  // Start up to maxWorkers
  while (pieceIndex < pieces.length && activeWorkers < maxWorkers) {
    startWorker(pieceIndex++);
  }
}

if (require.main === module) {
  main().catch(console.error);
}