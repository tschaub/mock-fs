var path = require('path');
var util = require('util');

var Item = require('./item');

var constants = process.binding('constants');



/**
 * A directory.
 * @constructor
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
SymbolicLink.prototype.setPath = function(pathname) {
  this._path = pathname;
};


/**
 * Get the path to the source.
 * @return {string} Path to source.
 */
SymbolicLink.prototype.getPath = function() {
  return this._path;
};


/**
 * Get symbolic link stats.
 * @return {Object} Stats properties.
 */
SymbolicLink.prototype.getStats = function() {
  return {
    mode: this.getMode() | constants.S_IFLNK,
    atime: this.getATime(),
    mtime: this.getMTime(),
    ctime: this.getCTime(),
    uid: this.getUid(),
    gid: this.getGid(),
    size: this.getPath().length
  };
};


/**
 * Export the constructor.
 * @type {function()}
 */
exports = module.exports = SymbolicLink;
