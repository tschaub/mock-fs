var path = require('path');

var rewire = require('rewire');

var Binding = require('./binding').Binding;
var FileSystem = require('./filesystem');


/**
 * Create a new fs module based on the given file system configuration.
 * @param {Object} config File system configuration.
 * @return {Object} A fs module with a mock file system.
 */
exports.fs = function(config) {
  var system = FileSystem.create(config);
  var binding = new Binding(system);
  var fs = rewire(path.join(__dirname, '..', 'node', 'fs-0.10.22.js'));
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
