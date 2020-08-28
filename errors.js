'use strict';

const mapObj = (obj, cb) => Object.keys(obj).map(key => cb(obj[key], key));

/**
 * Base class for all HUB3 specific errors
 * @class HUB3Error
 * @augments Error
 */
class HUB3Error extends Error {
  /**
   * Check if error is HUB3 specific error
   * @param {Error} err error
   * @returns {boolean} result
   */
  static isHUB3Error(err) {
    return err instanceof this;
  }
}
Object.defineProperty(HUB3Error.prototype, 'name', { value: 'HUB3Error' });

/**
 * Custom error class used for reporting parsing errors
 * @class ParserError
 * @augments HUB3Error
 */
class ParserError extends HUB3Error {
  constructor(message, data) {
    message = [message, format(data)].filter(Boolean).join(' ');
    super(message);
  }
}
Object.defineProperty(ParserError.prototype, 'name', { value: 'HUB3ParserError' });

module.exports = {
  HUB3Error,
  ParserError
};

function format(data) {
  return mapObj(data, (val, key) => [key, val].join('=')).join(', ');
}
