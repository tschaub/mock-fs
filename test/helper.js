'use strict';

const chai = require('chai');
const constants = require('constants');
const semver = require('semver');
const fs = require('fs');
const hasPromise = !!fs.promises;

/** @type {boolean} */
chai.config.includeStack = true;

/**
 * Chai's assert function configured to include stacks on failure.
 * @type {function}
 */
exports.assert = chai.assert;

function run(func) {
  func();
}

function noRun() {}

const TEST = {
  it: it,
  xit: xit,
  describe: describe,
  xdescribe: xdescribe,
  run: run
};

const NO_TEST = {
  it: xit,
  xit: xit,
  describe: xdescribe,
  xdescribe: xdescribe,
  run: noRun
};

exports.inVersion = function(range) {
  if (semver.satisfies(process.version, range)) {
    return TEST;
  } else {
    return NO_TEST;
  }
};

exports.withPromise = hasPromise ? TEST : NO_TEST;

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

exports.assertEqualPaths = function(actual, expected) {
  if (process.platform === 'win32') {
    chai.assert.equal(actual.toLowerCase(), expected.toLowerCase());
  } else {
    chai.assert(actual, expected);
  }
};

exports.assertEvent = function(action, emitter, eventName, ...args) {
  const captured = [];
  const listener = function() {
    captured.push([...arguments]);
  };
  emitter.addListener(eventName, listener);
  action();
  emitter.removeListener(eventName, listener);
  chai.assert.deepEqual([...args], captured[0]);
};
