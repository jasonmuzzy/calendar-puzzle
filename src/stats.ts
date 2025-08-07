import fs from 'node:fs/promises';
import path from 'node:path';

type FileStat = { file: string, count: number };

async function getFileRowCounts(dir: string): Promise<FileStat[]> {
    let stats: FileStat[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            stats = stats.concat(await getFileRowCounts(fullPath));
        } else if (entry.isFile()) {
            const content = await fs.readFile(fullPath, 'utf8');
            const count = content.split('\n').filter(line => line.trim() !== '').length;
            stats.push({ file: fullPath, count });
        }
    }
    return stats;
}

function extractDateFromFilename(filename: string): { weekday: string, month: string, day: number } | null {
    // Matches .../Wed_Jul_23.txt or similar
    const match = filename.match(/([A-Za-z]{3})_([A-Za-z]{3})_(\d{1,2})\.txt$/);
    if (!match) return null;
    return {
        weekday: match[1],
        month: match[2],
        day: parseInt(match[3], 10)
    };
}

function nextOccurrence(weekday: string, month: string, day: number): Date | null {
    // Map short month names to numbers
    const monthMap: { [k: string]: number } = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    const weekdayMap: { [k: string]: number } = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
    };
    if (!(month in monthMap) || !(weekday in weekdayMap)) return null;

    const today = new Date();
    let year = today.getFullYear();
    for (let i = 0; i < 10; i++) { // Look up to 10 years ahead
        const candidate = new Date(year, monthMap[month], day);
        if (
            candidate >= today &&
            candidate.getDay() === weekdayMap[weekday] &&
            candidate.getMonth() === monthMap[month] &&
            candidate.getDate() === day
        ) {
            return candidate;
        }
        year++;
    }
    return null;
}

export async function main() {
    const solutionsDir = path.join(__dirname, '..', 'solutions');
    const stats = await getFileRowCounts(solutionsDir);

    if (stats.length === 0) {
        console.log('No files found.');
        return;
    }

    const max = stats.reduce((a, b) => (a.count > b.count ? a : b));
    const min = stats.reduce((a, b) => (a.count < b.count ? a : b));

    function describeFile(stat: FileStat) {
        const dateInfo = extractDateFromFilename(stat.file);
        if (!dateInfo) return `${stat.file} (${stat.count} rows) [date not found]`;
        const next = nextOccurrence(dateInfo.weekday, dateInfo.month, dateInfo.day);
        return `${stat.file} (${stat.count} rows) — next on ${next ? next.toDateString() : 'unknown'}`;
    }

    console.log(`File with most rows: ${describeFile(max)}`);
    console.log(`File with fewest rows: ${describeFile(min)}`);
}

if (require.main === module) {
    main();
}
