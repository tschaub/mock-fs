'use strict';

var util = require('util');

var Item = require('./item');

var EMPTY = new Buffer(0);
var constants = process.binding('constants');


/**
 * A directory.
 * @constructor
 */
function File() {
  Item.call(this);

  /**
   * File content.
   * @type {Buffer}
   */
  this._content = EMPTY;

  /**
   * File size.
   * @type {number}
   */
  this._size = undefined;

}
util.inherits(File, Item);


/**
 * Get the file contents.
 * @return {Buffer} File contents.
 */
File.prototype.getContent = function() {
  this.setATime(new Date());
  if (typeof this._content === 'function') {
    var content = this._content();
    if (typeof content === 'string') {
      content = new Buffer(content);
    } else if (!Buffer.isBuffer(content)) {
      throw new Error('File content must be a string, buffer, or function \
                       returning a string or buffer');
    }
    this._content = content;
    this._size = content.length;
  }
  return this._content;
};


/**
 * Set the file contents.
 * @param {string|Buffer} content File contents.
 */
File.prototype.setContent = function(content) {
  if (typeof content === 'string') {
    content = new Buffer(content);
  } else if (!Buffer.isBuffer(content) && !(typeof content === 'function')) {
    throw new Error('File content must be a string, buffer, or function \
                     returning a string or buffer');
  }
  this._content = content;
  this._size = content.length;
  var now = Date.now();
  this.setCTime(new Date(now));
  this.setMTime(new Date(now));
};


/**
 * Set the file contents.
 * @param {string|Buffer} content File contents.
 */
File.prototype.setContent = function(content) {
  if (typeof content === 'string') {
    content = new Buffer(content);
  } else if (!Buffer.isBuffer(content) && !(typeof content === 'function')) {
    throw new Error('File content must be a string, buffer, or function \
                     returning a string or buffer');
  }
  this._content = content;
  var now = Date.now();
  this.setCTime(new Date(now));
  this.setMTime(new Date(now));
};


/**
 * Get file stats.
 * @return {Object} Stats properties.
 */
File.prototype.getStats = function() {
  if (typeof this._size === 'undefined') {
    this._size = this._content.length;
  }
  var size = this._size;
  var stats = Item.prototype.getStats.call(this);
  stats.mode = this.getMode() | constants.S_IFREG;
  stats.size = size;
  stats.blocks = Math.ceil(size / 512);
  return stats;
};


/**
 * Export the constructor.
 * @type {function()}
 */
exports = module.exports = File;
