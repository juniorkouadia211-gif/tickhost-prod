import Database from 'better-sqlite3';
console.log('BETTER-SQLITE3 IMPORTED');
const db = new Database(':memory:');
console.log('DB INITIALIZED');
process.exit(0);
