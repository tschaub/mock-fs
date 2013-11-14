var path = require('path');

var mock = require('../../lib/index');
var assert = require('../helper').assert;

describe('The API', function() {

  describe('fs()', function() {

    it('configures a fs module with a mock file system', function(done) {

      var fs = mock.fs({
        'path/to/file.txt': 'file content'
      });

      fs.exists('path/to/file.txt', function(exists) {
        assert.isTrue(exists);
        done();
      });

    });

    it('accepts an arbitrary nesting of files and directories', function() {

      var fs = mock.fs({
        'dir-one': {
          'dir-two': {
            'some-file.txt': 'file content here'
          }
        },
        'empty-dir': {}
      });

      assert.isTrue(fs.existsSync('dir-one/dir-two/some-file.txt'));
      assert.isTrue(fs.statSync('dir-one/dir-two/some-file.txt').isFile());
      assert.isTrue(fs.statSync('dir-one/dir-two').isDirectory());
      assert.isTrue(fs.statSync('empty-dir').isDirectory());

    });

  });

  describe('file()', function() {

    it('lets you create files with additional properties', function(done) {

      var fs = mock.fs({
        'path/to/file.txt': mock.file({
          content: 'file content',
          mtime: new Date(8675309),
          mode: 0644
        })
      });

      fs.stat('path/to/file.txt', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isTrue(stats.isFile());
        assert.isFalse(stats.isDirectory());
        assert.equal(stats.mtime.getTime(), 8675309);
        assert.equal(stats.mode & 0777, 0644);
        done();
      });

    });

  });

  describe('directory()', function() {

    it('lets you create directories with more properties', function(done) {

      var fs = mock.fs({
        'path/to/dir': mock.directory({
          mtime: new Date(8675309),
          mode: 0644
        })
      });

      fs.stat('path/to/dir', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.isFalse(stats.isFile());
        assert.isTrue(stats.isDirectory());
        assert.equal(stats.mtime.getTime(), 8675309);
        assert.equal(stats.mode & 0777, 0644);
        done();
      });

    });

  });

});
