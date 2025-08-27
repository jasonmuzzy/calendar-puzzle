import fs from 'node:fs/promises';
import path from 'node:path';
import { dateInPST } from './print-today';

export async function main() {

    let todayCount = 0;
    let bigShowCount = 0;

    for (let d = new Date(`Fri Jul 25, 2025`); d <= new Date(`Thu Dec 25, 2025`); d.setDate(d.getDate() + 1)) {
        const [month, day, weekday] = dateInPST(d);
        const filename = `${weekday}_${month}_${day}.txt`;
        const solutions = (await fs.readFile(path.join(__dirname, '..', 'solutions', weekday, month, filename), { encoding: 'utf8' })).split('\n').filter(row => row !== '');
        if (filename === 'Fri_Jul_25.txt') {
            todayCount = solutions.length;
        }
        bigShowCount += solutions.length;
    }

    console.log(`Today: ${todayCount}\nBig Show: ${bigShowCount}`);

}

if (require.main === module) {
    main();
}
