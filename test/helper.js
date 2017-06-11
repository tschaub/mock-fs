'use strict';

var chai = require('chai');
var constants = require('constants');
var semver = require('semver');

/** @type {boolean} */
chai.config.includeStack = true;

/**
 * Chai's assert function configured to include stacks on failure.
 * @type {function}
 */
exports.assert = chai.assert;

exports.inVersion = function(range) {
  if (semver.satisfies(process.version, range)) {
    return {it: it, describe: describe};
  } else {
    return {it: xit, describe: xdescribe};
  }
};

/**
 * Convert a string to flags for fs.open.
 * @param {string} str String.
 * @return {number} Flags.
 */
exports.flags = function(str) {
  switch (str) {
    case 'r':
      return constants.O_RDONLY;
    case 'rs':
      return constants.O_RDONLY | constants.O_SYNC;
    case 'r+':
      return constants.O_RDWR;
    case 'rs+':
      return constants.O_RDWR | constants.O_SYNC;

    case 'w':
      return constants.O_TRUNC | constants.O_CREAT | constants.O_WRONLY;
    case 'wx': // fall through
    case 'xw':
      return (
        constants.O_TRUNC |
        constants.O_CREAT |
        constants.O_WRONLY |
        constants.O_EXCL
      );

    case 'w+':
      return constants.O_TRUNC | constants.O_CREAT | constants.O_RDWR;
    case 'wx+': // fall through
    case 'xw+':
      return (
        constants.O_TRUNC |
        constants.O_CREAT |
        constants.O_RDWR |
        constants.O_EXCL
      );

    case 'a':
      return constants.O_APPEND | constants.O_CREAT | constants.O_WRONLY;
    case 'ax': // fall through
    case 'xa':
      return (
        constants.O_APPEND |
        constants.O_CREAT |
        constants.O_WRONLY |
        constants.O_EXCL
      );

    case 'a+':
      return constants.O_APPEND | constants.O_CREAT | constants.O_RDWR;
    case 'ax+': // fall through
    case 'xa+':
      return (
        constants.O_APPEND |
        constants.O_CREAT |
        constants.O_RDWR |
        constants.O_EXCL
      );
    default:
      throw new Error('Unsupported flag: ' + str);
  }
};
