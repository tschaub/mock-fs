var path = require('path');
var util = require('util');

var Item = require('./item');

var constants = process.binding('constants');



/**
 * A directory.
 * @param {string} name Directory name.
 * @constructor
 */
var Directory = exports.Directory = function Directory(name) {
  Item.call(this, name);

  /**
   * Items in this directory.
   * @type {Object.<string, Item>}
   */
  this._items = {};

};
util.inherits(Directory, Item);


/**
 * Add an item to the directory.
 * @param {Item} item The item to add.
 * @return {Item} The added item.
 */
Directory.prototype.addItem = function(item) {
  var name = item.getName();
  if (this._items.hasOwnProperty(name)) {
    throw new Error('Item with the same name already exists: ' + name);
  }
  this._items[name] = item;

  item.setParent(this);
  return item;
};


/**
 * Get a named item.
 * @param {string} name Item name.
 * @return {Item} The named item (or null if none).
 */
Directory.prototype.getItem = function(name) {
  var item = null;
  if (this._items.hasOwnProperty(name)) {
    item = this._items[name];
  }
  return item;
};


/**
 * Remove an item.
 * @param {Item} item Item to remove.
 * @return {Item} The orphan item.
 */
Directory.prototype.removeItem = function(item) {
  var name = item.getName();
  if (!this._items.hasOwnProperty(name) || this._items[name] !== item) {
    throw new Error('Item does not exist in directory: ' + name);
  }
  delete this._items[name];
  item.setParent(null);
  return item;
};


/**
 * Rename an item.
 * @param {string} oldName Old name.
 * @param {string} newName New name.
 * @return {Item} The renamed item.
 */
Directory.prototype.renameItem = function(oldName, newName) {
  if (!this._items.hasOwnProperty(oldName)) {
    throw new Error('Item does not exist in directory: ' + oldName);
  }
  if (this._items.hasOwnProperty(newName)) {
    throw new Error('Item with same name already exists: ' + newName);
  }
  var item = this._items[oldName];
  delete this._items[oldName];
  this._items[newName] = item;
  item.setName(newName);
  return item;
};


/**
 * Get list of item names in this directory.
 * @return {Array.<string>} Item names.
 */
Directory.prototype.list = function() {
  return Object.keys(this._items).sort();
};


/**
 * Get directory stats.
 * @return {Object} Stats properties.
 */
Directory.prototype.getStats = function() {
  return {
    mode: this.getMode() | constants.S_IFDIR,
    atime: this.getATime(),
    mtime: this.getMTime(),
    ctime: this.getCTime(),
    uid: this.getUid(),
    gid: this.getGid(),
    size: 1
  };
};
