'use strict';

const fsBinding = process.binding('fs');
const statsConstructor = fsBinding.statValues
  ? fsBinding.statValues.constructor
  : Float64Array;
// Nodejs v18.7.0 changed bigint stats type from BigUint64Array to BigInt64Array
// https://github.com/nodejs/node/pull/43714
const bigintStatsConstructor = fsBinding.bigintStatValues
  ? fsBinding.bigintStatValues.constructor
  : BigUint64Array;

let counter = 0;

/**
 * Permissions.
 * @enum {number}
 */
const permissions = {
  USER_READ: 256, // 0400
  USER_WRITE: 128, // 0200
  USER_EXEC: 64, // 0100
  GROUP_READ: 32, // 0040
  GROUP_WRITE: 16, // 0020
  GROUP_EXEC: 8, // 0010
  OTHER_READ: 4, // 0004
  OTHER_WRITE: 2, // 0002
  OTHER_EXEC: 1, // 0001
};

function getUid() {
  // force 0 on windows.
  return process.getuid ? process.getuid() : 0;
}

function getGid() {
  // force 0 on windows.
  return process.getgid ? process.getgid() : 0;
}

/**
 * A filesystem item.
 * @class
 */
function Item() {
  const now = Date.now();

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
   * Birth time.
   * @type {Date}
   */
  this._birthtime = new Date(now);

  /**
   * Modification time.
   * @type {Date}
   */
  this._mtime = new Date(now);

  /**
   * Permissions.
   */
  this._mode = 438; // 0666

  /**
   * User id.
   * @type {number}
   */
  this._uid = getUid();

  /**
   * Group id.
   * @type {number}
   */
  this._gid = getGid();

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
 * Add execute if read allowed
 * See notes in index.js -> mapping#addDir
 * @param {number} mode The file mode.
 * @return {number} The modified mode.
 */
Item.fixWin32Permissions = (mode) =>
  process.platform !== 'win32'
    ? mode
    : mode |
      (mode & permissions.USER_READ && permissions.USER_EXEC) |
      (mode & permissions.GROUP_READ && permissions.GROUP_EXEC) |
      (mode & permissions.OTHER_READ && permissions.OTHER_EXEC);

/**
 * Determine if the current user has read permission.
 * @return {boolean} The current user can read.
 */
Item.prototype.canRead = function () {
  const uid = getUid();
  const gid = getGid();
  let can = false;
  if (process.getuid && uid === 0) {
    can = true;
  } else if (uid === this._uid) {
    can = (permissions.USER_READ & this._mode) === permissions.USER_READ;
  } else if (gid === this._gid) {
    can = (permissions.GROUP_READ & this._mode) === permissions.GROUP_READ;
  } else {
    can = (permissions.OTHER_READ & this._mode) === permissions.OTHER_READ;
  }
  return can;
};

/**
 * Determine if the current user has write permission.
 * @return {boolean} The current user can write.
 */
Item.prototype.canWrite = function () {
  const uid = getUid();
  const gid = getGid();
  let can = false;
  if (process.getuid && uid === 0) {
    can = true;
  } else if (uid === this._uid) {
    can = (permissions.USER_WRITE & this._mode) === permissions.USER_WRITE;
  } else if (gid === this._gid) {
    can = (permissions.GROUP_WRITE & this._mode) === permissions.GROUP_WRITE;
  } else {
    can = (permissions.OTHER_WRITE & this._mode) === permissions.OTHER_WRITE;
  }
  return can;
};

/**
 * Determine if the current user has execute permission.
 * @return {boolean} The current user can execute.
 */
Item.prototype.canExecute = function () {
  const uid = getUid();
  const gid = getGid();
  let can = false;
  if (process.getuid && uid === 0) {
    can = true;
  } else if (uid === this._uid) {
    can = (permissions.USER_EXEC & this._mode) === permissions.USER_EXEC;
  } else if (gid === this._gid) {
    can = (permissions.GROUP_EXEC & this._mode) === permissions.GROUP_EXEC;
  } else {
    can = (permissions.OTHER_EXEC & this._mode) === permissions.OTHER_EXEC;
  }
  return can;
};

/**
 * Get access time.
 * @return {Date} Access time.
 */
Item.prototype.getATime = function () {
  return this._atime;
};

/**
 * Set access time.
 * @param {Date} atime Access time.
 */
Item.prototype.setATime = function (atime) {
  this._atime = atime;
};

/**
 * Get change time.
 * @return {Date} Change time.
 */
Item.prototype.getCTime = function () {
  return this._ctime;
};

/**
 * Set change time.
 * @param {Date} ctime Change time.
 */
Item.prototype.setCTime = function (ctime) {
  this._ctime = ctime;
};

/**
 * Get birth time.
 * @return {Date} Birth time.
 */
Item.prototype.getBirthtime = function () {
  return this._birthtime;
};

/**
 * Set change time.
 * @param {Date} birthtime Birth time.
 */
Item.prototype.setBirthtime = function (birthtime) {
  this._birthtime = birthtime;
};

/**
 * Get modification time.
 * @return {Date} Modification time.
 */
Item.prototype.getMTime = function () {
  return this._mtime;
};

/**
 * Set modification time.
 * @param {Date} mtime Modification time.
 */
Item.prototype.setMTime = function (mtime) {
  this._mtime = mtime;
};

/**
 * Get mode (permission only, e.g 0666).
 * @return {number} Mode.
 */
Item.prototype.getMode = function () {
  return this._mode;
};

/**
 * Set mode (permission only, e.g 0666).
 * @param {Date} mode Mode.
 */
Item.prototype.setMode = function (mode) {
  this.setCTime(new Date());
  this._mode = mode;
};

/**
 * Get user id.
 * @return {number} User id.
 */
Item.prototype.getUid = function () {
  return this._uid;
};

/**
 * Set user id.
 * @param {number} uid User id.
 */
Item.prototype.setUid = function (uid) {
  this.setCTime(new Date());
  this._uid = uid;
};

/**
 * Get group id.
 * @return {number} Group id.
 */
Item.prototype.getGid = function () {
  return this._gid;
};

/**
 * Set group id.
 * @param {number} gid Group id.
 */
Item.prototype.setGid = function (gid) {
  this.setCTime(new Date());
  this._gid = gid;
};

/**
 * Get item stats.
 * @param {boolean} bigint Use BigInt.
 * @return {object} Stats properties.
 */
Item.prototype.getStats = function (bigint) {
  const stats = bigint
    ? new bigintStatsConstructor(36)
    : new statsConstructor(36);
  const convert = bigint ? (v) => BigInt(v) : (v) => v;

  stats[0] = convert(8675309); // dev
  // [1] is mode
  stats[2] = convert(this.links); // nlink
  stats[3] = convert(this.getUid()); // uid
  stats[4] = convert(this.getGid()); // gid
  stats[5] = convert(0); // rdev
  stats[6] = convert(4096); // blksize
  stats[7] = convert(this._id); // ino
  // [8] is size
  // [9] is blocks
  const atimeMs = +this.getATime();
  stats[10] = convert(Math.floor(atimeMs / 1000)); // atime seconds
  stats[11] = convert((atimeMs % 1000) * 1000000); // atime nanoseconds
  const mtimeMs = +this.getMTime();
  stats[12] = convert(Math.floor(mtimeMs / 1000)); // atime seconds
  stats[13] = convert((mtimeMs % 1000) * 1000000); // atime nanoseconds
  const ctimeMs = +this.getCTime();
  stats[14] = convert(Math.floor(ctimeMs / 1000)); // atime seconds
  stats[15] = convert((ctimeMs % 1000) * 1000000); // atime nanoseconds
  const birthtimeMs = +this.getBirthtime();
  stats[16] = convert(Math.floor(birthtimeMs / 1000)); // atime seconds
  stats[17] = convert((birthtimeMs % 1000) * 1000000); // atime nanoseconds
  return stats;
};

/**
 * Get the item's string representation.
 * @return {string} String representation.
 */
Item.prototype.toString = function () {
  return '[' + this.constructor.name + ']';
};

/**
 * Export the constructor.
 * @type {function()}
 */
module.exports = Item;
