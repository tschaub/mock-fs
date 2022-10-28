'use strict';

const path = require('path');
const File = require('./file.js');
const FileDescriptor = require('./descriptor.js');
const Directory = require('./directory.js');
const SymbolicLink = require('./symlink.js');
const {FSError} = require('./error.js');
const constants = require('constants');
const {getPathParts, getRealPath} = require('./filesystem.js');

const MODE_TO_KTYPE = {
  [constants.S_IFREG]: constants.UV_DIRENT_FILE,
  [constants.S_IFDIR]: constants.UV_DIRENT_DIR,
  [constants.S_IFBLK]: constants.UV_DIRENT_BLOCK,
  [constants.S_IFCHR]: constants.UV_DIRENT_CHAR,
  [constants.S_IFLNK]: constants.UV_DIRENT_LINK,
  [constants.S_IFIFO]: constants.UV_DIRENT_FIFO,
  [constants.S_IFSOCK]: constants.UV_DIRENT_SOCKET,
};

/** Workaround for optimizations in node 8+ */
const fsBinding = process.binding('fs');
const kUsePromises = fsBinding.kUsePromises;
let statValues;
let bigintStatValues;
if (fsBinding.statValues) {
  statValues = fsBinding.statValues; // node 10+
  bigintStatValues = fsBinding.bigintStatValues;
}

const MAX_LINKS = 50;

/**
 * Call the provided function and either return the result or call the callback
 * with it (depending on if a callback is provided).
 * @param {function()} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @param {object} thisArg This argument for the following function.
 * @param {function()} func Function to call.
 * @return {*} Return (if callback is not provided).
 */
function maybeCallback(callback, ctx, thisArg, func) {
  let err = null;
  let val;

  if (kUsePromises && callback === kUsePromises) {
    // support nodejs v10+ fs.promises
    try {
      val = func.call(thisArg);
    } catch (e) {
      err = e;
    }
    return new Promise(function (resolve, reject) {
      process.nextTick(function () {
        if (err) {
          reject(err);
        } else {
          resolve(val);
        }
      });
    });
  } else if (callback && typeof callback === 'function') {
    try {
      val = func.call(thisArg);
    } catch (e) {
      err = e;
    }
    process.nextTick(function () {
      if (val === undefined) {
        callback(err);
      } else {
        callback(err, val);
      }
    });
  } else if (ctx && typeof ctx === 'object') {
    try {
      return func.call(thisArg);
    } catch (e) {
      // default to errno for UNKNOWN
      ctx.code = e.code || 'UNKNOWN';
      ctx.errno = e.errno || FSError.codes.UNKNOWN.errno;
    }
  } else {
    return func.call(thisArg);
  }
}

/**
 * set syscall property on context object, only for nodejs v10+.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @param {string} syscall Name of syscall.
 */
function markSyscall(ctx, syscall) {
  if (ctx && typeof ctx === 'object') {
    ctx.syscall = syscall;
  }
}

/**
 * Handle FSReqWrap oncomplete.
 * @param {Function} callback The callback.
 * @return {Function} The normalized callback.
 */
function normalizeCallback(callback) {
  if (callback && typeof callback.oncomplete === 'function') {
    // Unpack callback from FSReqWrap
    callback = callback.oncomplete.bind(callback);
  }
  return callback;
}

function getDirentType(mode) {
  const ktype = MODE_TO_KTYPE[mode & constants.S_IFMT];

  if (ktype === undefined) {
    return constants.UV_DIRENT_UNKNOWN;
  }

  return ktype;
}

function notImplemented() {
  throw new Error('Method not implemented');
}

function deBuffer(p) {
  return Buffer.isBuffer(p) ? p.toString() : p;
}

/**
 * Create a new binding with the given file system.
 * @param {FileSystem} system Mock file system.
 * @class
 */
function Binding(system) {
  /**
   * Mock file system.
   * @type {FileSystem}
   */
  this._system = system;

  /**
   * Lookup of open files.
   * @type {Object<number, FileDescriptor>}
   */
  this._openFiles = {};

  /**
   * Counter for file descriptors.
   * @type {number}
   */
  this._counter = -1;

  const stdin = new FileDescriptor(constants.O_RDWR);
  stdin.setItem(new File.StandardInput());
  this.trackDescriptor(stdin);

  const stdout = new FileDescriptor(constants.O_RDWR);
  stdout.setItem(new File.StandardOutput());
  this.trackDescriptor(stdout);

  const stderr = new FileDescriptor(constants.O_RDWR);
  stderr.setItem(new File.StandardError());
  this.trackDescriptor(stderr);
}

