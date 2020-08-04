'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const os = require('os');
const path = require('path');
const File = require('../../lib/file');
const {fixWin32Permissions} = require('../../lib/item');
const Directory = require('../../lib/directory');
const withPromise = helper.withPromise;

const assert = helper.assert;
const assetsPath = path.resolve(__dirname, '../assets');

describe('The API', function() {
  describe('mock()', function() {
    it('configures the real fs module with a mock file system', function() {
      mock({
        'fake-file-for-testing-only': 'file content'
      });

      assert.isTrue(fs.existsSync('fake-file-for-testing-only'));

      mock.restore();
    });

    it('provides direct access to the internal filesystem object', function() {
      mock();
      const root = mock.getMockRoot();
      assert.notDeepEqual(root, {});
      mock.restore();
      assert.deepEqual(mock.getMockRoot(), {});
    });

    it('creates process.cwd() and os.tmpdir() by default', function() {
      mock();

      assert.isTrue(fs.statSync(process.cwd()).isDirectory());
      let tmp;
      if (os.tmpdir) {
        tmp = os.tmpdir();
      } else if (os.tmpDir) {
        tmp = os.tmpDir();
      }
      if (tmp) {
        assert.isTrue(fs.statSync(tmp).isDirectory());
      }

      mock.restore();
    });

    it('passes the createCwd option to the FileSystem constructor', function() {
      mock({}, {createCwd: false});

      assert.isFalse(fs.existsSync(process.cwd()));

      mock.restore();
    });

    it('passes the createTmp option to the FileSystem constructor', function() {
      mock({}, {createTmp: false});

      let tmp;
      if (os.tmpdir) {
        tmp = os.tmpdir();
      } else if (os.tmpDir) {
        tmp = os.tmpDir();
      }
      if (tmp) {
        assert.isFalse(fs.existsSync(tmp));
      }

      mock.restore();
    });

    xit('uses the real fs module in require() calls', function() {
      mock({foo: 'bar'});

      const pkg = require('../../package.json');
      assert.equal(pkg.name, 'mock-fs');

      mock.restore();
    });
  });

  describe('mock.restore()', function() {
    it('restores bindings for the real file system', function() {
      mock({
        'fake-file-for-testing-only': 'file content'
      });

      assert.isTrue(fs.existsSync('fake-file-for-testing-only'));

      mock.restore();
      assert.isFalse(fs.existsSync('fake-file-for-testing-only'));
    });
  });

  describe('mock.file()', function() {
    afterEach(mock.restore);

    it('lets you create files with additional properties', function(done) {
      mock({
        'path/to/file.txt': mock.file({
          content: 'file content',
          mtime: new Date(8675309),
          mode: parseInt('0644', 8)
        })
      });

      fs.stat('path/to/file.txt', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isTrue(stats.isFile());
        assert.isFalse(stats.isDirectory());
        assert.equal(stats.mtime.getTime(), 8675309);
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0644', 8));
        done();
      });
    });
  });

  describe('mock.directory()', function() {
    afterEach(mock.restore);

    it('lets you create directories with more properties', function(done) {
      mock({
        'path/to/dir': mock.directory({
          mtime: new Date(8675309),
          mode: parseInt('0644', 8)
        })
      });

      fs.stat('path/to/dir', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isFalse(stats.isFile());
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.mtime.getTime(), 8675309);
        assert.equal(stats.mode & parseInt('0777', 8), parseInt('0644', 8));
        done();
      });
    });

    it('works with a trailing slash', function() {
      mock({
        'path/to/dir/': mock.directory({
          mtime: new Date(8675309),
          mode: parseInt('0644', 8)
        })
      });

      assert.isTrue(fs.statSync('path/to/dir').isDirectory());
      assert.isTrue(fs.statSync('path/to/dir/').isDirectory());
    });

    it('works without a trailing slash', function() {
      mock({
        'path/to/dir': mock.directory({
          mtime: new Date(8675309),
          mode: parseInt('0644', 8)
        })
      });

      assert.isTrue(fs.statSync('path/to/dir').isDirectory());
      assert.isTrue(fs.statSync('path/to/dir/').isDirectory());
    });
  });

  describe('mock.symlink()', function() {
    afterEach(mock.restore);

    it('lets you create symbolic links', function() {
      mock({
        'path/to/file': 'content',
        'path/to/link': mock.symlink({path: './file'})
      });

      const stats = fs.statSync('path/to/link');
      assert.isTrue(stats.isFile());
      assert.equal(String(fs.readFileSync('path/to/link')), 'content');
    });
  });

  describe(`mock.bypass()`, () => {
    afterEach(mock.restore);

    it('(synchronous) bypasses mock FS & restores after', () => {
      mock({'/path/to/file': 'content'});

      assert.equal(fs.readFileSync('/path/to/file', 'utf8'), 'content');
      assert.isNotOk(fs.existsSync(__filename));
      assert.isOk(mock.bypass(() => fs.existsSync(__filename)));

      assert.isNotOk(fs.existsSync(__filename));
    });

    withPromise.it('(async) bypasses mock FS & restores after', done => {
      mock({'/path/to/file': 'content'});

      assert.equal(fs.readFileSync('/path/to/file', 'utf8'), 'content');
      assert.isNotOk(fs.existsSync(__filename));

      mock.bypass(() =>
        fs.promises
          .stat(__filename)
          .then(stat => {
            assert.isTrue(stat.isFile());
            return fs.promises.stat(__filename);
          })
          .then(stat => assert.isTrue(stat.isFile()))
          .then(() => {
            setTimeout(() => {
              assert.isNotOk(fs.existsSync(__filename));
              done();
            }, 0);
          })
          .catch(err => done(err))
      );
    });
  });

  describe(`mock.load()`, () => {
    const statsCompareKeys = [
      'birthtime',
      'ctime',
      'mtime',
      'gid',
      'uid',
      'mtime',
      'mode'
    ];
    const filterStats = stats => {
      const res = {};
      for (const key of statsCompareKeys) {
        const k =
          (stats.hasOwnProperty(key) && key) ||
          (stats.hasOwnProperty(`_${key}`) && `_${key}`);

        if (k) {
          res[key] =
            k === 'mode' && stats.isDirectory()
              ? fixWin32Permissions(stats[k])
              : stats[k];
        }
      }
      return res;
    };

    describe(`File`, () => {
      const filePath = path.join(assetsPath, 'file1.txt');

      it('creates a File factory with correct attributes', () => {
        const file = mock.load(filePath)();
        const stats = fs.statSync(filePath);

        assert.instanceOf(file, File);
        assert.deepEqual(filterStats(file), filterStats(stats));
      });
      describe('lazyLoad=true', () => {
        let file;
        beforeEach(() => (file = mock.load(filePath)()));

        it('creates accessors', () => {
          assert.typeOf(
            Object.getOwnPropertyDescriptor(file, '_content').get,
            'function'
          );
          assert.typeOf(
            Object.getOwnPropertyDescriptor(file, '_content').set,
            'function'
          );
        });
        it('read file loads data and replaces accessors', () => {
          assert.equal(file._content.toString(), 'data1');

          assert.instanceOf(
            Object.getOwnPropertyDescriptor(file, '_content').value,
            Buffer
          );
          assert.isNotOk(
            Object.getOwnPropertyDescriptor(file, '_content').get,
            'function'
          );
          assert.isNotOk(
            Object.getOwnPropertyDescriptor(file, '_content').set,
            'function'
          );
        });
        it('write file updates content and replaces accessors', () => {
          file._content = Buffer.from('new data');

          assert.equal(file._content.toString(), 'new data');
          assert.instanceOf(
            Object.getOwnPropertyDescriptor(file, '_content').value,
            Buffer
          );
          assert.isNotOk(
            Object.getOwnPropertyDescriptor(file, '_content').get,
            'function'
          );
          assert.isNotOk(
            Object.getOwnPropertyDescriptor(file, '_content').set,
            'function'
          );
        });
      });

      it('lazyLoad=false loads file content', () => {
        const file = mock.load(path.join(assetsPath, 'file1.txt'), {
          lazyLoad: false
        })();

        assert.equal(
          Object.getOwnPropertyDescriptor(file, '_content').value.toString(),
          'data1'
        );
      });

      it('can read file from mocked FS', () => {
        mock({'/file': mock.load(filePath)});
        assert.equal(fs.readFileSync('/file'), 'data1');
        mock.restore();
      });
    });

    describe(`Dir`, () => {
      it('creates a Directory factory with correct attributes', () => {
        const dir = mock.load(assetsPath)();
        const stats = fs.statSync(assetsPath);

        assert.instanceOf(dir, Directory);
        assert.deepEqual(filterStats(dir), filterStats(stats));
      });
      describe('recursive=true', () => {
        it('creates all files & dirs', () => {
          const base = mock.load(assetsPath, {recursive: true})();
          const baseDir = base._items.dir;
          const baseDirSubdir = baseDir._items.subdir;

          assert.instanceOf(base, Directory);
          assert.instanceOf(base._items['file1.txt'], File);
          assert.instanceOf(baseDir, Directory);
          assert.instanceOf(baseDir._items['file2.txt'], File);
          assert.instanceOf(baseDirSubdir, Directory);
          assert.instanceOf(baseDirSubdir._items['file3.txt'], File);
        });
        it('respects lazyLoad setting', () => {
          let dir;
          const getFile = () =>
            dir._items.dir._items.subdir._items['file3.txt'];

          dir = mock.load(assetsPath, {recursive: true, lazyLoad: true})();
          assert.typeOf(
            Object.getOwnPropertyDescriptor(getFile(), '_content').get,
            'function'
          );

          dir = mock.load(assetsPath, {recursive: true, lazyLoad: false})();
          assert.instanceOf(
            Object.getOwnPropertyDescriptor(getFile(), '_content').value,
            Buffer
          );
        });
      });

      it('recursive=false creates files & does not recurse', () => {
        const base = mock.load(assetsPath, {recursive: false})();
        assert.instanceOf(base, Directory);
        assert.instanceOf(base._items['file1.txt'], File);
        assert.isNotOk(base._items.dir);
      });

      it('can read file from mocked FS', () => {
        mock({'/dir': mock.load(assetsPath, {recursive: true})});
        assert.equal(fs.readFileSync('/dir/file1.txt'), 'data1');
        mock.restore();
      });
    });
  });

  xdescribe('mock.fs()', function() {
    it('generates a mock fs module with a mock file system', function(done) {
      const mockFs = mock.fs({
        'path/to/file.txt': 'file content'
      });

      mockFs.exists('path/to/file.txt', function(exists) {
        assert.isTrue(exists);
        done();
      });
    });

    it('passes options to the FileSystem constructor', function() {
      const mockFs = mock.fs(
        {
          '/path/to/file.txt': 'file content'
        },
        {
          createCwd: false,
          createTmp: false
        }
      );

      assert.isTrue(mockFs.existsSync('/path/to/file.txt'));
      assert.deepEqual(mockFs.readdirSync('/'), ['path']);
    });

    it('accepts an arbitrary nesting of files and directories', function() {
      const mockFs = mock.fs({
        'dir-one': {
          'dir-two': {
            'some-file.txt': 'file content here'
          }
        },
        'empty-dir': {}
      });

      assert.isTrue(mockFs.existsSync('dir-one/dir-two/some-file.txt'));
      assert.isTrue(mockFs.statSync('dir-one/dir-two/some-file.txt').isFile());
      assert.isTrue(mockFs.statSync('dir-one/dir-two').isDirectory());
      assert.isTrue(mockFs.statSync('empty-dir').isDirectory());
    });
  });
});

