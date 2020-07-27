'use strict';

const Binding = require('./binding');
const FSError = require('./error');
const FileSystem = require('./filesystem');
const realBinding = process.binding('fs');
const path = require('path');
const fs = require('fs');
const {permissions} = require('./item');

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
  const binding = process.binding('fs')._mockedBinding;
  delete process.binding('fs')._mockedBinding;

  // Perform action
  const res = fn();

  // Reactivate mocked bindings
  process.binding('fs')._mockedBinding = binding;

  return res;
};

/**
 * Populate a DirectoryItems object to use with mock() from a series of paths to files/directories
 */
exports.createDirectoryInfoFromPaths = function(paths, options) {
  return exports.bypass(() => {
    const res = {};

    /* Get options or apply defaults */
    let recursive = options && options.recursive;
    let lazyLoad = options && options.lazyLoad;
    if (recursive === undefined) {
      recursive = true;
    }
    if (lazyLoad === undefined) {
      lazyLoad = true;
    }

    if (Array.isArray(paths)) {
      paths.forEach(p => scan(p, true));
    } else {
      scan(paths, true);
    }

    return res;

    function scan(p, isRoot) {
      if (typeof p !== 'string') {
        throw new Error(
          `Must provide path or array of paths (as strings) to createDirectoryInfoFromPaths()`
        );
      }

      p = path.normalize(p);

      const stats = fs.statSync(p);
      if (stats.isFile()) {
        addFile(p, stats);
      } else if ((isRoot || recursive) && stats.isDirectory()) {
        const dirStats = Object.assign({}, stats);
        // On windows platforms, directories do not have the executable flag, which causes FileSystem.prototype.getItem
        // to think that the directory cannot be traversed. This is a workaround, however, a better solution may be to
        // re-think the logic in FileSystem.prototype.getItem
        // This workaround adds executable privileges if read privileges are found
        if (process.platform === 'win32') {
          // prettier-ignore
          dirStats.mode |=
            ((dirStats.mode & permissions.USER_READ) && permissions.USER_EXEC) |
            ((dirStats.mode & permissions.GROUP_READ) && permissions.GROUP_EXEC) |
            ((dirStats.mode & permissions.OTHER_READ) && permissions.OTHER_EXEC);
        }
        res[p] = exports.directory(dirStats);
        fs.readdirSync(p).forEach(subPath => scan(path.join(p, subPath)));
      }
    }

    function addFile(p, stats) {
      res[p] = () => {
        const content = lazyLoad
          ? exports.bypass(() => fs.readFileSync(p))
          : '';

        const file = exports.file(Object.assign({}, stats, {content}))();

        if (lazyLoad) {
          Object.defineProperty(file, '_content', {
            get() {
              const res = exports.bypass(() => fs.readFileSync(p));
              Object.defineProperty(file, '_content', {
                value: res,
                writable: true
              });
              return res;
            },
            set(data) {
              Object.defineProperty(file, '_content', {
                value: data,
                writable: true
              });
            },
            configurable: true
          });
        }

        return file;
      };
    }
  });
};
