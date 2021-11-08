'use strict';

const {AbortError} = require('./error');
const {FSReqCallback} = process.binding('fs');

/**
 * This is a workaround for getting access to the ReadFileContext
 * prototype, which we need to be able to patch its methods.
 * @returns {object}
 */
exports.getReadFileContextPrototype = function() {
  const fs = require('fs');
  const fsBinding = process.binding('fs');

  const originalOpen = fsBinding.open;

  let proto;
  fsBinding.open = (_path, _flags, _mode, req) => {
    proto = Object.getPrototypeOf(req.context);
    return originalOpen.apply(fsBinding, [_path, _flags, _mode, req]);
  };

  fs.readFile('/ignored.txt', () => {});

  fsBinding.open = originalOpen;

  return proto;
};

/**
 * This patches the ReadFileContext prototype to use mocked bindings
 * when available. This entire implementation is more or less fully
 * copied over from Node.js's /lib/internal/fs/read_file_context.js
 *
 * This patch is required to support Node.js v16+, where the ReadFileContext
 * closes directly over the internal fs bindings, and is also eagerly loader.
 *
 * See https://github.com/tschaub/mock-fs/issues/332 for more information.
 *
 * @param {object} prototype The ReadFileContext prototype object to patch.
 */
exports.patchReadFileContext = function(prototype) {
  const origRead = prototype.read;
  const origClose = prototype.close;

  const kReadFileUnknownBufferLength = 64 * 1024;
  const kReadFileBufferLength = 512 * 1024;

  function readFileAfterRead(err, bytesRead) {
    const context = this.context;

    if (err) {
      return context.close(err);
    }
    context.pos += bytesRead;

    if (context.pos === context.size || bytesRead === 0) {
      context.close();
    } else {
      if (context.size === 0) {
        // Unknown size, just read until we don't get bytes.
        const buffer =
          bytesRead === kReadFileUnknownBufferLength
            ? context.buffer
            : context.buffer.slice(0, bytesRead);
        context.buffers.push(buffer);
      }
      context.read();
    }
  }

  function readFileAfterClose(err) {
    const context = this.context;
    const callback = context.callback;
    let buffer = null;

    if (context.err || err) {
      // This is a simplification from Node.js, where we don't bother merging the errors
      return callback(context.err || err);
    }

    try {
      if (context.size === 0) {
        buffer = Buffer.concat(context.buffers, context.pos);
      } else if (context.pos < context.size) {
        buffer = context.buffer.slice(0, context.pos);
      } else {
        buffer = context.buffer;
      }

      if (context.encoding) {
        buffer = buffer.toString(context.encoding);
      }
    } catch (err) {
      return callback(err);
    }

    callback(null, buffer);
  }

  prototype.read = function read() {
    if (!prototype._mockedBinding) {
      return origRead.apply(this, arguments);
    }

    let buffer;
    let offset;
    let length;

    if (this.signal && this.signal.aborted) {
      return this.close(new AbortError());
    }
    if (this.size === 0) {
      buffer = Buffer.allocUnsafeSlow(kReadFileUnknownBufferLength);
      offset = 0;
      length = kReadFileUnknownBufferLength;
      this.buffer = buffer;
    } else {
      buffer = this.buffer;
      offset = this.pos;
      length = Math.min(kReadFileBufferLength, this.size - this.pos);
    }

    const req = new FSReqCallback();
    req.oncomplete = readFileAfterRead;
    req.context = this;

    // This call and the one in close() is what we want to change, the
    // rest is pretty much the same as Node.js except we don't have access
    // to some of the internal optimizations.
    prototype._mockedBinding.read(this.fd, buffer, offset, length, -1, req);
  };

  prototype.close = function close(err) {
    if (!prototype._mockedBinding) {
      return origClose.apply(this, arguments);
    }

    if (this.isUserFd) {
      process.nextTick(function tick(context) {
        readFileAfterClose.apply({context}, [null]);
      }, this);
      return;
    }

    const req = new FSReqCallback();
    req.oncomplete = readFileAfterClose;
    req.context = this;
    this.err = err;

    prototype._mockedBinding.close(this.fd, req);
  };
};
