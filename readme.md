# Mock FS

A configurable mock file system.  You know, for testing.

## Purpose

Instead of testing against real file system resources, it should be easy to mock up a file system for tests.

## Example

The code below creates a mock `fs` module that is configured to work with a few mock files and directories.

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

If you are testing a module that `require`s the real `fs` module, you can use [`rewire`](https://npmjs.org/package/rewire) to inject a mock `fs` module for testing.

```js
var rewire = require("rewire");
var moduleToTest = rewire('./path/to/module');

// inject the mock fs created above
moduleToTest.__set__('fs', fs);

// now functions in moduleToTest will use
// your mock fs instead of the real one
```

## Status

The table below shows what is covered by the mock `fs`.  Tests are currently run on Node 0.8 and 0.10.  Eventually more versions will be supported.

| function           | status | notes |
|--------------------|:------:|-------|
| `fs.Stats`         |    90% | <a name='Stats'></a>Incudes `mode`, `size`, `atime`, `ctime`, `mtime`, `isFile()`, and `isDirectory()` |
| `fs.exists`        |   100% | Complete |
| `fs.existsSync`    |   100% | Complete |
| `fs.readdir`       |   100% | Complete |
| `fs.readdirSync`   |   100% | Complete |
| `fs.stat`          |    90% | Provides stats object [described above](#Stats) |
| `fs.statSync`      |    90% | Provides stats object [described above](#Stats) |
| `fs.close`         |     0% | Implement `binding.close` |
| `fs.closeSync`     |     0% | Implement `binding.close` |
| `fs.open`          |     0% | Implement `binding.open` |
| `fs.openSync`      |     0% | Implement `binding.open` |
| `fs.read`          |     0% | Implement `binding.read` |
| `fs.readSync`      |     0% | Implement `binding.read` |
| `fs.write`         |     0% | Implement `binding.write` |
| `fs.writeSync`     |     0% | Implement `binding.write` |
| `fs.rename`        |   100% | Complete |
| `fs.renameSync`    |   100% | Complete |
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
| `fs.fstat`         |     0% | Implement `binding.fstat` |
| `fs.lstat`         |     0% | Implement `binding.lstat` |
| `fs.fstatSync`     |     0% | Implement `binding.fstat` |
| `fs.lstatSync`     |     0% | Implement `binding.lstat` |
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
