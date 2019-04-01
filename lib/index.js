'use strict';

var Binding = require('./binding');
var FSError = require('./error');
var FileSystem = require('./filesystem');
var realBinding = process.binding('fs');
var path = require('path');
var fs = require('fs');

var realProcessProps = {
  cwd: process.cwd,
  chdir: process.chdir
};
var realCreateWriteStream = fs.createWriteStream;
var realStats = realBinding.Stats;
var realStatWatcher = realBinding.StatWatcher;

// Pre-patch fs binding
//
// This allows mock-fs to work properly under nodejs v10+ readFile
// As ReadFileContext nodejs v10+ implementation traps original binding methods:
// const { FSReqWrap, close, read } = process.binding('fs');
// Note this patch only solves issue for readFile, as the require of
// ReadFileContext is delayed by readFile implementation.
// if (!ReadFileContext) ReadFileContext = require('internal/fs/read_file_context')
function _patch(key) {
  var existingMethod = realBinding[key];
  realBinding[key] = function() {
    if (this._mockedBinding) {
      return this._mockedBinding[key].apply(this, arguments);
    } else {
      return existingMethod.apply(this, arguments);
    }
  }.bind(realBinding);
}

for (var key in Binding.prototype) {
  if (typeof realBinding[key] === 'function') {
    // Stats and StatWatcher are constructors
    if (key !== 'Stats' && key !== 'StatWatcher') {
      _patch(key);
    }
  }
}

function overrideBinding(binding) {
  realBinding._mockedBinding = binding;

  for (var key in binding) {
    if (typeof realBinding[key] === 'function') {
      // Stats and StatWatcher are constructors
      if (key === 'Stats' || key === 'StatWatcher') {
        realBinding[key] = binding[key];
      }
    } else if (typeof realBinding[key] === 'undefined') {
      realBinding[key] = binding[key];
    }
  }
}

function overrideProcess(cwd, chdir) {
  process.cwd = cwd;
  process.chdir = chdir;
}

// Have to disable write stream _writev on nodejs v10+.
//
// nodejs v8 lib/fs.js
// note binding.writeBuffers will use mock-fs patched writeBuffers.
//
//   const binding = process.binding('fs');
//   function writev(fd, chunks, position, callback) {
//     // ...
//     binding.writeBuffers(fd, chunks, position, req);
//   }
//
// nodejs v10+ lib/internal/fs/streams.js
// note it uses original writeBuffers, bypassed mock-fs patched writeBuffers.
//
//  const {writeBuffers} = internalBinding('fs');
//  function writev(fd, chunks, position, callback) {
//    // ...
//    writeBuffers(fd, chunks, position, req);
//  }
//
// Luckily _writev is an optional method on Writeable stream implementation.
// When _writev is missing, it will fall back to make multiple _write calls.

function overrideCreateWriteStream() {
  fs.createWriteStream = function(path, options) {
    var output = realCreateWriteStream(path, options);
    // disable _writev, this will over shadow WriteStream.prototype._writev
    output._writev = undefined;
    return output;
  };
}

function restoreBinding() {
  delete realBinding._mockedBinding;
  realBinding.Stats = realStats;
  realBinding.StatWatcher = realStatWatcher;
}

function restoreProcess() {
  for (var key in realProcessProps) {
    process[key] = realProcessProps[key];
  }
}

function restoreCreateWriteStream() {
  fs.createWriteStream = realCreateWriteStream;
}

/**
 * Swap out the fs bindings for a mock file system.
 * @param {Object} config Mock file system configuration.
 * @param {Object} options Any filesystem options.
 * @param {boolean} options.createCwd Create a directory for `process.cwd()`
 *     (defaults to `true`).
 * @param {boolean} options.createTmp Create a directory for `os.tmpdir()`
 *     (defaults to `true`).
 */
var exports = (module.exports = function mock(config, options) {
  var system = FileSystem.create(config, options);
  var binding = new Binding(system);

  overrideBinding(binding);

  var currentPath = process.cwd();
  overrideProcess(
    function cwd() {
      return currentPath;
    },
    function chdir(directory) {
      if (!binding.stat(path._makeLong(directory)).isDirectory()) {
        throw new FSError('ENOTDIR');
      }
      currentPath = path.resolve(currentPath, directory);
    }
  );

  overrideCreateWriteStream();
});

/**
 * Get hold of the mocked filesystem's 'root'
 * If fs hasn't currently been replaced, this will return an empty object
 */
exports.getMockRoot = function() {
  if (realBinding._mockedBinding) {
    return realBinding.getSystem().getRoot();
  } else {
    return {};
  }
};

/**
 * Restore the fs bindings for the real file system.
 */
exports.restore = function() {
  restoreBinding();
  restoreProcess();
  restoreCreateWriteStream();
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
