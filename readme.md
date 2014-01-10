# Mock FS

A configurable mock file system.  You know, for testing.

## Example

The code below makes it so the `fs` module is temporarily backed by a mock file system with a few files and directories.

```js
var mock = require('mock-fs');

var restore = mock({
  'path/to/fake/dir': {
    'some-file.txt': 'file content here',
    'empty-dir': {/** empty directory */}
  },
  'path/to/some.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
  'some/other/path': {/** another empty directory */}
});
```

Note that the `mock` function returns a `restore` function.  When you are ready to restore the `fs` module (so that it is backed by your real file system), call `restore()`.

```js
/// after a test runs
restore();
```

## Caveats and limitations

When you require `mock-fs`, Node's own `fs` module is patched to allow the binding to the underlying file system to be swapped out.  If you require `mock-fs` *before* any other modules that modify `fs` (e.g. `graceful-fs`), the mock should behave as expected.

The following `fs` functions are overridden: `fs.ReadStream`, `fs.Stats`, `fs.WriteStream`, `fs.appendFile`, `fs.appendFileSync`, `fs.chmod`, `fs.chmodSync`, `fs.chown`, `fs.chownSync`, `fs.close`, `fs.closeSync`, `fs.createReadStream`, `fs.createWriteStream`, `fs.exists`, `fs.existsSync`, `fs.fchmod`, `fs.fchmodSync`, `fs.fchown`, `fs.fchownSync`, `fs.fdatasync`, `fs.fdatasyncSync`, `fs.fstat`, `fs.fstatSync`, `fs.fsync`, `fs.fsyncSync`, `fs.ftruncate`, `fs.ftruncateSync`, `fs.futimes`, `fs.futimesSync`, `fs.lchmod`, `fs.lchmodSync`, `fs.lchown`, `fs.lchownSync`, `fs.link`, `fs.linkSync`, `fs.lstatSync`, `fs.lstat`, `fs.mkdir`, `fs.mkdirSync`, `fs.open`, `fs.openSync`, `fs.read`, `fs.readSync`, `fs.readFile`, `fs.readFileSync`, `fs.readdir`, `fs.readdirSync`, `fs.readlink`, `fs.readlinkSync`, `fs.realpath`, `fs.realpathSync`, `fs.rename`, `fs.renameSync`, `fs.rmdir`, `fs.rmdirSync`, `fs.stat`, `fs.statSync`, `fs.symlink`, `fs.symlinkSync`, `fs.truncate`, `fs.truncateSync`, `fs.unlink`, `fs.unlinkSync`, `fs.utimes`, `fs.utimesSync`, `fs.write`, `fs.writeSync`, `fs.writeFile`, and `fs.writeFileSync`.

Mock `fs.Stats` objects have the following properties: `dev`, `ino`, `nlink`, `mode`, `size`, `rdev`, `blksize`, `blocks`, `atime`, `ctime`, `mtime`, `uid`, and `gid`.  In addition, all of the `is*()` method are provided (e.g. `isDirectory()`, `isFile()`, et al.).

The following `fs` functions are *not* currently mocked (if your tests use these, they will work against the real file system): `fs.FSWatcher`, `fs.unwatchFile`, `fs.watch`, and `fs.watchFile`.  Pull requests welcome.

[![Current Status](https://secure.travis-ci.org/tschaub/mock-fs.png?branch=master)](https://travis-ci.org/tschaub/mock-fs)