/**
 * Get the file system underlying this binding.
 * @return {FileSystem} The underlying file system.
 */
Binding.prototype.getSystem = function () {
  return this._system;
};

/**
 * Reset the file system underlying this binding.
 * @param {FileSystem} system The new file system.
 */
Binding.prototype.setSystem = function (system) {
  this._system = system;
};

/**
 * Get a file descriptor.
 * @param {number} fd File descriptor identifier.
 * @return {FileDescriptor} File descriptor.
 */
Binding.prototype.getDescriptorById = function (fd) {
  if (!this._openFiles.hasOwnProperty(fd)) {
    throw new FSError('EBADF');
  }
  return this._openFiles[fd];
};

/**
 * Keep track of a file descriptor as open.
 * @param {FileDescriptor} descriptor The file descriptor.
 * @return {number} Identifier for file descriptor.
 */
Binding.prototype.trackDescriptor = function (descriptor) {
  const fd = ++this._counter;
  this._openFiles[fd] = descriptor;
  return fd;
};

/**
 * Stop tracking a file descriptor as open.
 * @param {number} fd Identifier for file descriptor.
 */
Binding.prototype.untrackDescriptorById = function (fd) {
  if (!this._openFiles.hasOwnProperty(fd)) {
    throw new FSError('EBADF');
  }
  delete this._openFiles[fd];
};

/**
 * Resolve the canonicalized absolute pathname.
 * @param {string|Buffer} filepath The file path.
 * @param {string} encoding The encoding for the return.
 * @param {Function} callback The callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {string|Buffer} The real path.
 */
Binding.prototype.realpath = function (filepath, encoding, callback, ctx) {
  markSyscall(ctx, 'realpath');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    let realPath;
    filepath = deBuffer(filepath);
    const resolved = path.resolve(filepath);
    const parts = getPathParts(resolved);
    let item = this._system.getRoot();
    let itemPath = '/';
    let name, i, ii;
    for (i = 0, ii = parts.length; i < ii; ++i) {
      name = parts[i];
      while (item instanceof SymbolicLink) {
        itemPath = path.resolve(path.dirname(itemPath), item.getPath());
        item = this._system.getItem(itemPath);
      }
      if (!item) {
        throw new FSError('ENOENT', filepath);
      }
      if (item instanceof Directory) {
        itemPath = path.resolve(itemPath, name);
        item = item.getItem(name);
      } else {
        throw new FSError('ENOTDIR', filepath);
      }
    }
    if (item) {
      while (item instanceof SymbolicLink) {
        itemPath = path.resolve(path.dirname(itemPath), item.getPath());
        item = this._system.getItem(itemPath);
      }
      realPath = itemPath;
    } else {
      throw new FSError('ENOENT', filepath);
    }

    // Remove win32 file namespace prefix \\?\
    realPath = getRealPath(realPath);

    if (encoding === 'buffer') {
      realPath = Buffer.from(realPath);
    }

    return realPath;
  });
};

function fillStats(stats, bigint) {
  const target = bigint ? bigintStatValues : statValues;
  for (let i = 0; i < 36; i++) {
    target[i] = stats[i];
  }
}

/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {boolean} bigint Use BigInt.
 * @param {function(Error, Float64Array|BigUint64Array)} callback Callback (optional).
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {Float64Array|BigUint64Array|undefined} Stats or undefined (if sync).
 */
Binding.prototype.stat = function (filepath, bigint, callback, ctx) {
  markSyscall(ctx, 'stat');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    filepath = deBuffer(filepath);
    let item = this._system.getItem(filepath);
    if (item instanceof SymbolicLink) {
      item = this._system.getItem(
        path.resolve(path.dirname(filepath), item.getPath())
      );
    }
    if (!item) {
      throw new FSError('ENOENT', filepath);
    }
    const stats = item.getStats(bigint);
    fillStats(stats, bigint);
    return stats;
  });
};

/**
 * Stat an item.
 * @param {number} fd File descriptor.
 * @param {boolean} bigint Use BigInt.
 * @param {function(Error, Float64Array|BigUint64Array)} callback Callback (optional).
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {Float64Array|BigUint64Array|undefined} Stats or undefined (if sync).
 */
Binding.prototype.fstat = function (fd, bigint, callback, ctx) {
  markSyscall(ctx, 'fstat');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    const descriptor = this.getDescriptorById(fd);
    const item = descriptor.getItem();
    const stats = item.getStats(bigint);
    fillStats(stats, bigint);
    return stats;
  });
};

