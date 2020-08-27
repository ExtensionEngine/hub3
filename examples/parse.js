'use strict';

const { parse } = require('..');
const path = require('path');
const { readFileSync } = require('fs');

const hub3 = readFileSync(path.join(__dirname, '../reports/1110779471-20200826.mn'));
const records = parse(hub3);
console.log({ records });
