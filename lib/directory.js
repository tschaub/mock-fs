'use strict';

const util = require('util');
const Item = require('./item.js');
const constants = require('constants');

/**
 * A directory.
 * @class
 */
function Directory() {
  Item.call(this);

  /**
   * Items in this directory.
   * @type {Object<string, Item>}
   */
  this._items = {};

  /**
   * Permissions.
   */
  this._mode = 511; // 0777
}
util.inherits(Directory, Item);

/**
 * Add an item to the directory.
 * @param {string} name The name to give the item.
 * @param {Item} item The item to add.
 * @return {Item} The added item.
 */
Directory.prototype.addItem = function (name, item) {
  if (this._items.hasOwnProperty(name)) {
    throw new Error('Item with the same name already exists: ' + name);
  }
  this._items[name] = item;
  ++item.links;
  if (item instanceof Directory) {
    // for '.' entry
    ++item.links;
    // for subdirectory
    ++this.links;
  }
  this.setMTime(new Date());
  return item;
};

/**
 * Get a named item.
 * @param {string} name Item name.
 * @return {Item} The named item (or null if none).
 */
Directory.prototype.getItem = function (name) {
  let item = null;
  if (this._items.hasOwnProperty(name)) {
    item = this._items[name];
  }
  return item;
};

/**
 * Remove an item.
 * @param {string} name Name of item to remove.
 * @return {Item} The orphan item.
 */
Directory.prototype.removeItem = function (name) {
  if (!this._items.hasOwnProperty(name)) {
    throw new Error('Item does not exist in directory: ' + name);
  }
  const item = this._items[name];
  delete this._items[name];
  --item.links;
  if (item instanceof Directory) {
    // for '.' entry
    --item.links;
    // for subdirectory
    --this.links;
  }
  this.setMTime(new Date());
  return item;
};

/**
 * Get list of item names in this directory.
 * @return {Array<string>} Item names.
 */
Directory.prototype.list = function () {
  return Object.keys(this._items).sort();
};

/**
 * Get directory stats.
 * @param {bolean} bigint Use BigInt.
 * @return {object} Stats properties.
 */
Directory.prototype.getStats = function (bigint) {
  const stats = Item.prototype.getStats.call(this, bigint);
  const convert = bigint ? (v) => BigInt(v) : (v) => v;

  stats[1] = convert(this.getMode() | constants.S_IFDIR); // mode
  stats[8] = convert(1); // size
  stats[9] = convert(1); // blocks

  return stats;
};

/**
 * Export the constructor.
 * @type {function()}
 */
module.exports = Directory;
