'use strict';

const uvBinding = process.binding('uv');

/**
 * Error codes from libuv.
 * @enum {number}
 */
const codes = {};

uvBinding.getErrorMap().forEach(function (value, errno) {
  const code = value[0];
  const message = value[1];
  codes[code] = {errno: errno, message: message};
});

/**
 * Create an error.
 * @param {string} code Error code.
 * @param {string} path Path (optional).
 * @class
 */
function FSError(code, path) {
  if (!codes.hasOwnProperty(code)) {
    throw new Error('Programmer error, invalid error code: ' + code);
  }
  Error.call(this);
  const details = codes[code];
  let message = code + ', ' + details.message;
  if (path) {
    message += " '" + path + "'";
  }
  this.message = message;
  this.code = code;
  this.errno = details.errno;
  if (path !== undefined) {
    this.path = path;
  }
  Error.captureStackTrace(this, FSError);
}
FSError.prototype = new Error();
FSError.codes = codes;

/**
 * Create an abort error for when an asynchronous task was aborted.
 * @class
 */
function AbortError() {
  Error.call(this);
  this.code = 'ABORT_ERR';
  this.name = 'AbortError';
  Error.captureStackTrace(this, AbortError);
}
AbortError.prototype = new Error();

/**
 * FSError constructor.
 */
exports.FSError = FSError;

/**
 * AbortError constructor.
 */
exports.AbortError = AbortError;
