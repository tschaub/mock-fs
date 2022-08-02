'use strict';

const util = require('util');
const Item = require('./item.js');
const constants = require('constants');

/**
 * A directory.
 * @class
 */
function SymbolicLink() {
  Item.call(this);

  /**
   * Relative path to source.
   * @type {string}
   */
  this._path = undefined;
}
util.inherits(SymbolicLink, Item);

/**
 * Set the path to the source.
 * @param {string} pathname Path to source.
 */
SymbolicLink.prototype.setPath = function (pathname) {
  this._path = pathname;
};

/**
 * Get the path to the source.
 * @return {string} Path to source.
 */
SymbolicLink.prototype.getPath = function () {
  return this._path;
};

/**
 * Get symbolic link stats.
 * @param {boolean} bigint Use BigInt.
 * @return {object} Stats properties.
 */
SymbolicLink.prototype.getStats = function (bigint) {
  const size = this._path.length;
  const stats = Item.prototype.getStats.call(this, bigint);
  const convert = bigint ? (v) => BigInt(v) : (v) => v;

  stats[1] = convert(this.getMode() | constants.S_IFLNK); // mode
  stats[8] = convert(size); // size
  stats[9] = convert(Math.ceil(size / 512)); // blocks

  return stats;
};

/**
 * Export the constructor.
 * @type {function()}
 */
module.exports = SymbolicLink;