describe('process.cwd()', function() {
  afterEach(mock.restore);

  it('maintains current working directory', function() {
    const originalCwd = process.cwd();
    mock();

    const cwd = process.cwd();
    assert.equal(cwd, originalCwd);
  });

  it('allows changing directory', function() {
    const originalCwd = process.cwd();
    mock({
      dir: {}
    });

    process.chdir('dir');
    const cwd = process.cwd();
    assert.equal(cwd, path.join(originalCwd, 'dir'));
  });

  it('prevents changing directory to non-existent path', function() {
    mock();

    let err;
    try {
      process.chdir('dir');
    } catch (e) {
      err = e;
    }
    assert.instanceOf(err, Error);
    assert.equal(err.code, 'ENOENT');
  });

  it('prevents changing directory to non-directory path', function() {
    mock({
      file: ''
    });

    let err;
    try {
      process.chdir('file');
    } catch (e) {
      err = e;
    }
    assert.instanceOf(err, Error);
    assert.equal(err.code, 'ENOTDIR');
  });

  it('restores original methods on restore', function() {
    const originalCwd = process.cwd;
    const originalChdir = process.chdir;
    mock();

    mock.restore();
    assert.equal(process.cwd, originalCwd);
    assert.equal(process.chdir, originalChdir);
  });

  it('restores original working directory on restore', function() {
    const originalCwd = process.cwd();
    mock({
      dir: {}
    });

    process.chdir('dir');
    mock.restore();

    const cwd = process.cwd();
    assert.equal(cwd, originalCwd);
  });
});