/**
 * Close a file descriptor.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Callback (optional).
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback.
 */
Binding.prototype.close = function (fd, callback, ctx) {
  markSyscall(ctx, 'close');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    this.untrackDescriptorById(fd);
  });
};

/**
 * Open and possibly create a file.
 * @param {string} pathname File path.
 * @param {number} flags Flags.
 * @param {number} mode Mode.
 * @param {function(Error, string)} callback Callback (optional).
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {string} File descriptor (if sync).
 */
Binding.prototype.open = function (pathname, flags, mode, callback, ctx) {
  markSyscall(ctx, 'open');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    pathname = deBuffer(pathname);
    const descriptor = new FileDescriptor(flags);
    let item = this._system.getItem(pathname);
    while (item instanceof SymbolicLink) {
      item = this._system.getItem(
        path.resolve(path.dirname(pathname), item.getPath())
      );
    }
    if (descriptor.isExclusive() && item) {
      throw new FSError('EEXIST', pathname);
    }
    if (descriptor.isCreate() && !item) {
      const parent = this._system.getItem(path.dirname(pathname));
      if (!parent) {
        throw new FSError('ENOENT', pathname);
      }
      if (!(parent instanceof Directory)) {
        throw new FSError('ENOTDIR', pathname);
      }
      item = new File();
      if (mode) {
        item.setMode(mode);
      }
      parent.addItem(path.basename(pathname), item);
    }
    if (descriptor.isRead()) {
      if (!item) {
        throw new FSError('ENOENT', pathname);
      }
      if (!item.canRead()) {
        throw new FSError('EACCES', pathname);
      }
    }
    if (descriptor.isWrite() && !item.canWrite()) {
      throw new FSError('EACCES', pathname);
    }
    if (
      item instanceof Directory &&
      (descriptor.isTruncate() || descriptor.isAppend())
    ) {
      throw new FSError('EISDIR', pathname);
    }
    if (descriptor.isTruncate()) {
      if (!(item instanceof File)) {
        throw new FSError('EBADF');
      }
      item.setContent('');
    }
    if (descriptor.isTruncate() || descriptor.isAppend()) {
      descriptor.setPosition(item.getContent().length);
    }
    descriptor.setItem(item);
    return this.trackDescriptor(descriptor);
  });
};

/**
 * Open a file handler. A new api in nodejs v10+ for fs.promises
 * @param {string} pathname File path.
 * @param {number} flags Flags.
 * @param {number} mode Mode.
 * @param {Function} callback Callback (optional), expecting kUsePromises in nodejs v10+.
 * @return {string} The file handle.
 */
Binding.prototype.openFileHandle = function (pathname, flags, mode, callback) {
  const self = this;

  return this.open(pathname, flags, mode, kUsePromises).then(function (fd) {
    // nodejs v10+ fs.promises FileHandler constructor only ask these three properties.
    return {
      getAsyncId: notImplemented,
      fd: fd,
      close: function () {
        return self.close(fd, kUsePromises);
      },
    };
  });
};

/**
 * Read from a file descriptor.
 * @param {string} fd File descriptor.
 * @param {Buffer} buffer Buffer that the contents will be written to.
 * @param {number} offset Offset in the buffer to start writing to.
 * @param {number} length Number of bytes to read.
 * @param {?number} position Where to begin reading in the file.  If null,
 *     data will be read from the current file position.
 * @param {function(Error, number, Buffer)} callback Callback (optional) called
 *     with any error, number of bytes read, and the buffer.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {number} Number of bytes read (if sync).
 */
Binding.prototype.read = function (
  fd,
  buffer,
  offset,
  length,
  position,
  callback,
  ctx
) {
  markSyscall(ctx, 'read');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    const descriptor = this.getDescriptorById(fd);
    if (!descriptor.isRead()) {
      throw new FSError('EBADF');
    }
    const file = descriptor.getItem();
    if (file instanceof Directory) {
      throw new FSError('EISDIR');
    }
    if (!(file instanceof File)) {
      // deleted or not a regular file
      throw new FSError('EBADF');
    }
    if (typeof position !== 'number' || position < 0) {
      position = descriptor.getPosition();
    }
    const content = file.getContent();
    const start = Math.min(position, content.length);
    const end = Math.min(position + length, content.length);
    const read = start < end ? content.copy(buffer, offset, start, end) : 0;
    descriptor.setPosition(position + read);
    return read;
  });
};

