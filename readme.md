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
| `fs.Stats`         |    90% | <a name='Stats'></a>Incudes `mode`, `size`, `atime`, `ctime`, `mtime`, `isFile()`, and `isDirectory()` |
| `fs.exists`        |   100% | Complete |
| `fs.existsSync`    |   100% | Complete |
| `fs.close`         |     0% | Implement `binding.close` |
| `fs.closeSync`     |     0% | Implement `binding.close` |
| `fs.open`          |     0% | Implement `binding.open` |
| `fs.openSync`      |     0% | Implement `binding.open` |
| `fs.read`          |     0% | Implement `binding.read` |
| `fs.readSync`      |     0% | Implement `binding.read` |
| `fs.write`         |     0% | Implement `binding.write` |
| `fs.writeSync`     |     0% | Implement `binding.write` |
| `fs.rename`        |     0% | Implement `binding.rename` |
| `fs.renameSync`    |     0% | Implement `binding.rename` |
| `fs.truncate`      |     0% | Implement `binding.ftruncate` |
| `fs.ftruncate`     |     0% | Implement `binding.ftruncate` |
| `fs.ftruncateSync` |     0% | Implement `binding.ftruncate` |
| `fs.rmdir`         |     0% | Implement `binding.rmdir` |
| `fs.rmdirSync`     |     0% | Implement `binding.rmdir` |
| `fs.fdatasync`     |     0% | Implement `binding.fdatasync` |
| `fs.fdatasyncSync` |     0% | Implement `binding.fdatasync` |
| `fs.fsync`         |     0% | Implement `binding.fsync` |
| `fs.fsyncSync`     |     0% | Implement `binding.fsync` |
| `fs.mkdir`         |     0% | Implement `binding.mkdir` |
| `fs.mkdirSync`     |     0% | Implement `binding.mkdir` |
| `fs.readdir`       |     0% | Implement `binding.readdir` |
| `fs.readdirSync`   |     0% | Implement `binding.readdir` |
| `fs.fstat`         |     0% | Implement `binding.fstat` |
| `fs.lstat`         |     0% | Implement `binding.lstat` |
| `fs.stat`          |    90% | Provides stats object [described above](#Stats) |
| `fs.fstatSync`     |     0% | Implement `binding.fstat` |
| `fs.lstatSync`     |     0% | Implement `binding.lstat` |
| `fs.statSync`      |    90% | Provides stats object [described above](#Stats) |
| `fs.readlink`      |     0% | Implement `binding.readlink` |
| `fs.readlinkSync`  |     0% | Implement `binding.readlink` |
| `fs.symlink`       |     0% | Implement `binding.symlink` |
| `fs.symlinkSync`   |     0% | Implement `binding.symlink` |
| `fs.link`          |     0% | Implement `binding.link` |
| `fs.linkSync`      |     0% | Implement `binding.link` |
| `fs.unlink`        |     0% | Implement `binding.unlink` |
| `fs.unlinkSync`    |     0% | Implement `binding.unlink` |
| `fs.fchmod`        |     0% | Implement `binding.fchmod` |
| `fs.fchmodSync`    |     0% | Implement `binding.fchmod` |
| `fs.chmod`         |     0% | Implement `binding.chmod` |
| `fs.chmodSync`     |     0% | Implement `binding.chmod` |
| `fs.fchown`        |     0% | Implement `binding.chown` |
| `fs.fchownSync`    |     0% | Implement `binding.chown` |
| `fs.utimes`        |     0% | Implement `binding.utimes` |
| `fs.utimesSync`    |     0% | Implement `binding.utimes` |
| `fs.futimes`       |     0% | Implement `binding.futimes` |
| `fs.futimesSync`   |     0% | Implement `binding.futimes` |

[![Current Status](https://secure.travis-ci.org/tschaub/mock-fs.png?branch=master)](https://travis-ci.org/tschaub/mock-fs)
