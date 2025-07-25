import { Level } from 'level';
import { dateInPST } from './print-today';

async function main(date: string = dateInPST()) {

    const dates: string[] = [];
    for (let d = new Date(`Fri Jul 25, 2025`); d <= new Date(`Thu Dec 25, 2025`); d.setDate(d.getDate() + 1)) {
        dates.push(dateInPST(d));
    }

    const db = new Level<string, string>('./solutions-db', { valueEncoding: 'utf8' });
    await db.open();

    let todayCount = 0;
    let bigShowCount = 0;

    for await (const [solution, _] of db.iterator()) {
        if (dates.includes(solution.substring(0, 10))) { // === date) {
            if (solution.substring(0, 10) === 'Fri Jul 25') {
                todayCount++;
            }
            bigShowCount++;
        }
    }

    await db.close();

    console.log(`Today: ${todayCount}\nBig Show: ${bigShowCount}`);

}

if (require.main === module) {
    main();
}

export {
    main,
}