/**
 * Write to a file descriptor given a buffer.
 * @param {string} src Source file.
 * @param {string} dest Destination file.
 * @param {number} flags Modifiers for copy operation.
 * @param {function(Error)} callback Callback (optional) called
 *     with any error.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.copyFile = function (src, dest, flags, callback, ctx) {
  markSyscall(ctx, 'copyfile');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    src = deBuffer(src);
    dest = deBuffer(dest);
    const srcFd = this.open(src, constants.O_RDONLY);

    try {
      const srcDescriptor = this.getDescriptorById(srcFd);
      if (!srcDescriptor.isRead()) {
        throw new FSError('EBADF');
      }
      const srcFile = srcDescriptor.getItem();
      if (!(srcFile instanceof File)) {
        throw new FSError('EBADF');
      }
      const srcContent = srcFile.getContent();

      let destFlags =
        constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC;

      if ((flags & constants.COPYFILE_EXCL) === constants.COPYFILE_EXCL) {
        destFlags |= constants.O_EXCL;
      }

      const destFd = this.open(dest, destFlags);

      try {
        this.writeBuffer(destFd, srcContent, 0, srcContent.length, 0);
      } finally {
        this.close(destFd);
      }
    } finally {
      this.close(srcFd);
    }
  });
};

/**
 * Write to a file descriptor given a buffer.
 * @param {string} fd File descriptor.
 * @param {Array<Buffer>} buffers Array of buffers with contents to write.
 * @param {?number} position Where to begin writing in the file.  If null,
 *     data will be written to the current file position.
 * @param {function(Error, number, Buffer)} callback Callback (optional) called
 *     with any error, number of bytes written, and the buffer.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {number} Number of bytes written (if sync).
 */
Binding.prototype.writeBuffers = function (
  fd,
  buffers,
  position,
  callback,
  ctx
) {
  markSyscall(ctx, 'write');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    const descriptor = this.getDescriptorById(fd);
    if (!descriptor.isWrite()) {
      throw new FSError('EBADF');
    }
    const file = descriptor.getItem();
    if (!(file instanceof File)) {
      // not a regular file
      throw new FSError('EBADF');
    }
    if (typeof position !== 'number' || position < 0) {
      position = descriptor.getPosition();
    }
    let content = file.getContent();
    const newContent = Buffer.concat(buffers);
    const newLength = position + newContent.length;
    if (content.length < newLength) {
      const tempContent = Buffer.alloc(newLength);
      content.copy(tempContent);
      content = tempContent;
    }
    const written = newContent.copy(content, position);
    file.setContent(content);
    descriptor.setPosition(newLength);
    return written;
  });
};

/**
 * Write to a file descriptor given a buffer.
 * @param {string} fd File descriptor.
 * @param {Buffer} buffer Buffer with contents to write.
 * @param {number} offset Offset in the buffer to start writing from.
 * @param {number} length Number of bytes to write.
 * @param {?number} position Where to begin writing in the file.  If null,
 *     data will be written to the current file position.
 * @param {function(Error, number, Buffer)} callback Callback (optional) called
 *     with any error, number of bytes written, and the buffer.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {number} Number of bytes written (if sync).
 */
Binding.prototype.writeBuffer = function (
  fd,
  buffer,
  offset,
  length,
  position,
  callback,
  ctx
) {
  markSyscall(ctx, 'write');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    const descriptor = this.getDescriptorById(fd);
    if (!descriptor.isWrite()) {
      throw new FSError('EBADF');
    }
    const file = descriptor.getItem();
    if (!(file instanceof File)) {
      // not a regular file
      throw new FSError('EBADF');
    }
    if (typeof position !== 'number' || position < 0) {
      position = descriptor.getPosition();
    }
    let content = file.getContent();
    const newLength = position + length;
    if (content.length < newLength) {
      const newContent = Buffer.alloc(newLength);
      content.copy(newContent);
      content = newContent;
    }
    const sourceEnd = Math.min(offset + length, buffer.length);
    const written = Buffer.from(buffer).copy(
      content,
      position,
      offset,
      sourceEnd
    );
    file.setContent(content);
    descriptor.setPosition(newLength);
    return written;
  });
};

/**
 * Write to a file descriptor given a string.
 * @param {string} fd File descriptor.
 * @param {string} string String with contents to write.
 * @param {number} position Where to begin writing in the file.  If null,
 *     data will be written to the current file position.
 * @param {string} encoding String encoding.
 * @param {function(Error, number, string)} callback Callback (optional) called
 *     with any error, number of bytes written, and the string.
 * @param {object} ctx The context.
 * @return {number} Number of bytes written (if sync).
 */
