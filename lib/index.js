var realFs = require('fs');
var path = require('path');

var rewire = require('rewire');

var Binding = require('./binding');
var FileSystem = require('./filesystem');

var minor = process.versions.node.split('.').slice(0, 2).join('.');
var versions = {
  '0.8': 'fs-0.8.26.js',
  '0.10': 'fs-0.10.24.js',
  '0.11': 'fs-0.11.10.js'
};

var fsName = versions[minor];
if (!fsName) {
  throw new Error('Unsupported Node version: ' + process.versions.node);
}


/**
 * Copy properties from one object to another.
 * @param {Object} obj The destination object.
 * @param {Object} src The source object.
 * @return {Object} The destination object.
 */
function mix(obj, src) {
  for (var key in src) {
    obj[key] = src[key];
  }
  return obj;
}

var originalFs = mix({}, realFs);


/**
 * Override the real fs module with the given configuration.  Returns a function
 * that can be called to restore the original file system.
 * @param {Object} config File system configuration.
 * @return {function()} Function called to restore the original file system.
 */
var exports = module.exports = function(config) {
  mix(realFs, exports.fs(config));
  return function() {
    mix(realFs, originalFs);
  };
};


/**
 * Create a new fs module based on the given file system configuration.
 * @param {Object} config File system configuration.
 * @return {Object} A fs module with a mock file system.
 */
exports.fs = function(config) {
  var system = FileSystem.create(config);
  var binding = new Binding(system);

  // inject the mock binding
  var mockFs = rewire(path.join(__dirname, '..', 'node', fsName));
  mockFs.__set__('binding', binding);

  // overwrite fs.Stats from original binding
  mockFs.Stats = binding.Stats;

  // provide a method to reconfigure the file system
  mockFs._reconfigure = function(opt_config) {
    var newConfig = opt_config || config;
    var newSystem = FileSystem.create(newConfig);
    binding.setSystem(newSystem);
  };

  return mockFs;
};


/**
 * Initialize (or reinitialize) a file system.
 * @param {Object} fs A mock fs module.
 * @param {Object=} opt_config File system configuration.
 */
exports.init = function(fs, opt_config) {
  fs._reconfigure(opt_config);
};


/**
 * Create a file factory.
 */
exports.file = FileSystem.file;


/**
 * Create a directory factory.
 */
exports.directory = FileSystem.directory;


/**
 * Create a symbolic link factory.
 */
exports.symlink = FileSystem.symlink;
