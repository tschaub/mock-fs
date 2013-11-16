var path = require('path');

var rewire = require('rewire');

var Binding = require('./binding').Binding;
var FileSystem = require('./filesystem');

// TODO: make this more robust
var minor = process.version.split('.').slice(0, 2).join('.');
var versions = {
  'v0.8': 'fs-0.8.26.js',
  'v0.10': 'fs-0.10.22.js'
};
var fsName = versions[minor] || versions['v.10'];


/**
 * Create a new fs module based on the given file system configuration.
 * @param {Object} config File system configuration.
 * @return {Object} A fs module with a mock file system.
 */
exports.fs = function(config) {
  var system = FileSystem.create(config);
  var binding = new Binding(system);
  var fs = rewire(path.join(__dirname, '..', 'node', fsName));
  fs.__set__('binding', binding);
  return fs;
};


/**
 * Create a file factory.
 */
exports.file = FileSystem.file;


/**
 * Create a directory factory.
 */
exports.directory = FileSystem.directory;
