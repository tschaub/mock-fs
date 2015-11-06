'use strict';

var realFs = require('fs');
var path = require('path');

var rewire = require('rewire');
var semver = require('semver');

var Binding = require('./binding');
var FileSystem = require('./filesystem');
var FSError = require('./error');

var versions = {
  '0.8.x': 'fs-0.8.26.js',
  '0.9.x': 'fs-0.9.12.js',
  '0.10.x': 'fs-0.10.28.js',
  '0.11 - 0.11.14': 'fs-0.11.13.js',
  '0.11.15 - 0.12.x': 'fs-0.12.0.js',
  '1.x.x': 'fs-1.1.0.js',
  '2.x.x': 'fs-2.0.0.js',
  '3.x.x': 'fs-3.0.0.js',
  '4.x.x': 'fs-4.0.0.js'
};
var nodeVersion = process.versions.node;
var fsName;

Object.keys(versions).forEach(function(version) {
  if (semver.satisfies(nodeVersion, version)) {
    fsName = versions[version];
    return false;
  }
});

if (!fsName) {
  throw new Error('Unsupported Node version: ' + nodeVersion);
}


/**
 * Hijack the real fs module immediately so the binding can be swapped at will.
 * This works as expected in cases where mock-fs is required before any other
 * module that wraps fs exports.
 */
var mockFs = rewire(path.join(__dirname, '..', 'node', fsName));
var originalBinding = mockFs.__get__('binding');
var originalStats = mockFs.Stats;
for (var name in mockFs) {
  var descriptor = Object.getOwnPropertyDescriptor(realFs, name);

  if (!descriptor || descriptor && descriptor.writable) {
    realFs[name] = mockFs[name];
  }
}
var originalProcess = {
  cwd: process.cwd,
  chdir: process.chdir
};

function setBinding(binding, Stats) {
  mockFs.__set__('binding', binding);
  mockFs.Stats = realFs.Stats = Stats;
}

function setProcess(cwd, chdir) {
  process.cwd = cwd;
  process.chdir = chdir;
}


/**
 * Swap out the fs bindings for a mock file system.
 * @param {Object} config Mock file system configuration.
 */
var exports = module.exports = function mock(config) {
  var system = FileSystem.create(config);
  var binding = new Binding(system);
  setBinding(binding, binding.Stats);

  var currentPath = process.cwd();
  setProcess(
    function cwd() {
      return currentPath;
    },
    function chdir(directory) {
      if (!mockFs.statSync(directory).isDirectory()) {
        throw new FSError('ENOTDIR');
      }
      currentPath = path.resolve(currentPath, directory);
    }
  );
};


/**
 * Restore the fs bindings for the real file system.
 */
exports.restore = function() {
  setBinding(originalBinding, originalStats);
  setProcess(originalProcess.cwd, originalProcess.chdir);
};


/**
 * Create a mock fs module based on the given file system configuration.
 * @param {Object} config File system configuration.
 * @return {Object} A fs module with a mock file system.
 */
exports.fs = function(config) {
  var system = FileSystem.create(config);
  var binding = new Binding(system);

  // inject the mock binding
  var newMockFs = rewire(path.join(__dirname, '..', 'node', fsName));
  newMockFs.__set__('binding', binding);

  // overwrite fs.Stats from original binding
  newMockFs.Stats = binding.Stats;

  return newMockFs;
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
