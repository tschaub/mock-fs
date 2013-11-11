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
 * Get the item's path.  For orphan items, this will be the item name.
 * @return {string} The path.
 */
Item.prototype.getPath = function() {
  return this._parent ?
      path.join(this._parent.getPath() || path.sep, this._name) : this._name;
};


/**
 * Get the item's string representation.
 * @return {string} String representation.
 */
Item.prototype.toString = function() {
  return '[' + this.constructor.name + ' ' + this.getPath() + ']';
};
