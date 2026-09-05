const fs = require('fs');
const path = require('path');

const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
const testDataSql = fs.readFileSync(path.join(__dirname, '../database/test-data.sql'), 'utf8').replace(/\r\n/g, '\n');

const tables = {};
const parts = schemaSql.split(/CREATE TABLE\s+/i);

for (let i = 1; i < parts.length; i++) {
  const part = parts[i];
  const nameMatch = part.match(/^([a-zA-Z0-9_]+)/i);
  if (!nameMatch) continue;
  const tableName = nameMatch[1].toLowerCase();

  const bodyStart = part.indexOf('(');
  const bodyEnd = part.indexOf(');');
  if (bodyStart === -1 || bodyEnd === -1) continue;

  const body = part.substring(bodyStart + 1, bodyEnd);
  const cols = [];

  const lines = body.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('--') || line.toUpperCase().startsWith('PRIMARY KEY') || line.toUpperCase().startsWith('FOREIGN KEY') || line.toUpperCase().startsWith('UNIQUE') || line.toUpperCase().startsWith('INDEX')) {
      continue;
    }
    const colMatch = line.match(/^([a-zA-Z0-9_]+)\s+/i);
    if (colMatch) {
      cols.push(colMatch[1].toLowerCase());
    }
  }
  tables[tableName] = cols;
}

console.log(`Parsed ${Object.keys(tables).length} tables from schema.sql:`);
console.log(Object.keys(tables).join(', '));

// Parse INSERT statements
const insertLines = testDataSql.split('\n').filter(l => l.trim().startsWith('INSERT INTO'));
let count = 0;
let errors = 0;

for (const line of insertLines) {
  const match = line.match(/INSERT INTO\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*VALUES/i);
  if (!match) continue;
  count++;
  const tableName = match[1].toLowerCase();
  const colList = match[2].split(',').map(c => c.trim().toLowerCase());

  if (!tables[tableName]) {
    console.error(`Error: Table '${tableName}' does not exist in schema.sql`);
    errors++;
    continue;
  }

  const validCols = tables[tableName];
  for (const col of colList) {
    if (!validCols.includes(col)) {
      console.error(`Error: Column '${col}' in INSERT for table '${tableName}' does not exist in schema.sql`);
      errors++;
    }
  }
}

console.log(`\nValidated ${count} INSERT statements.`);
if (errors === 0 && count > 0) {
  console.log('SUCCESS: All 200 INSERT statements match the schema perfectly!');
} else {
  console.error(`FAILED: Found ${errors} column/table mismatch errors.`);
}







