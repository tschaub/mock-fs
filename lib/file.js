var path = require('path');
var util = require('util');

var Item = require('./item').Item;

var EMPTY = new Buffer(0);



/**
 * A directory.
 * @param {string} name File name.
 * @constructor
 */
var File = exports.File = function File(name) {
  Item.call(this, name);

  /**
   * File content.
   * @type {Buffer}
   */
  this._content = EMPTY;

};
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
    content = new Buffer(content);
  } else if (!Buffer.isBuffer(content)) {
    throw new Error('File content must be a string or buffer');
  }
  this._content = content;
  var now = Date.now();
  this.setCTime(new Date(now));
  this.setMTime(new Date(now));
};
