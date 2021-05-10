'use strict';

const util = require('util');

const Item = require('./item');

const EMPTY = Buffer.alloc(0);
const constants = require('constants');

/**
 * A file.
 * @constructor
 */
function File() {
  Item.call(this);

  /**
   * File content.
   * @type {Buffer}
   */
  this._content = EMPTY;
}
util.inherits(File, Item);

/**
 * Get the file contents.
 * @return {Buffer} File contents.
 */
File.prototype.getContent = function() {
  this.setATime(new Date());
  return this._content;
};

/**
 * Set the file contents.
 * @param {string|Buffer} content File contents.
 */
File.prototype.setContent = function(content) {
  if (typeof content === 'string') {
    content = Buffer.from(content);
  } else if (!Buffer.isBuffer(content)) {
    throw new Error('File content must be a string or buffer');
  }
  this._content = content;
  const now = Date.now();
  this.setCTime(new Date(now));
  this.setMTime(new Date(now));
};

/**
 * Get file stats.
 * @return {Object} Stats properties.
 */
File.prototype.getStats = function(bigint) {
  const size = this._content.length;
  const stats = Item.prototype.getStats.call(this, bigint);
  const convert = bigint ? v => BigInt(v) : v => v;

  stats[1] = convert(this.getMode() | constants.S_IFREG); // mode
  stats[8] = convert(size); // size
  stats[9] = convert(Math.ceil(size / 512)); // blocks

  return stats;
};

/**
 * Export the constructor.
 * @type {function()}
 */
exports = module.exports = File;

/**
 * Standard input.
 * @constructor
 */
function StandardInput() {
  File.call(this);
  this.setMode(438); // 0666
}
util.inherits(StandardInput, File);

exports.StandardInput = StandardInput;

/**
 * Standard output.
 * @constructor
 */
function StandardOutput() {
  File.call(this);
  this.setMode(438); // 0666
}
util.inherits(StandardOutput, File);

/**
 * Write the contents to stdout.
 * @param {string|Buffer} content File contents.
 */
StandardOutput.prototype.setContent = function(content) {
  if (process.stdout.isTTY) {
    process.stdout.write(content);
  }
};

exports.StandardOutput = StandardOutput;

/**
 * Standard error.
 * @constructor
 */
function StandardError() {
  File.call(this);
  this.setMode(438); // 0666
}
util.inherits(StandardError, File);

/**
 * Write the contents to stderr.
 * @param {string|Buffer} content File contents.
 */
StandardError.prototype.setContent = function(content) {
  if (process.stderr.isTTY) {
    process.stderr.write(content);
  }
};

exports.StandardError = StandardError;
