'use strict';

const {AbortError} = require('./error');
const {FSReqCallback} = process.binding('fs');

const kReadFileUnknownBufferLength = 64 * 1024;
const kReadFileBufferLength = 512 * 1024;

function getReadFileContextPrototype() {
  const fs = require('fs');
  const fsBinding = process.binding('fs');

  const originalOpen = fsBinding.open;

  let proto;
  fsBinding.open = (_path, _flags, _mode, req) => {
    proto = Object.getPrototypeOf(req.context);
  };

  fs.readFile('/ignored.txt', () => {});

  fsBinding.open = originalOpen;

  return proto;
}

function patchReadFileContext(prototype) {
  const origRead = prototype.read;
  const origClose = prototype.close;

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
        Array.prototype.push.apply(context.buffers, buffer);
      }
      context.read();
    }
  }

  function readFileAfterClose(err) {
    const context = this.context;
    const callback = context.callback;
    let buffer = null;

    if (context.err || err) {
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
}

exports.patchReadFileContext = patchReadFileContext;

exports.getReadFileContextPrototype = getReadFileContextPrototype;
