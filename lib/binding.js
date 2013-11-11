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
  this.mode = config.mode;
}



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


/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {function(Error, Stats)} callback Callback (optional).
 * @return {*} Stats or undefined (if async).
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