Binding.prototype.writeString = function (
  fd,
  string,
  position,
  encoding,
  callback,
  ctx
) {
  markSyscall(ctx, 'write');

  const buffer = Buffer.from(string, encoding);
  let wrapper;
  if (callback && callback !== kUsePromises) {
    if (callback.oncomplete) {
      callback = callback.oncomplete.bind(callback);
    }
    wrapper = function (err, written, returned) {
      callback(err, written, returned && string);
    };
  }
  return this.writeBuffer(fd, buffer, 0, string.length, position, wrapper, ctx);
};

/**
 * Rename a file.
 * @param {string} oldPath Old pathname.
 * @param {string} newPath New pathname.
 * @param {function(Error)} callback Callback (optional).
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {undefined}
 */
Binding.prototype.rename = function (oldPath, newPath, callback, ctx) {
  markSyscall(ctx, 'rename');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    oldPath = deBuffer(oldPath);
    newPath = deBuffer(newPath);
    const oldItem = this._system.getItem(oldPath);
    if (!oldItem) {
      throw new FSError('ENOENT', oldPath);
    }
    const oldParent = this._system.getItem(path.dirname(oldPath));
    const oldName = path.basename(oldPath);
    const newItem = this._system.getItem(newPath);
    const newParent = this._system.getItem(path.dirname(newPath));
    const newName = path.basename(newPath);
    if (newItem) {
      // make sure they are the same type
      if (oldItem instanceof File) {
        if (newItem instanceof Directory) {
          throw new FSError('EISDIR', newPath);
        }
      } else if (oldItem instanceof Directory) {
        if (!(newItem instanceof Directory)) {
          throw new FSError('ENOTDIR', newPath);
        }
        if (newItem.list().length > 0) {
          throw new FSError('ENOTEMPTY', newPath);
        }
      }
      newParent.removeItem(newName);
    } else {
      if (!newParent) {
        throw new FSError('ENOENT', newPath);
      }
      if (!(newParent instanceof Directory)) {
        throw new FSError('ENOTDIR', newPath);
      }
    }
    oldParent.removeItem(oldName);
    newParent.addItem(newName, oldItem);
  });
};

/**
 * Read a directory.
 * @param {string} dirpath Path to directory.
 * @param {string} encoding The encoding ('utf-8' or 'buffer').
 * @param {boolean} withFileTypes whether or not to return fs.Dirent objects
 * @param {function(Error, (Array.<string>|Array.<Buffer>)} callback Callback
 *     (optional) called with any error or array of items in the directory.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {Array<string> | Array<Buffer>} Array of items in directory (if sync).
 */
Binding.prototype.readdir = function (
  dirpath,
  encoding,
  withFileTypes,
  callback,
  ctx
) {
  markSyscall(ctx, 'scandir');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    dirpath = deBuffer(dirpath);
    let dpath = dirpath;
    let dir = this._system.getItem(dirpath);
    while (dir instanceof SymbolicLink) {
      dpath = path.resolve(path.dirname(dpath), dir.getPath());
      dir = this._system.getItem(dpath);
    }
    if (!dir) {
      throw new FSError('ENOENT', dirpath);
    }
    if (!(dir instanceof Directory)) {
      throw new FSError('ENOTDIR', dirpath);
    }
    if (!dir.canRead()) {
      throw new FSError('EACCES', dirpath);
    }

    let list = dir.list();
    if (encoding === 'buffer') {
      list = list.map(function (item) {
        return Buffer.from(item);
      });
    }

    if (withFileTypes === true) {
      const types = list.map(function (name) {
        const stats = dir.getItem(name).getStats();

        return getDirentType(stats.mode);
      });
      list = [list, types];
    }

    return list;
  });
};

