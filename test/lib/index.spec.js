'use strict';

const Writable = require('stream').Writable;
const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const os = require('os');
const path = require('path');
const bufferFrom = require('../../lib/buffer').from;
const bufferAlloc = require('../../lib/buffer').alloc;

const assert = helper.assert;

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

describe('Mocking the file system', function() {
  describe('fs.unlink(path, callback)', function() {
    beforeEach(function() {
      mock({
        dir: {},
        dir2: mock.directory({
          mtime: new Date(1),
          items: {file: 'content here'}
        }),
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('deletes a file', function(done) {
      fs.unlink('file.txt', function(err) {
        if (err) {
          return done(err);
        }
        assert.isFalse(fs.existsSync('file.txt'));
        done();
      });
    });

    it('updates mtime of parent', function(done) {
      const oldTime = fs.statSync('dir2').mtime;
      fs.unlink('dir2/file', function(err) {
        if (err) {
          return done(err);
        }
        assert.isFalse(fs.existsSync('dir2/file'));
        const newTime = fs.statSync('dir2').mtime;
        assert.isTrue(newTime > oldTime);
        done();
      });
    });

    it('fails for a directory', function(done) {
      fs.unlink('dir', function(err) {
        assert.instanceOf(err, Error);
        assert.isTrue(fs.existsSync('dir'));
        done();
      });
    });

    it('respects previously opened file descriptors', function(done) {
      const fd = fs.openSync('file.txt', 'r');
      fs.unlink('file.txt', function(err) {
        if (err) {
          return done(err);
        }
        assert.isFalse(fs.existsSync('file.txt'));
        // but we can still use fd to read
        const buffer = bufferAlloc(7);
        const read = fs.readSync(fd, buffer, 0, 7);
        assert.equal(read, 7);
        assert.equal(String(buffer), 'content');
        done();
      });
    });
  });

  describe('fs.unlinkSync(path)', function() {
    beforeEach(function() {
      mock({
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('deletes a file', function() {
      fs.unlinkSync('file.txt');
      assert.isFalse(fs.existsSync('file.txt'));
    });

    it('respects previously opened file descriptors', function() {
      const fd = fs.openSync('file.txt', 'r');
      fs.unlinkSync('file.txt');
      assert.isFalse(fs.existsSync('file.txt'));
      // but we can still use fd to read
      const buffer = bufferAlloc(7);
      const read = fs.readSync(fd, buffer, 0, 7);
      assert.equal(read, 7);
      assert.equal(String(buffer), 'content');
    });
  });

  describe('fs.utimes(path, atime, mtime, callback)', function() {
    beforeEach(function() {
      mock({
        dir: {},
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('updates timestamps for a file', function(done) {
      fs.utimes('file.txt', new Date(100), new Date(200), function(err) {
        if (err) {
          return done(err);
        }
        const stats = fs.statSync('file.txt');
        assert.equal(stats.atime.getTime(), 100);
        assert.equal(stats.mtime.getTime(), 200);
        done();
      });
    });

    it('updates timestamps for a directory', function(done) {
      fs.utimes('dir', new Date(300), new Date(400), function(err) {
        if (err) {
          return done(err);
        }
        const stats = fs.statSync('dir');
        assert.equal(stats.atime.getTime(), 300);
        assert.equal(stats.mtime.getTime(), 400);
        done();
      });
    });

    it('fails for a bogus path', function(done) {
      fs.utimes('bogus.txt', new Date(100), new Date(200), function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });
  });

  describe('fs.utimesSync(path, atime, mtime)', function() {
    beforeEach(function() {
      mock({
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('updates timestamps for a file', function() {
      fs.utimesSync('file.txt', new Date(100), new Date(200));
      const stats = fs.statSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
    });
  });

  describe('fs.futimes(fd, atime, mtime, callback)', function() {
    beforeEach(function() {
      mock({
        dir: {},
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('updates timestamps for a file', function(done) {
      const fd = fs.openSync('file.txt', 'r');
      fs.futimes(fd, new Date(100), new Date(200), function(err) {
        if (err) {
          return done(err);
        }
        const stats = fs.statSync('file.txt');
        assert.equal(stats.atime.getTime(), 100);
        assert.equal(stats.mtime.getTime(), 200);
        done();
      });
    });

    it('updates timestamps for a directory', function(done) {
      const fd = fs.openSync('dir', 'r');
      fs.futimes(fd, new Date(300), new Date(400), function(err) {
        if (err) {
          return done(err);
        }
        const stats = fs.statSync('dir');
        assert.equal(stats.atime.getTime(), 300);
        assert.equal(stats.mtime.getTime(), 400);
        done();
      });
    });
  });

  describe('fs.futimesSync(path, atime, mtime)', function() {
    beforeEach(function() {
      mock({
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('updates timestamps for a file', function() {
      const fd = fs.openSync('file.txt', 'r');
      fs.futimesSync(fd, new Date(100), new Date(200));
      const stats = fs.statSync('file.txt');
      assert.equal(stats.atime.getTime(), 100);
      assert.equal(stats.mtime.getTime(), 200);
    });
  });

  describe('fs.link(srcpath, dstpath, callback)', function() {
    beforeEach(function() {
      mock({
        dir: {},
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('creates a link to a file', function(done) {
      assert.equal(fs.statSync('file.txt').nlink, 1);

      fs.link('file.txt', 'link.txt', function(err) {
        if (err) {
          return done(err);
        }
        assert.isTrue(fs.statSync('link.txt').isFile());
        assert.equal(fs.statSync('link.txt').nlink, 2);
        assert.equal(fs.statSync('file.txt').nlink, 2);
        assert.equal(String(fs.readFileSync('link.txt')), 'content');
        done();
      });
    });

    it('works if original is renamed', function(done) {
      fs.link('file.txt', 'link.txt', function(err) {
        if (err) {
          return done(err);
        }
        fs.renameSync('file.txt', 'renamed.txt');
        assert.isTrue(fs.statSync('link.txt').isFile());
        assert.equal(String(fs.readFileSync('link.txt')), 'content');
        done();
      });
    });

    it('works if original is removed', function(done) {
      assert.equal(fs.statSync('file.txt').nlink, 1);

      fs.link('file.txt', 'link.txt', function(err) {
        if (err) {
          return done(err);
        }
        assert.equal(fs.statSync('link.txt').nlink, 2);
        assert.equal(fs.statSync('file.txt').nlink, 2);
        fs.unlinkSync('file.txt');
        assert.isTrue(fs.statSync('link.txt').isFile());
        assert.equal(fs.statSync('link.txt').nlink, 1);
        assert.equal(String(fs.readFileSync('link.txt')), 'content');
        done();
      });
    });

    it('fails if original is a directory', function(done) {
      fs.link('dir', 'link', function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });
  });

  describe('fs.linkSync(srcpath, dstpath)', function() {
    beforeEach(function() {
      mock({
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('creates a link to a file', function() {
      fs.linkSync('file.txt', 'link.txt');
      assert.isTrue(fs.statSync('link.txt').isFile());
      assert.equal(String(fs.readFileSync('link.txt')), 'content');
    });

    it('works if original is renamed', function() {
      fs.linkSync('file.txt', 'link.txt');
      fs.renameSync('file.txt', 'renamed.txt');
      assert.isTrue(fs.statSync('link.txt').isFile());
      assert.equal(String(fs.readFileSync('link.txt')), 'content');
    });

    it('works if original is removed', function() {
      fs.linkSync('file.txt', 'link.txt');
      fs.unlinkSync('file.txt');
      assert.isTrue(fs.statSync('link.txt').isFile());
      assert.equal(String(fs.readFileSync('link.txt')), 'content');
    });

    it('fails if original is a directory', function() {
      assert.throws(function() {
        fs.linkSync('dir', 'link');
      });
    });
  });

  describe('fs.symlink(srcpath, dstpath, [type], callback)', function() {
    beforeEach(function() {
      mock({
        dir: {},
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('creates a symbolic link to a file', function(done) {
      fs.symlink('../file.txt', 'dir/link.txt', function(err) {
        if (err) {
          return done(err);
        }
        assert.isTrue(fs.statSync('dir/link.txt').isFile());
        assert.equal(String(fs.readFileSync('dir/link.txt')), 'content');
        done();
      });
    });

    it('breaks if original is renamed', function(done) {
      fs.symlink('file.txt', 'link.txt', function(err) {
        if (err) {
          return done(err);
        }
        assert.isTrue(fs.existsSync('link.txt'));
        fs.renameSync('file.txt', 'renamed.txt');
        assert.isFalse(fs.existsSync('link.txt'));
        done();
      });
    });

    it('works if original is a directory', function(done) {
      fs.symlink('dir', 'link', function(err) {
        if (err) {
          return done(err);
        }
        assert.isTrue(fs.statSync('link').isDirectory());
        done();
      });
    });
  });

  describe('fs.symlinkSync(srcpath, dstpath, [type])', function() {
    beforeEach(function() {
      mock({
        dir: {},
        'file.txt': 'content'
      });
    });
    afterEach(mock.restore);

    it('creates a symbolic link to a file', function() {
      fs.symlinkSync('../file.txt', 'dir/link.txt');
      assert.isTrue(fs.statSync('dir/link.txt').isFile());
      assert.equal(String(fs.readFileSync('dir/link.txt')), 'content');
    });

    it('breaks if original is renamed', function() {
      fs.symlinkSync('file.txt', 'link.txt');
      assert.isTrue(fs.existsSync('link.txt'));
      fs.renameSync('file.txt', 'renamed.txt');
      assert.isFalse(fs.existsSync('link.txt'));
    });

    it('works if original is a directory', function() {
      fs.symlinkSync('dir', 'link');
      assert.isTrue(fs.statSync('link').isDirectory());
    });
  });

  describe('fs.readlink(path, callback)', function() {
    beforeEach(function() {
      mock({
        'file.txt': 'content',
        link: mock.symlink({path: './file.txt'})
      });
    });
    afterEach(mock.restore);

    it('reads a symbolic link', function(done) {
      fs.readlink('link', function(err, srcPath) {
        if (err) {
          return done(err);
        }
        assert.equal(srcPath, './file.txt');
        done();
      });
    });

    it('fails for regular files', function(done) {
      fs.readlink('file.txt', function(err, srcPath) {
        assert.instanceOf(err, Error);
        done();
      });
    });
  });

  describe('fs.readlinkSync(path)', function() {
    beforeEach(function() {
      mock({
        'file.txt': 'content',
        link: mock.symlink({path: './file.txt'})
      });
    });
    afterEach(mock.restore);

    it('reads a symbolic link', function() {
      assert.equal(fs.readlinkSync('link'), './file.txt');
    });

    it('fails for regular files', function() {
      assert.throws(function() {
        fs.readlinkSync('file.txt');
      });
    });
  });

  describe('fs.lstat(path, callback)', function() {
    beforeEach(function() {
      mock({
        'file.txt': mock.file({
          content: 'content',
          mtime: new Date(1)
        }),
        link: mock.symlink({
          path: './file.txt',
          mtime: new Date(2)
        })
      });
    });
    afterEach(mock.restore);

    it('stats a symbolic link', function(done) {
      fs.lstat('link', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isTrue(stats.isSymbolicLink());
        assert.isFalse(stats.isFile());
        assert.equal(stats.mtime.getTime(), 2);
        done();
      });
    });

    it('stats a regular file', function(done) {
      fs.lstat('file.txt', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isTrue(stats.isFile());
        assert.isFalse(stats.isSymbolicLink());
        assert.equal(stats.mtime.getTime(), 1);
        done();
      });
    });
  });

  describe('fs.lstatSync(path)', function() {
    beforeEach(function() {
      mock({
        'file.txt': mock.file({
          content: 'content',
          mtime: new Date(1)
        }),
        link: mock.symlink({
          path: './file.txt',
          mtime: new Date(2)
        })
      });
    });
    afterEach(mock.restore);

    it('stats a symbolic link', function() {
      const stats = fs.lstatSync('link');
      assert.isTrue(stats.isSymbolicLink());
      assert.isFalse(stats.isFile());
      assert.equal(stats.mtime.getTime(), 2);
    });

    it('stats a regular file', function() {
      const stats = fs.lstatSync('file.txt');
      assert.isTrue(stats.isFile());
      assert.isFalse(stats.isSymbolicLink());
      assert.equal(stats.mtime.getTime(), 1);
    });
  });

  describe('fs.realpath(path, [cache], callback)', function() {
    // based on binding.lstat and binding.readlink so tested elsewhere as well

    beforeEach(function() {
      mock({
        'dir/file.txt': 'content',
        link: mock.symlink({path: './dir/file.txt'})
      });
    });
    afterEach(mock.restore);

    it('resolves the real path for a symbolic link', function(done) {
      fs.realpath('link', function(err, resolved) {
        if (err) {
          return done(err);
        }
        assert.equal(resolved, path.resolve('dir/file.txt'));
        done();
      });
    });

    it('resolves the real path regular file', function(done) {
      fs.realpath('dir/file.txt', function(err, resolved) {
        if (err) {
          return done(err);
        }
        assert.equal(resolved, path.resolve('dir/file.txt'));
        done();
      });
    });
  });

  describe('fs.createReadStream(path, [options])', function() {
    beforeEach(function() {
      mock({
        'dir/source': 'source content'
      });
    });
    afterEach(mock.restore);

    it('creates a readable stream', function() {
      const stream = fs.createReadStream('dir/source');
      assert.isTrue(stream.readable);
    });

    it('allows piping to a writable stream', function(done) {
      const input = fs.createReadStream('dir/source');
      const output = fs.createWriteStream('dir/dest');
      output.on('close', function() {
        fs.readFile('dir/dest', function(err, data) {
          if (err) {
            return done(err);
          }
          assert.equal(String(data), 'source content');
          done();
        });
      });
      output.on('error', done);

      input.pipe(output);
    });
  });

  describe('fs.createWriteStream(path[, options])', function() {
    beforeEach(function() {
      mock();
    });
    afterEach(mock.restore);

    it('provides a write stream for a file in buffered mode', function(done) {
      const output = fs.createWriteStream('test.txt');
      output.on('close', function() {
        fs.readFile('test.txt', function(err, data) {
          if (err) {
            return done(err);
          }
          assert.equal(String(data), 'lots of source content');
          done();
        });
      });
      output.on('error', done);

      // if output._writev is available, buffered multiple writes will hit _writev.
      // otherwise, hit multiple _write.
      output.write(bufferFrom('lots '));
      output.write(bufferFrom('of '));
      output.write(bufferFrom('source '));
      output.end(bufferFrom('content'));
    });

    it('provides a write stream for a file', function(done) {
      const output = fs.createWriteStream('test.txt');
      output.on('close', function() {
        fs.readFile('test.txt', function(err, data) {
          if (err) {
            return done(err);
          }
          assert.equal(String(data), 'lots of source content');
          done();
        });
      });
      output.on('error', done);

      output.write(bufferFrom('lots '));
      setTimeout(function() {
        output.write(bufferFrom('of '));
        setTimeout(function() {
          output.write(bufferFrom('source '));
          setTimeout(function() {
            output.end(bufferFrom('content'));
          }, 50);
        }, 50);
      }, 50);
    });

    if (Writable && Writable.prototype.cork) {
      it('works when write stream is corked', function(done) {
        const output = fs.createWriteStream('test.txt');
        output.on('close', function() {
          fs.readFile('test.txt', function(err, data) {
            if (err) {
              return done(err);
            }
            assert.equal(String(data), 'lots of source content');
            done();
          });
        });
        output.on('error', done);

        output.cork();
        output.write(bufferFrom('lots '));
        output.write(bufferFrom('of '));
        output.write(bufferFrom('source '));
        output.end(bufferFrom('content'));
        output.uncork();
      });
    }
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
});
