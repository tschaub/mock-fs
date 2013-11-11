# Mock FS

A configurable mock file system.  You know, for testing.

## Purpose

Instead of testing against real file system resources, it should be easy to mock up a file system for tests.

Eventually, this module will provide a full mock for the `fs` module.  For now, it provides facilities for creating an in-memory file system.

E.g.

```js
var mock = require('mock-fs');

var system = mock.create({
  'path/to/fake/dir': {
    'some-file.txt': 'file content here',
    'empty-dir': {/** empty directory */}
  },
  'path/to/some.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
  'some/other/path': {/** another empty directory */}
});
```

## TODO

These `fs` functions are implemented by the built-in binding.  They need to be provided by the mock binding.

 * `Stats`
 * `exists`
 * `existsSync`
 * `close`
 * `closeSync`
 * `open`
 * `openSync`
 * `read`
 * `readSync`
 * `write`
 * `writeSync`
 * `rename`
 * `renameSync`
 * `truncate`
 * `ftruncate`
 * `ftruncateSync`
 * `rmdir`
 * `rmdirSync`
 * `fdatasync`
 * `fdatasyncSync`
 * `fsync`
 * `fsyncSync`
 * `mkdir`
 * `mkdirSync`
 * `readdir`
 * `readdirSync`
 * `fstat`
 * `lstat`
 * `stat`
 * `fstatSync`
 * `lstatSync`
 * `statSync`
 * `readlink`
 * `readlinkSync`
 * `symlink`
 * `symlinkSync`
 * `link`
 * `linkSync`
 * `unlink`
 * `unlinkSync`
 * `fchmod`
 * `fchmodSync`
 * `chmod`
 * `chmodSync`
 * `fchown`
 * `fchownSync`
 * `utimes`
 * `utimesSync`
 * `futimes`
 * `futimesSync`

[![Current Status](https://secure.travis-ci.org/tschaub/mock-fs.png?branch=master)](https://travis-ci.org/tschaub/mock-fs)
