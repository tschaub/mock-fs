var path = require('path');

var constants = process.binding('constants');



/**
 * Create a new file descriptor.
 * @param {string} pathname Path to file.
 * @param {number} flags Flags.
 * @constructor
 */
var FileDescriptor = exports.FileDescriptor = function(pathname, flags) {

  /**
   * Absolute path to file.
   * @type {string}
   */
  this._pathname = path.resolve(pathname);

  /**
   * Flags.
   * @type {number}
   */
  this._flags = flags;

};


/**
 * Get the absolute path to the file.
 * @return {string} Absolute path.
 */
FileDescriptor.prototype.getPath = function() {
  return this._pathname;
};


/**
 * Check if file opened for appending.
 * @return {boolean} Opened for appending.
 */
FileDescriptor.prototype.isAppend = function() {
  return ((this._flags & constants.O_APPEND) === constants.O_APPEND);
};


/**
 * Check if file opened for creation.
 * @return {boolean} Opened for creation.
 */
FileDescriptor.prototype.isCreate = function() {
  return ((this._flags & constants.O_CREAT) === constants.O_CREAT);
};


/**
 * Check if file opened for reading.
 * @return {boolean} Opened for reading.
 */
FileDescriptor.prototype.isRead = function() {
  // special treatment because O_RDONLY is 0
  return (this._flags === constants.O_RDONLY) ||
      (this._flags === (constants.O_RDONLY | constants.O_SYNC)) ||
      ((this._flags & constants.O_RDWR) === constants.O_RDWR);
};


/**
 * Check if file opened for writing.
 * @return {boolean} Opened for writing.
 */
FileDescriptor.prototype.isWrite = function() {
  return ((this._flags & constants.O_WRONLY) === constants.O_WRONLY) ||
      ((this._flags & constants.O_RDWR) === constants.O_RDWR);
};


/**
 * Check if file opened with exclusive flag.
 * @return {boolean} Opened with exclusive.
 */
FileDescriptor.prototype.isExclusive = function() {
  return ((this._flags & constants.O_EXCL) === constants.O_EXCL);
};
