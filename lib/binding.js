var path = require('path');
var constants = process.binding('constants');


function noSuchFile(filepath, source) {
  var code = 'ENOENT';
  var errno = 34;
  var error = new Error(code + ', ' + source + '\'' + filepath + '\'');
  error.code = code;
  error.errno = errno;
  return error;
}



/**
 * Create a new stats object.
 * @param {Object} config Stats properties.
 * @constructor
 */
function Stats(config) {
  for (var key in config) {
    this[key] = config[key];
  }
}


/**
 * Check if mode indicates property.
 * @param {number} property Property to check.
 * @return {boolean} Property matches mode.
 */
Stats.prototype._checkModeProperty = function(property) {
  return ((this.mode & constants.S_IFMT) === property);
};


/**
 * @return {Boolean} Is a directory.
 */
Stats.prototype.isDirectory = function() {
  return this._checkModeProperty(constants.S_IFDIR);
};


/**
 * @return {Boolean} Is a regular file.
 */
Stats.prototype.isFile = function() {
  return this._checkModeProperty(constants.S_IFREG);
};


/**
 * @return {Boolean} Is a block device.
 */
Stats.prototype.isBlockDevice = function() {
  return this._checkModeProperty(constants.S_IFBLK);
};


/**
 * @return {Boolean} Is a character device.
 */
Stats.prototype.isCharacterDevice = function() {
  return this._checkModeProperty(constants.S_IFCHR);
};


/**
 * @return {Boolean} Is a symbolic link.
 */
Stats.prototype.isSymbolicLink = function() {
  return this._checkModeProperty(constants.S_IFLNK);
};


/**
 * @return {Boolean} Is a named pipe.
 */
Stats.prototype.isFIFO = function() {
  return this._checkModeProperty(constants.S_IFIFO);
};


/**
 * @return {Boolean} Is a socket.
 */
Stats.prototype.isSocket = function() {
  return this._checkModeProperty(constants.S_IFSOCK);
};



/**
 * Create a new binding with the given file system.
 * @param {FileSystem} system Mock file system.
 * @constructor
 */
var Binding = exports.Binding = function(system) {

  /**
   * Mock file system.
   * @type {FileSystem}
   */
  this._system = system;

  /**
   * Stats constructor.
   * @type {function}
   */
  this.Stats = Stats;

};


function maybeCallback(callback, func) {
  if (callback) {
    process.nextTick(function() {
      var err = null;
      var val;
      try {
        val = func();
      } catch (e) {
        err = e;
      }
      callback(err, val);
    });
  } else {
    return func();
  }
}

function notImplemented() {
  throw new Error('Method not implemented');
}


/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {*} Stats or undefined (if sync).
 */
Binding.prototype.stat = function(filepath, callback) {
  var system = this._system;
  return maybeCallback(callback, function() {
    var item = system.getItem(filepath);
    if (!item) {
      throw noSuchFile(filepath, 'stat');
    }
    return new Stats(item.getStats());
  });
};
