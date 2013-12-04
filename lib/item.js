var path = require('path');

var counter = 0;



/**
 * A filesystem item.
 * @constructor
 */
function Item() {

  var now = Date.now();

  /**
   * Access time.
   * @type {Date}
   */
  this._atime = new Date(now);

  /**
   * Change time.
   * @type {Date}
   */
  this._ctime = new Date(now);

  /**
   * Modification time.
   * @type {Date}
   */
  this._mtime = new Date(now);

  /**
   * Permissions.
   */
  this._mode = 0666;

  /**
   * User id.
   * @type {number}
   */
  this._uid = process.getuid ? process.getuid() : undefined;

  /**
   * Group id.
   * @type {number}
   */
  this._gid = process.getgid ? process.getgid() : undefined;

  /**
   * Item number.
   * @type {number}
   */
  this._id = ++counter;

  /**
   * Number of links to this item.
   */
  this.links = 0;

}


/**
 * Get access time.
 * @return {Date} Access time.
 */
Item.prototype.getATime = function() {
  return this._atime;
};


/**
 * Set access time.
 * @param {Date} atime Access time.
 */
Item.prototype.setATime = function(atime) {
  this._atime = atime;
};


/**
 * Get change time.
 * @return {Date} Change time.
 */
Item.prototype.getCTime = function() {
  return this._ctime;
};


/**
 * Set change time.
 * @param {Date} ctime Change time.
 */
Item.prototype.setCTime = function(ctime) {
  this._ctime = ctime;
};


/**
 * Get modification time.
 * @return {Date} Modification time.
 */
Item.prototype.getMTime = function() {
  return this._mtime;
};


/**
 * Set modification time.
 * @param {Date} mtime Modification time.
 */
Item.prototype.setMTime = function(mtime) {
  this._mtime = mtime;
};


/**
 * Get mode (permission only, e.g 0666).
 * @return {number} Mode.
 */
Item.prototype.getMode = function() {
  return this._mode;
};


/**
 * Set mode (permission only, e.g 0666).
 * @param {Date} mode Mode.
 */
Item.prototype.setMode = function(mode) {
  this.setCTime(new Date());
  this._mode = mode;
};


/**
 * Get user id.
 * @return {number} User id.
 */
Item.prototype.getUid = function() {
  return this._uid;
};


/**
 * Set user id.
 * @param {number} uid User id.
 */
Item.prototype.setUid = function(uid) {
  this.setCTime(new Date());
  this._uid = uid;
};


/**
 * Get group id.
 * @return {number} Group id.
 */
Item.prototype.getGid = function() {
  return this._gid;
};


/**
 * Set group id.
 * @param {number} gid Group id.
 */
Item.prototype.setGid = function(gid) {
  this.setCTime(new Date());
  this._gid = gid;
};


/**
 * Get item stats.
 * @return {Object} Stats properties.
 */
Item.prototype.getStats = function() {
  return {
    dev: 8675309,
    nlink: this.links,
    uid: this.getUid(),
    gid: this.getGid(),
    rdev: 0,
    blksize: 4096,
    ino: this._id,
    atime: this.getATime(),
    mtime: this.getMTime(),
    ctime: this.getCTime(),
  };
};


/**
 * Get the item's string representation.
 * @return {string} String representation.
 */
Item.prototype.toString = function() {
  return '[' + this.constructor.name + ']';
};


/**
 * Export the constructor.
 * @type {function()}
 */
exports = module.exports = Item;
