const {fixWin32Permissions} = require('./item');
const path = require('path');
const FileSystem = require('./filesystem');
const fs = require('fs');
const bypass = require('./bypass');

const createContext = ({output, options = {}, target}, newContext) =>
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

function addFile(context, stats, isRoot) {
  const {output, target} = context;
  const {lazyLoad} = context.options;

  if (!stats.isFile()) {
    throw new Error(`${target} is not a valid file!`);
  }

  const outputPropKey = isRoot ? target : path.win32.basename(target);

  output[outputPropKey] = () => {
    const content = !lazyLoad ? fs.readFileSync(target) : '';
    const file = FileSystem.file(Object.assign({}, stats, {content}))();

    if (lazyLoad) {
      Object.defineProperty(file, '_content', {
        get() {
          const res = bypass(() => fs.readFileSync(target));
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
}

function addDir(context, stats, isRoot) {
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
  output[outputPropKey] = FileSystem.directory(
    Object.assign(stats, {items: directoryItems})
  );

  fs.readdirSync(target).forEach(p => {
    const absPath = path.join(target, p);
    const stats = fs.statSync(absPath);
    const newContext = createContext(context, {
      target: absPath,
      output: directoryItems
    });

    if (recursive && stats.isDirectory()) {
      addDir(newContext, stats);
    } else if (stats.isFile()) {
      addFile(newContext, stats);
    }
  });

  return output[outputPropKey];
}

const fixupPath = p => {
  if (typeof p !== 'string') {
    throw new TypeError(`Invalid path. All paths must be strings`);
  }
  return path.resolve(p);
};

/**
 * Automatically maps specified paths (for use with `mock()`)
 */
exports.mapPaths = function(paths, options) {
  return bypass(() => {
    const res = {};
    const context = createContext({output: res, options});

    const addPath = p => {
      const absPath = fixupPath(p);
      const stats = fs.statSync(absPath);
      const newContext = createContext(context, {target: absPath});

      if (stats.isDirectory()) {
        addDir(newContext, stats, true);
      } else if (stats.isFile()) {
        addFile(newContext, stats, true);
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
  return bypass(() => {
    dir = fixupPath(dir);

    return addDir(
      createContext({output: {}, options, target: dir}),
      fs.statSync(dir),
      true
    );
  });
};

/**
 * Maps specific file (for use with `mock()`)
 */
exports.mapFile = function(file, options) {
  return bypass(() => {
    file = fixupPath(file);

    return addFile(
      createContext({output: {}, options, target: file}),
      fs.statSync(file),
      true
    );
  });
};