/**
 * Create a directory.
 * @param {string} pathname Path to new directory.
 * @param {number} mode Permissions.
 * @param {boolean} recursive Recursively create deep directory. (added in nodejs v10+)
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.mkdir = function (pathname, mode, recursive, callback, ctx) {
  markSyscall(ctx, 'mkdir');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    pathname = deBuffer(pathname);
    const item = this._system.getItem(pathname);
    if (item) {
      if (recursive && item instanceof Directory) {
        // silently pass existing folder in recursive mode
        return;
      }
      throw new FSError('EEXIST', pathname);
    }

    const _mkdir = function (_pathname) {
      const parentDir = path.dirname(_pathname);
      let parent = this._system.getItem(parentDir);
      if (!parent) {
        if (!recursive) {
          throw new FSError('ENOENT', _pathname);
        }
        parent = _mkdir(parentDir, true);
      }
      this.access(parentDir, parseInt('0002', 8));
      const dir = new Directory();
      if (mode) {
        dir.setMode(mode);
      }
      return parent.addItem(path.basename(_pathname), dir);
    }.bind(this);

    _mkdir(pathname);
  });
};

/**
 * Remove a directory.
 * @param {string} pathname Path to directory.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.rmdir = function (pathname, callback, ctx) {
  markSyscall(ctx, 'rmdir');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    pathname = deBuffer(pathname);
    const item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    if (!(item instanceof Directory)) {
      throw new FSError('ENOTDIR', pathname);
    }
    if (item.list().length > 0) {
      throw new FSError('ENOTEMPTY', pathname);
    }
    this.access(path.dirname(pathname), parseInt('0002', 8));
    const parent = this._system.getItem(path.dirname(pathname));
    parent.removeItem(path.basename(pathname));
  });
};

const PATH_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const MAX_ATTEMPTS = 62 * 62 * 62;

/**
 * Create a directory based on a template.
 * See http://web.mit.edu/freebsd/head/lib/libc/stdio/mktemp.c
 * @param {string} prefix Path template (trailing Xs will be replaced).
 * @param {string} encoding The encoding ('utf-8' or 'buffer').
 * @param {function(Error, string)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.mkdtemp = function (prefix, encoding, callback, ctx) {
  if (encoding && typeof encoding !== 'string') {
    callback = encoding;
    encoding = 'utf-8';
  }

  markSyscall(ctx, 'mkdtemp');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    prefix = prefix.replace(/X{0,6}$/, 'XXXXXX');
    const parentPath = path.dirname(prefix);
    const parent = this._system.getItem(parentPath);
    if (!parent) {
      throw new FSError('ENOENT', prefix);
    }
    if (!(parent instanceof Directory)) {
      throw new FSError('ENOTDIR', prefix);
    }
    this.access(parentPath, parseInt('0002', 8));
    const template = path.basename(prefix);
    let unique = false;
    let count = 0;
    let name;
    while (!unique && count < MAX_ATTEMPTS) {
      let position = template.length - 1;
      let replacement = '';
      while (template.charAt(position) === 'X') {
        replacement += PATH_CHARS.charAt(
          Math.floor(PATH_CHARS.length * Math.random())
        );
        position -= 1;
      }
      const candidate = template.slice(0, position + 1) + replacement;
      if (!parent.getItem(candidate)) {
        name = candidate;
        unique = true;
      }
      count += 1;
    }
    if (!name) {
      throw new FSError('EEXIST', prefix);
    }
    const dir = new Directory();
    parent.addItem(name, dir);
    let uniquePath = path.join(parentPath, name);
    if (encoding === 'buffer') {
      uniquePath = Buffer.from(uniquePath);
    }
    return uniquePath;
  });
};

/**
 * Truncate a file.
 * @param {number} fd File descriptor.
 * @param {number} len Number of bytes.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.ftruncate = function (fd, len, callback, ctx) {
  markSyscall(ctx, 'ftruncate');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    const descriptor = this.getDescriptorById(fd);
    if (!descriptor.isWrite()) {
      throw new FSError('EINVAL');
    }
    const file = descriptor.getItem();
    if (!(file instanceof File)) {
      throw new FSError('EINVAL');
    }
    const content = file.getContent();
    const newContent = Buffer.alloc(len);
    content.copy(newContent);
    file.setContent(newContent);
  });
};

/**
 * Legacy support.
 * @param {number} fd File descriptor.
 * @param {number} len Number of bytes.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 */
Binding.prototype.truncate = Binding.prototype.ftruncate;

