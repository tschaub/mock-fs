const fs = require('fs');
const path = require('path');
const Binding = require('./binding.js');
const bypass = require('./bypass.js');
const {FSError} = require('./error.js');
const FileSystem = require('./filesystem.js');
const realBinding = process.binding('fs');
const loader = require('./loader.js');
const {
  getReadFileContextPrototype,
  patchReadFileContext,
} = require('./readfilecontext.js');

const realProcessProps = {
  cwd: process.cwd,
  chdir: process.chdir,
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
 * @param {string} key Property name.
 */
function patch(key) {
  const existingMethod = realBinding[key];
  realBinding[key] = function () {
    if (this._mockedBinding) {
      return this._mockedBinding[key].apply(this._mockedBinding, arguments);
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

const readFileContextPrototype = getReadFileContextPrototype();

patchReadFileContext(readFileContextPrototype);

function overrideBinding(binding) {
  realBinding._mockedBinding = binding;
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
  fs.createWriteStream = function (path, options) {
    const output = realCreateWriteStream(path, options);
    // disable _writev, this will over shadow WriteStream.prototype._writev
    if (realBinding._mockedBinding) {
      output._writev = undefined;
    }
    return output;
  };
}

function overrideReadFileContext(binding) {
  readFileContextPrototype._mockedBinding = binding;
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

function restoreReadFileContext(binding) {
  delete readFileContextPrototype._mockedBinding;
}

/**
 * Swap out the fs bindings for a mock file system.
 * @param {Object} config Mock file system configuration.
 * @param {Object} [options] Any filesystem options.
 * @param {boolean} options.createCwd Create a directory for `process.cwd()`
 *     (defaults to `true`).
 * @param {boolean} options.createTmp Create a directory for `os.tmpdir()`
 *     (defaults to `true`).
 */
module.exports = function mock(config, options = {}) {
  const system = FileSystem.create(config, options);
  const binding = new Binding(system);

  overrideBinding(binding);

  overrideReadFileContext(binding);

  let currentPath = process.cwd();
  overrideProcess(
    function cwd() {
      if (realBinding._mockedBinding) {
        return currentPath;
      }
      return realProcessProps.cwd();
    },
    function chdir(directory) {
      if (realBinding._mockedBinding) {
        if (!fs.statSync(path.toNamespacedPath(directory)).isDirectory()) {
          throw new FSError('ENOTDIR');
        }
        currentPath = path.resolve(currentPath, directory);
      } else {
        return realProcessProps.chdir(directory);
      }
    },
  );

  overrideCreateWriteStream();
};

exports = module.exports;

/**
 * Get hold of the mocked filesystem's 'root'
 * If fs hasn't currently been replaced, this will return an empty object
 * @return {Object} The mock root.
 */
exports.bypass = bypass;
exports.directory = FileSystem.directory;
exports.file = FileSystem.file;
exports.getMockRoot = function () {
  if (realBinding._mockedBinding) {
    return realBinding._mockedBinding.getSystem().getRoot();
  } else {
    return {};
  }
};

/**
 * Restore the fs bindings for the real file system.
 */
exports.load = loader.load;
exports.restore = function () {
  restoreBinding();
  restoreProcess();
  restoreCreateWriteStream();
  restoreReadFileContext();
};

/**
 * Create a file factory.
 */

/**
 * Create a directory factory.
 */

/**
 * Create a symbolic link factory.
 */
exports.symlink = FileSystem.symlink;

/**
 * Automatically maps specified paths (for use with `mock()`)
 */

/**
 * Perform action, bypassing mock FS
 * @example
 * // This file exists on the real FS, not on the mocked FS
 * const filePath = '/path/file.json';
 * const data = mock.bypass(() => fs.readFileSync(filePath, 'utf-8'));
 */
