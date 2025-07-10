
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

async function readFileLineByLine(filePath: string, target: string) {

    // Read file line-by-line to avoid reading the whole thing into memory
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity // Recognize all instances of CR LF ('\r\n') as a single line break
    });

    console.log(target);
    let print = false;
    for await (const line of rl) {
        if (print) console.log(line);
        if (line === target) print = true;
        else if (line === '') print = false;
    }
}

async function main(date: string) {
    const filePath = path.join(__dirname, '..', 'solutions.txt');
    readFileLineByLine(filePath, date)
        .catch(err => console.error(err));
}

const date = (new Date()).toString().split(' ').slice(0, 3).join(' '); // Date in ddd mm d format e.g. Thu Jul 10
main(date);