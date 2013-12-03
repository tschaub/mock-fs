# Mock FS

A configurable mock file system.  You know, for testing.

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

| function               | status | notes    |
|------------------------|:------:|----------|
| `fs.ReadStream`        |   100% | Complete |
| `fs.WriteStream`       |   100% | Complete |
| `fs.appendFile`        |   100% | Complete |
| `fs.appendFileSync`    |   100% | Complete |
| `fs.chmod`             |   100% | Complete |
| `fs.chmodSync`         |   100% | Complete |
| `fs.chown`             |   100% | Complete |
| `fs.chownSync`         |   100% | Complete |
| `fs.close`             |   100% | Complete |
| `fs.closeSync`         |   100% | Complete |
| `fs.createReadStream`  |   100% | Complete |
| `fs.createWriteStream` |   100% | Complete |
| `fs.exists`            |   100% | Complete |
| `fs.existsSync`        |   100% | Complete |
| `fs.fchmod`            |   100% | Complete |
| `fs.fchmodSync`        |   100% | Complete |
| `fs.fchown`            |   100% | Complete |
| `fs.fchownSync`        |   100% | Complete |
| `fs.fdatasync`         |   100% | Complete |
| `fs.fdatasyncSync`     |   100% | Complete |
| `fs.fsync`             |   100% | Complete |
| `fs.fsyncSync`         |   100% | Complete |
| `fs.ftruncate`         |   100% | Complete |
| `fs.ftruncateSync`     |   100% | Complete |
| `fs.futimes`           |   100% | Complete |
| `fs.futimesSync`       |   100% | Complete |
| `fs.lchmod`            |   100% | Complete |
| `fs.lchmodSync`        |   100% | Complete |
| `fs.lchown`            |   100% | Complete |
| `fs.lchownSync`        |   100% | Complete |
| `fs.link`              |   100% | Complete |
| `fs.linkSync`          |   100% | Complete |
| `fs.mkdir`             |   100% | Complete |
| `fs.mkdirSync`         |   100% | Complete |
| `fs.open`              |   100% | Complete |
| `fs.openSync`          |   100% | Complete |
| `fs.read`              |   100% | Complete |
| `fs.readSync`          |   100% | Complete |
| `fs.readFile`          |   100% | Complete |
| `fs.readFileSync`      |   100% | Complete |
| `fs.readdir`           |   100% | Complete |
| `fs.readdirSync`       |   100% | Complete |
| `fs.rename`            |   100% | Complete |
| `fs.renameSync`        |   100% | Complete |
| `fs.rmdir`             |   100% | Complete |
| `fs.rmdirSync`         |   100% | Complete |
| `fs.symlink`           |   100% | Complete |
| `fs.symlinkSync`       |   100% | Complete |
| `fs.truncate`          |   100% | Complete |
| `fs.truncateSync`      |   100% | Complete |
| `fs.unlink`            |   100% | Complete |
| `fs.unlinkSync`        |   100% | Complete |
| `fs.utimes`            |   100% | Complete |
| `fs.utimesSync`        |   100% | Complete |
| `fs.write`             |   100% | Complete |
| `fs.writeSync`         |   100% | Complete |
| `fs.writeFile`         |   100% | Complete |
| `fs.writeFileSync`     |   100% | Complete |
| `fs.Stats`             |    90% | <a name='Stats'></a>Incudes `mode`, `size`, `atime`, `ctime`, `mtime`, `uid`, `gid`, `isFile()`, and `isDirectory()` |
| `fs.fstat`             |    90% | Provides a [stats object](#Stats) |
| `fs.fstatSync`         |    90% | Provides a [stats object](#Stats) |
| `fs.stat`              |    90% | Provides a [stats object](#Stats) |
| `fs.statSync`          |    90% | Provides a [stats object](#Stats) |
| `fs.FSWatcher`         |     0% | Implement `fs.FSWatcher` |
| `fs.lstatSync`         |     0% | Implement `binding.lstat` |
| `fs.lstat`             |     0% | Implement `binding.lstat` |
| `fs.readlink`          |     0% | Implement `binding.readlink` |
| `fs.readlinkSync`      |     0% | Implement `binding.readlink` |
| `fs.realpath`          |     0% | Implement `binding.readlink` & `binding.lstat` |
| `fs.realpathSync`      |     0% | Implement `binding.readlink` & `binding.lstat` |
| `fs.unwatchFile`       |     0% | Implement `binding.StatWatcher` |
| `fs.watch`             |     0% | Implement `fs.FSWatcher` |
| `fs.watchFile`         |     0% | Implement `binding.StatWatcher` |

[![Current Status](https://secure.travis-ci.org/tschaub/mock-fs.png?branch=master)](https://travis-ci.org/tschaub/mock-fs)
