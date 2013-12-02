var path = require('path');
var util = require('util');

var Item = require('./item');



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
 * Export the constructor.
 * @type {function()}
 */
exports = module.exports = SymbolicLink;
