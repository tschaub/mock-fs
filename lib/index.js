'use strict';

const Binding = require('./binding');
const FSError = require('./error');
const FileSystem = require('./filesystem');
const realBinding = process.binding('fs');
const path = require('path');
const fs = require('fs');
const {fixWin32Permissions} = require('./item');

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
  const binding = realBinding._mockedBinding;
  delete realBinding._mockedBinding;

  let res;
  try {
    // Perform action
    res = fn();
  } finally {
    // Reactivate mocked bindings
    realBinding._mockedBinding = binding;
  }

  return res;
};

/* ****************************************************************************************************************** *
 * Mapping
 * ****************************************************************************************************************** */

const mapping = {};

mapping.createContext = ({output, options = {}, target}, newContext) =>
  Object.assign(
    {
      // Assign options and set defaults if needed
      options: {
        recursive: options.recursive !== false,
        lazyLoad: options.lazyLoad !== false
      },
      output,
      target
    },
    newContext
  );

mapping.addFile = function(context, stats, isRoot) {
  const {output, target} = context;
  const {lazyLoad} = context.options;

  if (!stats.isFile()) {
    throw new Error(`${target} is not a valid file!`);
  }

  const outputPropKey = isRoot ? target : path.win32.basename(target);

  output[outputPropKey] = () => {
    const content = !lazyLoad ? fs.readFileSync(target) : '';
    const file = exports.file(Object.assign({}, stats, {content}))();

    if (lazyLoad) {
      Object.defineProperty(file, '_content', {
        get() {
          const res = exports.bypass(() => fs.readFileSync(target));
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

  return output[outputPropKey];
};

mapping.addDir = function(context, stats, isRoot) {
  const {target, output} = context;
  const {recursive} = context.options;

  if (!stats.isDirectory()) {
    throw new Error(`${target} is not a valid directory!`);
  }

  stats = Object.assign({}, stats);
  const outputPropKey = isRoot ? target : path.win32.basename(target);

  // On windows platforms, directories do not have the executable flag, which causes FileSystem.prototype.getItem
  // to think that the directory cannot be traversed. This is a workaround, however, a better solution may be to
  // re-think the logic in FileSystem.prototype.getItem
  // This workaround adds executable privileges if read privileges are found
  stats.mode = fixWin32Permissions(stats.mode);

  // Create directory factory
  const directoryItems = {};
  output[outputPropKey] = exports.directory(
    Object.assign(stats, {items: directoryItems})
  );

  fs.readdirSync(target).forEach(p => {
    const absPath = path.join(target, p);
    const stats = fs.statSync(absPath);
    const newContext = mapping.createContext(context, {
      target: absPath,
      output: directoryItems
    });

    if (recursive && stats.isDirectory()) {
      mapping.addDir(newContext, stats);
    } else if (stats.isFile()) {
      mapping.addFile(newContext, stats);
    }
  });

  return output[outputPropKey];
};

mapping.fixupPath = p => {
  if (typeof p !== 'string') {
    throw new TypeError(`Invalid path. All paths must be strings`);
  }
  return path.resolve(p);
};

/* ********************************************************* *
 * Exported Methods
 * ********************************************************* */

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
