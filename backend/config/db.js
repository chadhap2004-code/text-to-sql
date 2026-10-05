const Database = require('better-sqlite3');
const path = require('path');

const financeDb = new Database(
    path.join(__dirname, '../../finance.db'),
    {
        readonly: true,
        fileMustExist: true
    }
);

const appDb = new Database(
    path.join(__dirname, '../app.db')
);

module.exports = { financeDb, appDb };
