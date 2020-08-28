'use strict';

const { HUB3Error, parse } = require('..');
const path = require('path');
const { readFileSync } = require('fs');

const hub3 = readFileSync(path.join(__dirname, '../reports/1110779471-20200826.mn'));
try {
  const records = parse(hub3);
  console.log({ records });
} catch (err) {
  if (!HUB3Error.isHUB3Error(err)) throw err;
  console.error('Failed to parse report:', err.message);
  process.exit(1);
}
