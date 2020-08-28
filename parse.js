'use strict';

const iconv = require('iconv-lite');
const { ParserError } = require('./errors');

const identity = arg => arg;

const str = (len, processor = identity) => key => ({ key, len, processor });
const num = len => str(len, Number);

const amount = num(15);
const curr = str(3);
const date = str(8, parseDate);
const oib = str(11);
const sign = str(1);
const type = num(3);

const format900 = [
  /* 1.  */ str(7)`VBDI`,
  /* 2.  */ str(50)`naziv_banke`,
  /* 3.  */ oib`OIB_banke`,
  /* 4.  */ str(4)`vrsta_izvatka`,
  /* 5.  */ date`datum_obrade`,
  /* 6.  */ str(917)`rezerva`,
  /* 7.  */ type`tip_sloga`
];

const format903 = [
  /* 1.  */ str(7)`vodeci_broj_banke`,
  /* 2.  */ str(11)`BIC`,
  /* 3.  */ str(21)`transakcijski_racun_klijenta`,
  /* 4.  */ curr`valuta_transakcijskog_racuna`,
  /* 5.  */ str(70)`naziv_klijenta`,
  /* 6.  */ str(35)`sjediste_klijenta`,
  /* 7.  */ str(8)`maticni_broj`,
  /* 8.  */ oib`OIB_klijenta`,
  /* 9.  */ num(3)`redni_broj_izvatka`,
  /* 10. */ num(3)`podbroj_izvatka`,
  /* 11. */ date`datum_izvatka`,
  /* 12. */ num(4)`redni_broj_grupe_paketa`,
  /* 13. */ str(4)`vrsta_izvatka`,
  /* 14. */ str(809)`rezerva`,
  /* 15. */ type`tip_sloga`
];

const format905 = [
  /* 1.  */ str(2)`oznaka_transakcije`,
  /* 2.  */ str(34)`racun_primatelja_platitelja`,
  /* 3.  */ str(70)`naziv_primatelja_platitelja`,
  /* 4.  */ str(35)`adresa_primatelja_platitelja`,
  /* 5.  */ str(35)`sjediste_primatelja_platitelja`,
  /* 6.  */ date`datum_valute`,
  /* 7.  */ date`datum_izvrsenja`,
  /* 8.  */ curr`valuta_pokrica`,
  /* 9.  */ amount`tecaj`,
  /* 10. */ sign`predznak1`,
  /* 11. */ amount`iznos_u_valuti_pokrica`,
  /* 12. */ sign`predznak2`,
  /* 13. */ amount`iznos`,
  /* 14. */ str(26)`poziv_na_broj_platitelja`,
  /* 15. */ str(26)`poziv_na_broj_primatelja`,
  /* 16. */ str(4)`sifra_namjene`,
  /* 17. */ str(140)`opis_placanja`,
  /* 18. */ str(42)`identifikator_transakcije1`,
  /* 19. */ str(35)`identifikator_transakcije2`,
  /* 20. */ str(482)`rezerva`,
  /* 21. */ type`tip_sloga`
];

