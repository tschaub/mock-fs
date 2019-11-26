'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');

const assert = helper.assert;
const withPromise = helper.withPromise;

if (fs.copyFile && fs.copyFileSync) {
  describe('fs.copyFile(src, dest[, flags], callback)', function() {
    beforeEach(function() {
      mock({
        'path/to/src.txt': 'file content',
        'path/to/other.txt': 'other file content',
        empty: {}
      });
    });
    afterEach(mock.restore);

    it('copies a file to an empty directory', function(done) {
      fs.copyFile('path/to/src.txt', 'empty/dest.txt', function(err) {
        assert.isTrue(!err);
        assert.isTrue(fs.existsSync('empty/dest.txt'));
        assert.equal(String(fs.readFileSync('empty/dest.txt')), 'file content');
        done();
      });
    });

    withPromise.it('promise copies a file to an empty directory', function(
      done
    ) {
      fs.promises
        .copyFile('path/to/src.txt', 'empty/dest.txt')
        .then(function() {
          assert.isTrue(fs.existsSync('empty/dest.txt'));
          assert.equal(
            String(fs.readFileSync('empty/dest.txt')),
            'file content'
          );
          done();
        }, done);
    });

    it('truncates dest file if it exists', function(done) {
      fs.copyFile('path/to/src.txt', 'path/to/other.txt', function(err) {
        assert.isTrue(!err);
        assert.equal(
          String(fs.readFileSync('path/to/other.txt')),
          'file content'
        );
        done();
      });
    });

    withPromise.it('promise truncates dest file if it exists', function(done) {
      fs.promises
        .copyFile('path/to/src.txt', 'path/to/other.txt')
        .then(function() {
          assert.equal(
            String(fs.readFileSync('path/to/other.txt')),
            'file content'
          );
          done();
        }, done);
    });

    it('throws if dest exists and exclusive', function(done) {
      fs.copyFile(
        'path/to/src.txt',
        'path/to/other.txt',
        fs.constants.COPYFILE_EXCL,
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EEXIST');
          done();
        }
      );
    });

    withPromise.it('promise throws if dest exists and exclusive', function(
      done
    ) {
      fs.promises
        .copyFile(
          'path/to/src.txt',
          'path/to/other.txt',
          fs.constants.COPYFILE_EXCL
        )
        .then(
          function() {
            assert.fail('should not succeed.');
            done();
          },
          function(err) {
            assert.instanceOf(err, Error);
            assert.equal(err.code, 'EEXIST');
            done();
          }
        );
    });

    it('fails if src does not exist', function(done) {
      fs.copyFile('path/to/bogus.txt', 'empty/dest.txt', function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      });
    });

    withPromise.it('promise fails if src does not exist', function(done) {
      fs.promises.copyFile('path/to/bogus.txt', 'empty/dest.txt').then(
        function() {
          assert.fail('should not succeed.');
          done();
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'ENOENT');
          done();
        }
      );
    });

    it('fails if dest path does not exist', function(done) {
      fs.copyFile('path/to/src.txt', 'path/nope/dest.txt', function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'ENOENT');
        done();
      });
    });

    withPromise.it('promise fails if dest path does not exist', function(done) {
      fs.promises.copyFile('path/to/src.txt', 'path/nope/dest.txt').then(
        function() {
          assert.fail('should not succeed.');
          done();
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'ENOENT');
          done();
        }
      );
    });

    it('fails if dest is a directory', function(done) {
      fs.copyFile('path/to/src.txt', 'empty', function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EISDIR');
        done();
      });
    });

    withPromise.it('promise fails if dest is a directory', function(done) {
      fs.promises.copyFile('path/to/src.txt', 'empty').then(
        function() {
          assert.fail('should not succeed.');
          done();
        },
        function(err) {
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'EISDIR');
          done();
        }
      );
    });
  });
}
