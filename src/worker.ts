import { parentPort, workerData } from 'worker_threads';
import { Board } from './board';

(async () => {
  const { pieceIdx, pieces } = workerData;
  const board = new Board(pieces);
  // Only use the assigned piece as the starting point
  const free = board.pieces.filter((_, i) => i !== pieceIdx);
  const minNextArea = Math.min(...free.map(piece => piece.area));
  const piece = board.pieces[pieceIdx];

  // Helper to send solution and wait for ack
  function sendSolution(solutionStr: string): Promise<void> {
    return new Promise((resolve) => {
      parentPort!.once('message', () => resolve()); // wait for ack
      parentPort!.postMessage(solutionStr);
    });
  }

  for (const variation of piece.variations) {
    const coords = board.spots().slice(0, 3)
      .map(spot => board.shift(variation, spot)).flat()
      .filter(([x, y], i, a) => i === a.findIndex(([x1, y1]) => x1 === x && y1 === y));
    for (const spot of coords) {
      if (board.fits(variation, spot, minNextArea)) {
        board.place(variation, spot);
        // Recursively fill with remaining pieces
        await board.fill(
          free,
          sendSolution
        );
        board.remove(variation, spot);
      }
    }
  }
  console.log(`Worker ${pieceIdx} done`);
  parentPort?.close();
})();