/**
 * Change user and group owner.
 * @param {string} pathname Path.
 * @param {number} uid User id.
 * @param {number} gid Group id.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.chown = function (pathname, uid, gid, callback, ctx) {
  markSyscall(ctx, 'chown');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    pathname = deBuffer(pathname);
    const item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    item.setUid(uid);
    item.setGid(gid);
  });
};

/**
 * Change user and group owner.
 * @param {number} fd File descriptor.
 * @param {number} uid User id.
 * @param {number} gid Group id.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.fchown = function (fd, uid, gid, callback, ctx) {
  markSyscall(ctx, 'fchown');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    const descriptor = this.getDescriptorById(fd);
    const item = descriptor.getItem();
    item.setUid(uid);
    item.setGid(gid);
  });
};

/**
 * Change permissions.
 * @param {string} pathname Path.
 * @param {number} mode Mode.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.chmod = function (pathname, mode, callback, ctx) {
  markSyscall(ctx, 'chmod');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    pathname = deBuffer(pathname);
    const item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    item.setMode(mode);
  });
};

/**
 * Change permissions.
 * @param {number} fd File descriptor.
 * @param {number} mode Mode.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.fchmod = function (fd, mode, callback, ctx) {
  markSyscall(ctx, 'fchmod');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    const descriptor = this.getDescriptorById(fd);
    const item = descriptor.getItem();
    item.setMode(mode);
  });
};

/**
 * Delete a named item.
 * @param {string} pathname Path to item.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.unlink = function (pathname, callback, ctx) {
  markSyscall(ctx, 'unlink');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    pathname = deBuffer(pathname);
    const item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    if (item instanceof Directory) {
      throw new FSError('EPERM', pathname);
    }
    const parent = this._system.getItem(path.dirname(pathname));
    parent.removeItem(path.basename(pathname));
  });
};

/**
 * Update timestamps.
 * @param {string} pathname Path to item.
 * @param {number} atime Access time (in seconds).
 * @param {number} mtime Modification time (in seconds).
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.utimes = function (pathname, atime, mtime, callback, ctx) {
  markSyscall(ctx, 'utimes');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    let filepath = deBuffer(pathname);
    let item = this._system.getItem(filepath);
    let links = 0;
    while (item instanceof SymbolicLink) {
      if (links > MAX_LINKS) {
        throw new FSError('ELOOP', filepath);
      }
      filepath = path.resolve(path.dirname(filepath), item.getPath());
      item = this._system.getItem(filepath);
      ++links;
    }
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    item.setATime(new Date(atime * 1000));
    item.setMTime(new Date(mtime * 1000));
  });
};

/**
 * Update timestamps.
 * @param {string} pathname Path to item.
 * @param {number} atime Access time (in seconds).
 * @param {number} mtime Modification time (in seconds).
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.lutimes = function (pathname, atime, mtime, callback, ctx) {
  markSyscall(ctx, 'utimes');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    pathname = deBuffer(pathname);
    const item = this._system.getItem(pathname);
    if (!item) {
      throw new FSError('ENOENT', pathname);
    }
    // lutimes doesn't follow symlink
    item.setATime(new Date(atime * 1000));
    item.setMTime(new Date(mtime * 1000));
  });
};

/**
 * Update timestamps.
 * @param {number} fd File descriptor.
 * @param {number} atime Access time (in seconds).
 * @param {number} mtime Modification time (in seconds).
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.futimes = function (fd, atime, mtime, callback, ctx) {
  markSyscall(ctx, 'futimes');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    const descriptor = this.getDescriptorById(fd);
    let item = descriptor.getItem();
    let filepath = this._system.getFilepath(item);
    let links = 0;
    while (item instanceof SymbolicLink) {
      if (links > MAX_LINKS) {
        throw new FSError('ELOOP', filepath);
      }
      filepath = path.resolve(path.dirname(filepath), item.getPath());
      item = this._system.getItem(filepath);
      ++links;
    }
    item.setATime(new Date(atime * 1000));
    item.setMTime(new Date(mtime * 1000));
  });
};

/**
 * Synchronize in-core state with storage device.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.fsync = function (fd, callback, ctx) {
  markSyscall(ctx, 'fsync');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    this.getDescriptorById(fd);
  });
};

/**
 * Synchronize in-core metadata state with storage device.
 * @param {number} fd File descriptor.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.fdatasync = function (fd, callback, ctx) {
  markSyscall(ctx, 'fdatasync');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    this.getDescriptorById(fd);
  });
};

/**
 * Create a hard link.
 * @param {string} srcPath The existing file.
 * @param {string} destPath The new link to create.
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.link = function (srcPath, destPath, callback, ctx) {
  markSyscall(ctx, 'link');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    srcPath = deBuffer(srcPath);
    destPath = deBuffer(destPath);
    const item = this._system.getItem(srcPath);
    if (!item) {
      throw new FSError('ENOENT', srcPath);
    }
    if (item instanceof Directory) {
      throw new FSError('EPERM', srcPath);
    }
    if (this._system.getItem(destPath)) {
      throw new FSError('EEXIST', destPath);
    }
    const parent = this._system.getItem(path.dirname(destPath));
    if (!parent) {
      throw new FSError('ENOENT', destPath);
    }
    if (!(parent instanceof Directory)) {
      throw new FSError('ENOTDIR', destPath);
    }
    parent.addItem(path.basename(destPath), item);
  });
};

/**
 * Create a symbolic link.
 * @param {string} srcPath Path from link to the source file.
 * @param {string} destPath Path for the generated link.
 * @param {string} type Ignored (used for Windows only).
 * @param {function(Error)} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.symlink = function (srcPath, destPath, type, callback, ctx) {
  markSyscall(ctx, 'symlink');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    srcPath = deBuffer(srcPath);
    destPath = deBuffer(destPath);
    if (this._system.getItem(destPath)) {
      throw new FSError('EEXIST', destPath);
    }
    const parent = this._system.getItem(path.dirname(destPath));
    if (!parent) {
      throw new FSError('ENOENT', destPath);
    }
    if (!(parent instanceof Directory)) {
      throw new FSError('ENOTDIR', destPath);
    }
    const link = new SymbolicLink();
    link.setPath(srcPath);
    parent.addItem(path.basename(destPath), link);
  });
};

/**
 * Read the contents of a symbolic link.
 * @param {string} pathname Path to symbolic link.
 * @param {string} encoding The encoding ('utf-8' or 'buffer').
 * @param {function(Error, (string|Buffer))} callback Optional callback.
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {string|Buffer} Symbolic link contents (path to source).
 */
