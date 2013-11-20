var path = require('path');



/**
 * A filesystem item.
 * @param {string} name Item name.
 * @constructor
 */
var Item = exports.Item = function Item(name) {

  /**
   * Item name.
   * @type {string}
   */
  this._name = name;

  /**
   * Item parent.
   * @type {Item}
   */
  this._parent = null;

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

};


/**
 * Get an item name.
 * @return {string} Item name.
 */
Item.prototype.getName = function() {
  return this._name;
};


/**
 * Set an item name.
 * @param {string} name Item name.
 */
Item.prototype.setName = function(name) {
  this._name = name;
};


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
  this._mode = mode;
};


/**
 * Get an item's parent.
 * @return {Item} Parent item.
 */
Item.prototype.getParent = function() {
  return this._parent;
};


/**
 * Set an item's parent.
 * @param {Item} parent Parent item.
 */
Item.prototype.setParent = function(parent) {
  this._parent = parent;
};


/**
 * Get the item's string representation.
 * @return {string} String representation.
 */
Item.prototype.toString = function() {
  return '[' + this.constructor.name + ' ' + this.getName() + ']';
};
