const {fixWin32Permissions} = require('./item');
const path = require('path');
const fs = require('fs');

exports.createContext = ({output, options = {}, target}, newContext) =>
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

exports.addFile = function(context, stats, isRoot) {
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

exports.addDir = function(context, stats, isRoot) {
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
    const newContext = exports.createContext(context, {
      target: absPath,
      output: directoryItems
    });

    if (recursive && stats.isDirectory()) {
      exports.addDir(newContext, stats);
    } else if (stats.isFile()) {
      exports.addFile(newContext, stats);
    }
  });

  return output[outputPropKey];
};

exports.fixupPath = p => {
  if (typeof p !== 'string') {
    throw new TypeError(`Invalid path. All paths must be strings`);
  }
  return path.resolve(p);
};