Binding.prototype.readlink = function (pathname, encoding, callback, ctx) {
  if (encoding && typeof encoding !== 'string') {
    // this would not happend in nodejs v10+
    callback = encoding;
    encoding = 'utf-8';
  }

  markSyscall(ctx, 'readlink');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    pathname = deBuffer(pathname);
    const link = this._system.getItem(pathname);
    if (!link) {
      throw new FSError('ENOENT', pathname);
    }
    if (!(link instanceof SymbolicLink)) {
      throw new FSError('EINVAL', pathname);
    }
    let linkPath = link.getPath();
    if (encoding === 'buffer') {
      linkPath = Buffer.from(linkPath);
    }
    return linkPath;
  });
};

/**
 * Stat an item.
 * @param {string} filepath Path.
 * @param {boolean} bigint Use BigInt.
 * @param {function(Error, Float64Array|BigUint64Array)} callback Callback (optional).
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {Float64Array|BigUint64Array|undefined} Stats or undefined (if sync).
 */
Binding.prototype.lstat = function (filepath, bigint, callback, ctx) {
  markSyscall(ctx, 'lstat');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    filepath = deBuffer(filepath);
    const item = this._system.getItem(filepath);
    if (!item) {
      throw new FSError('ENOENT', filepath);
    }
    const stats = item.getStats(bigint);
    fillStats(stats, bigint);
    return stats;
  });
};

/**
 * Tests user permissions.
 * @param {string} filepath Path.
 * @param {number} mode Mode.
 * @param {function(Error)} callback Callback (optional).
 * @param {object} ctx Context object (optional), only for nodejs v10+.
 * @return {*} The return if no callback is provided.
 */
Binding.prototype.access = function (filepath, mode, callback, ctx) {
  markSyscall(ctx, 'access');

  return maybeCallback(normalizeCallback(callback), ctx, this, function () {
    filepath = deBuffer(filepath);
    let item = this._system.getItem(filepath);
    let links = 0;
    while (item instanceof SymbolicLink) {
      if (links > MAX_LINKS) {
        throw new FSError('ELOOP', filepath);
      }
      filepath = path.resolve(path.dirname(filepath), item.getPath());
      item = this._system.getItem(filepath);
      ++links;
    }
    if (!item) {
      throw new FSError('ENOENT', filepath);
    }
    if (mode && process.getuid && process.getgid) {
      if (mode & constants.R_OK && !item.canRead()) {
        throw new FSError('EACCES', filepath);
      }
      if (mode & constants.W_OK && !item.canWrite()) {
        throw new FSError('EACCES', filepath);
      }
      if (mode & constants.X_OK && !item.canExecute()) {
        throw new FSError('EACCES', filepath);
      }
    }
  });
};

/**
 * Not yet implemented.
 * @type {function()}
 */
Binding.prototype.StatWatcher = notImplemented;

/**
 * Export the binding constructor.
 * @type {function()}
 */
module.exports = Binding;
