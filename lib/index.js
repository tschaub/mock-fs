'use strict';

const Binding = require('./binding');
const FSError = require('./error');
const FileSystem = require('./filesystem');
const realBinding = process.binding('fs');
const path = require('path');
const fs = require('fs');

const toNamespacedPath = FileSystem.toNamespacedPath;

const realProcessProps = {
  cwd: process.cwd,
  chdir: process.chdir
};
const realCreateWriteStream = fs.createWriteStream;
const realStats = realBinding.Stats;
const realStatWatcher = realBinding.StatWatcher;

/**
 * Pre-patch fs binding.
 * This allows mock-fs to work properly under nodejs v10+ readFile
 * As ReadFileContext nodejs v10+ implementation traps original binding methods:
 * const { FSReqWrap, close, read } = process.binding('fs');
 * Note this patch only solves issue for readFile, as the require of
 * ReadFileContext is delayed by readFile implementation.
 * if (!ReadFileContext) ReadFileContext = require('internal/fs/read_file_context')
 *
 * @param {string} key Property name.
 */
function patch(key) {
  const existingMethod = realBinding[key];
  realBinding[key] = function() {
    if (this._mockedBinding) {
      return this._mockedBinding[key].apply(this, arguments);
    } else {
      return existingMethod.apply(this, arguments);
    }
  }.bind(realBinding);
}

for (const key in Binding.prototype) {
  if (typeof realBinding[key] === 'function') {
    // Stats and StatWatcher are constructors
    if (key !== 'Stats' && key !== 'StatWatcher') {
      patch(key);
    }
  }
}

function overrideBinding(binding) {
  realBinding._mockedBinding = binding;

  for (const key in binding) {
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

/**
 * Have to disable write stream _writev on nodejs v10+.
 *
 * nodejs v8 lib/fs.js
 * note binding.writeBuffers will use mock-fs patched writeBuffers.
 *
 *   const binding = process.binding('fs');
 *   function writev(fd, chunks, position, callback) {
 *     // ...
 *     binding.writeBuffers(fd, chunks, position, req);
 *   }
 *
 * nodejs v10+ lib/internal/fs/streams.js
 * note it uses original writeBuffers, bypassed mock-fs patched writeBuffers.
 *
 *  const {writeBuffers} = internalBinding('fs');
 *  function writev(fd, chunks, position, callback) {
 *    // ...
 *    writeBuffers(fd, chunks, position, req);
 *  }
 *
 * Luckily _writev is an optional method on Writeable stream implementation.
 * When _writev is missing, it will fall back to make multiple _write calls.
 */
function overrideCreateWriteStream() {
  fs.createWriteStream = function(path, options) {
    const output = realCreateWriteStream(path, options);
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
  for (const key in realProcessProps) {
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
exports = module.exports = function mock(config, options) {
  const system = FileSystem.create(config, options);
  const binding = new Binding(system);

  overrideBinding(binding);

  let currentPath = process.cwd();
  overrideProcess(
    function cwd() {
      return currentPath;
    },
    function chdir(directory) {
      if (!binding.stat(toNamespacedPath(directory)).isDirectory()) {
        throw new FSError('ENOTDIR');
      }
      currentPath = path.resolve(currentPath, directory);
    }
  );

  overrideCreateWriteStream();
};

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

let storedBinding;

/**
 * Temporarily disable Mocked FS
 */
exports.disable = () => {
  storedBinding = realBinding._mockedBinding;
  delete realBinding._mockedBinding;
};

/**
 * Enables Mocked FS after being disabled by mock.disable()
 */
exports.enable = () => {
  if (storedBinding) {
    realBinding._mockedBinding = storedBinding;
    storedBinding = undefined;
  }
};

/**
 * Perform action, bypassing mock FS
 * @example
 * // This file exists on the real FS, not on the mocked FS
 * const filePath = '/path/file.json';
 * const data = mock.bypass(() => fs.readFileSync(filePath, 'utf-8'));
 */
exports.bypass = function(fn) {
  if (typeof fn !== 'function') {
    throw new Error(`Must provide a function to perform for mock.bypass()`);
  }

  // Deactivate mocked bindings
  exports.disable();
  delete realBinding._mockedBinding;

  let res;
  try {
    res = fn(); // Perform action
  } finally {
    exports.enable();
  }

  if (res.then) {
    // eslint-disable-next-line no-console
    console.warn(
      `Async functions are not supported with exports.bypass(). See https://github.com/tschaub/mock-fs/#advancedbypass`
    );
  }

  return res;
};

const mapping = require('./mapping');

/**
 * Automatically maps specified paths (for use with `mock()`)
 */
exports.mapPaths = function(paths, options) {
  return exports.bypass(() => {
    const res = {};
    const context = mapping.createContext({output: res, options});

    const addPath = p => {
      const absPath = mapping.fixupPath(p);
      const stats = fs.statSync(absPath);
      const newContext = mapping.createContext(context, {target: absPath});

      if (stats.isDirectory()) {
        mapping.addDir(newContext, stats, true);
      } else if (stats.isFile()) {
        mapping.addFile(newContext, stats, true);
      }
    };

    if (Array.isArray(paths)) {
      paths.forEach(addPath);
    } else {
      addPath(paths);
    }

    return res;
  });
};

/**
 * Maps specific directory (for use with `mock()`)
 */
exports.mapDir = function(dir, options) {
  return exports.bypass(() => {
    dir = mapping.fixupPath(dir);

    return mapping.addDir(
      mapping.createContext({output: {}, options, target: dir}),
      fs.statSync(dir),
      true
    );
  });
};

/**
 * Maps specific file (for use with `mock()`)
 */
exports.mapFile = function(file, options) {
  return exports.bypass(() => {
    file = mapping.fixupPath(file);

    return mapping.addFile(
      mapping.createContext({output: {}, options, target: file}),
      fs.statSync(file),
      true
    );
  });
};
