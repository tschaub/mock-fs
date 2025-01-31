const constants = require('constants');

/**
 * Create a new file descriptor.
 * @param {number} flags Flags.
 * @param {boolean} isPromise descriptor was opened via fs.promises
 * @class
 */
function FileDescriptor(flags, isPromise = false) {
  /**
   * Flags.
   * @type {number}
   */
  this._flags = flags;

  /**
   * File system item.
   * @type {Item}
   */
  this._item = null;

  /**
   * Current file position.
   * @type {number}
   */
  this._position = 0;

  this._isPromise = isPromise;
}

/**
 * Set the item.
 * @param {Item} item File system item.
 */
FileDescriptor.prototype.setItem = function (item) {
  this._item = item;
};

/**
 * Get the item.
 * @return {Item} File system item.
 */
FileDescriptor.prototype.getItem = function () {
  return this._item;
};

/**
 * Get the current file position.
 * @return {number} File position.
 */
FileDescriptor.prototype.getPosition = function () {
  return this._position;
};

/**
 * Set the current file position.
 * @param {number} position File position.
 */
FileDescriptor.prototype.setPosition = function (position) {
  this._position = position;
};

/**
 * Check if file opened for appending.
 * @return {boolean} Opened for appending.
 */
FileDescriptor.prototype.isAppend = function () {
  return (this._flags & constants.O_APPEND) === constants.O_APPEND;
};

/**
 * Check if file opened for creation.
 * @return {boolean} Opened for creation.
 */
FileDescriptor.prototype.isCreate = function () {
  return (this._flags & constants.O_CREAT) === constants.O_CREAT;
};

/**
 * Check if file opened for reading.
 * @return {boolean} Opened for reading.
 */
FileDescriptor.prototype.isRead = function () {
  return (this._flags & constants.O_WRONLY) !== constants.O_WRONLY;
};

/**
 * Check if file opened for writing.
 * @return {boolean} Opened for writing.
 */
FileDescriptor.prototype.isWrite = function () {
  return (
    (this._flags & constants.O_WRONLY) === constants.O_WRONLY ||
    (this._flags & constants.O_RDWR) === constants.O_RDWR
  );
};

/**
 * Check if file opened for truncating.
 * @return {boolean} Opened for truncating.
 */
FileDescriptor.prototype.isTruncate = function () {
  return (this._flags & constants.O_TRUNC) === constants.O_TRUNC;
};

/**
 * Check if file opened with exclusive flag.
 * @return {boolean} Opened with exclusive.
 */
FileDescriptor.prototype.isExclusive = function () {
  return (this._flags & constants.O_EXCL) === constants.O_EXCL;
};

/**
 * Check if the file descriptor was opened as a promise
 * @return {boolean} Opened from fs.promise
 */
FileDescriptor.prototype.isPromise = function () {
  return this._isPromise;
};

/**
 * Export the constructor.
 */
module.exports = FileDescriptor;
