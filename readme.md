# Mock FS

A configurable mock file system.  You know, for testing.

## Purpose

Instead of testing against real file system resources, it should be easy to mock up a file system for tests.

E.g.

```js
var mock = require('mock-fs');

var fs = mock.fs({
  'path/to/fake/dir': {
    'some-file.txt': 'file content here',
    'empty-dir': {/** empty directory */}
  },
  'path/to/some.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
  'some/other/path': {/** another empty directory */}
});
```

## Status

These `fs` functions are implemented by the built-in binding.  They need to be provided by the mock binding.

| function        | status | notes |
|-----------------|-------:|-------|
| `Stats`         |    90% | implement `binding.Stats` |
| `exists`        |   100% | implement `binding.stat` |
| `existsSync`    |   100% | implement `binding.stat` |
| `close`         |     0% | implement `binding.close` |
| `closeSync`     |     0% | implement `binding.close` |
| `open`          |     0% | implement `binding.open` |
| `openSync`      |     0% | implement `binding.open` |
| `read`          |     0% | implement `binding.read` |
| `readSync`      |     0% | implement `binding.read` |
| `write`         |     0% | implement `binding.write` |
| `writeSync`     |     0% | implement `binding.write` |
| `rename`        |     0% | implement `binding.rename` |
| `renameSync`    |     0% | implement `binding.rename` |
| `truncate`      |     0% | implement `binding.ftruncate` |
| `ftruncate`     |     0% | implement `binding.ftruncate` |
| `ftruncateSync` |     0% | implement `binding.ftruncate` |
| `rmdir`         |     0% | implement `binding.rmdir` |
| `rmdirSync`     |     0% | implement `binding.rmdir` |
| `fdatasync`     |     0% | implement `binding.fdatasync` |
| `fdatasyncSync` |     0% | implement `binding.fdatasync` |
| `fsync`         |     0% | implement `binding.fsync` |
| `fsyncSync`     |     0% | implement `binding.fsync` |
| `mkdir`         |     0% | implement `binding.mkdir` |
| `mkdirSync`     |     0% | implement `binding.mkdir` |
| `readdir`       |     0% | implement `binding.readdir` |
| `readdirSync`   |     0% | implement `binding.readdir` |
| `fstat`         |     0% | implement `binding.fstat` |
| `lstat`         |     0% | implement `binding.lstat` |
| `stat`          |    90% | implement `binding.stat` |
| `fstatSync`     |     0% | implement `binding.fstat` |
| `lstatSync`     |     0% | implement `binding.lstat` |
| `statSync`      |    90% | implement `binding.stat` |
| `readlink`      |     0% | implement `binding.readlink` |
| `readlinkSync`  |     0% | implement `binding.readlink` |
| `symlink`       |     0% | implement `binding.symlink` |
| `symlinkSync`   |     0% | implement `binding.symlink` |
| `link`          |     0% | implement `binding.link` |
| `linkSync`      |     0% | implement `binding.link` |
| `unlink`        |     0% | implement `binding.unlink` |
| `unlinkSync`    |     0% | implement `binding.unlink` |
| `fchmod`        |     0% | implement `binding.fchmod` |
| `fchmodSync`    |     0% | implement `binding.fchmod` |
| `chmod`         |     0% | implement `binding.chmod` |
| `chmodSync`     |     0% | implement `binding.chmod` |
| `fchown`        |     0% | implement `binding.chown` |
| `fchownSync`    |     0% | implement `binding.chown` |
| `utimes`        |     0% | implement `binding.utimes` |
| `utimesSync`    |     0% | implement `binding.utimes` |
| `futimes`       |     0% | implement `binding.futimes` |
| `futimesSync`   |     0% | implement `binding.futimes` |

[![Current Status](https://secure.travis-ci.org/tschaub/mock-fs.png?branch=master)](https://travis-ci.org/tschaub/mock-fs)
