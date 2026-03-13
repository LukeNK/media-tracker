// Convert activity into array
import fs from 'fs';

const data = fs.readFileSync('database.json', 'utf-8');
const database = JSON.parse(data);

for (const item of database) {
    if (item.shelf == 'Done' && !item.activity)
        item.activity = { "2026-01-01": 'Completed' };
    else if (item.shelf == 'Done' && item.activity)
        item.activity = { "2026-01-01": item.activity };
    else
        item.activity = {};
}

fs.writeFileSync('database-1.json', JSON.stringify(database, null, 4));