const format907 = [
  /* 1.  */ str(21)`transakcijski_racun_klijenta`,
  /* 2.  */ curr`valuta_transakcijskog_racuna`,
  /* 3.  */ str(70)`naziv_klijenta`,
  /* 4.  */ num(3)`redni_broj_izvatka`,
  /* 5.  */ num(3)`redni_broj_prethodnog_izvatka`,
  /* 6.  */ date`datum_izvatka`,
  /* 7.  */ date`datum_prethodnog_stanja`,
  /* 8.  */ sign`predznak_prethodnog_stanja`,
  /* 9.  */ amount`prethodno_stanje`,
  /* 10. */ sign`predznak_rezervacije`,
  /* 11. */ amount`iznos_rezervacije`,
  /* 12. */ date`datum_dozvoljenog_prekoracenja`,
  /* 13. */ amount`dozvoljeno_prekoracenje`,
  /* 14. */ amount`iznos_zaplijenjenih_sredstava`,
  /* 15. */ sign`predznak_raspolozivog_stanja`,
  /* 16. */ amount`iznos_raspolozivog_stanja`,
  /* 17. */ sign`predznak_ukupnog_dugovnog_prometa`,
  /* 18. */ amount`ukupni_dugovni_promet`,
  /* 19. */ sign`predznak_ukupnog_potraznog_prometa`,
  /* 20. */ amount`ukupni_potrazni_promet`,
  /* 21. */ sign`predznak_novog_stanja`,
  /* 22. */ amount`novo_stanje`,
  /* 23. */ num(4)`redni_broj_grupe_u_paketu`,
  /* 24. */ num(6)`broj_stavaka_u_grupi`,
  /* 25. */ str(420)`tekstualna_poruka`,
  /* 26. */ str(317)`rezerva`,
  /* 27. */ type`tip_sloga`
];

const format909 = [
  /* 1.  */ date`datum_obrade`,
  /* 2.  */ num(5)`broj_grupa`,
  /* 3.  */ num(6)`broj_slogova`,
  /* 4.  */ str(978)`rezerva`,
  /* 5.  */ type`tip_sloga`
];

const format999 = [
  /* 1.  */ str(997)`rezerva`,
  /* 2.  */ type`tip_sloga`
];

const LineFormat = {
  900: format900,
  903: format903,
  905: format905,
  907: format907,
  909: format909,
  999: format999
};

module.exports = parseHUB3;

/**
 * Parse HUB3 bank report
 * @param {Buffer} buffer HUB3 file contents
 * @returns {Array<LineRecord>} array of line records
 * @throws {ParserError}
 * @see http://com.pbz.hr/download/Format_za_dostavu_izvadaka_klijentima_na_elektronskom_mediju.pdf
 *
 * @example
 * const { HUB3Error, parse } = require('@extensionengine/hub3');
 * const path = require('path');
 * const { readFileSync } = require('fs');
 *
 * const hub3 = readFileSync(path.join(__dirname, '../reports/1110779471-20200826.mn'));
 * try {
 *   const records = parse(hub3);
 *   console.log({ records });
 * } catch (err) {
 *   if (!HUB3Error.isHUB3Error(err)) throw err;
 *   console.error('Failed to parse report:', err.message);
 *   process.exit(1);
 * }
 */
function parseHUB3(buffer) {
  const content = iconv.decode(buffer, 'win1250');
  const lines = content.split(/\r?\n/g).slice(0, -1);
  return lines.map((line, i) => {
    const lineno = i + 1;
    const type = line.substr(-3);
    const format = LineFormat[type];
    if (!format) {
      throw new ParserError('Failed to parse HUB3. Unknown line record:', { type, lineno });
    }
    const data = parseLine(format, line, lineno);
    const isClosingRecord = type === '909';
    if (!isClosingRecord) {
      return data;
    }
    if (lineno !== data.broj_slogova) {
      throw new ParserError('Failed to parse HUB3. Line record count mismatch:', { actual: lineno, expected: data.broj_slogova });
    }
    return data;
  });
}

/**
 * @typedef {Object} LineRecord
 * @property {String} tip_sloga type
 */

function parseLine(sections, line, lineno) {
  const data = sections.reduce((acc, { key, len, processor }) => {
    const value = (line.substr(acc.__offset, len) || '').trim();
    const newValue = processor(value);
    acc[key] = newValue;
    acc.__offset += len;
    return acc;
  }, { __offset: 0 });
  if (data.__offset !== line.length) {
    throw new ParserError('Parsing line record failed:', { offset: data.__offset, lenght: line.length, lineno });
  }
  delete data.__offset;
  return data;
}

function parseDate(str) {
  if (!str) return str;
  const year = str.substr(0, 4);
  const month = str.substr(4, 2);
  const date = str.substr(6, 2);
  return [year, month, date].join('-');
}