if (process.getuid && process.getgid) {
  describe('security', function() {
    afterEach(mock.restore);

    it('denies dir listing without execute on parent', function() {
      mock({
        secure: mock.directory({
          mode: parseInt('0666', 8),
          items: {
            insecure: {
              file: 'file content'
            }
          }
        })
      });

      let err;
      try {
        fs.readdirSync('secure/insecure');
      } catch (e) {
        err = e;
      }
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EACCES');
    });

    it('denies file read without execute on parent', function() {
      mock({
        secure: mock.directory({
          mode: parseInt('0666', 8),
          items: {
            insecure: {
              file: 'file content'
            }
          }
        })
      });

      let err;
      try {
        fs.readFileSync('secure/insecure/file');
      } catch (e) {
        err = e;
      }
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EACCES');
    });

    it('denies file read without read on file', function() {
      mock({
        insecure: {
          'write-only': mock.file({
            mode: parseInt('0222', 8),
            content: 'write only'
          })
        }
      });

      let err;
      try {
        fs.readFileSync('insecure/write-only');
      } catch (e) {
        err = e;
      }
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EACCES');
    });

    it('denies file write without write on file', function() {
      mock({
        insecure: {
          'read-only': mock.file({
            mode: parseInt('0444', 8),
            content: 'read only'
          })
        }
      });

      let err;
      try {
        fs.writeFileSync('insecure/read-only', 'denied');
      } catch (e) {
        err = e;
      }
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EACCES');
    });
  });
}
