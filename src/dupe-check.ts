import * as fs from 'node:fs/promises';
import * as path from 'node:path';

async function main() {
    const filePath = path.join(__dirname, '..', 'solutions.txt');
    const file = await fs.readFile(filePath, { encoding: 'utf-8' });
    const solutions: Set<string> = new Set();
    for (let line of file.split('\n')) {
        if (solutions.has(line.substring(11))) {
            console.log(`Duplicate ${line.substring(11)}`);
        } else {
            solutions.add(line.substring(11));
        }
    }
}

main();