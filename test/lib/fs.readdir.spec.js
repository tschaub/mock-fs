'use strict';

const helper = require('../helper');
const fs = require('fs');
const mock = require('../../lib/index');
const path = require('path');

const assert = helper.assert;
const withPromise = helper.withPromise;
const inVersion = helper.inVersion;

describe('fs.readdir(path, callback)', function() {
  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content',
      nested: {
        sub: {
          dir: {
            'one.txt': 'one content',
            'two.txt': 'two content',
            empty: {}
          }
        }
      },
      denied: mock.directory({
        mode: 0o000,
        items: [
          {
            'one.txt': 'content'
          }
        ]
      })
    });
  });
  afterEach(mock.restore);

  it('lists directory contents', function(done) {
    fs.readdir(path.join('path', 'to'), function(err, items) {
      assert.isNull(err);
      assert.isArray(items);
      assert.deepEqual(items, ['file.txt']);
      done();
    });
  });

  it('supports Buffer input', function(done) {
    fs.readdir(Buffer.from(path.join('path', 'to')), function(err, items) {
      assert.isNull(err);
      assert.isArray(items);
      assert.deepEqual(items, ['file.txt']);
      done();
    });
  });

  withPromise.it('promise lists directory contents', function(done) {
    fs.promises.readdir(path.join('path', 'to')).then(function(items) {
      assert.isArray(items);
      assert.deepEqual(items, ['file.txt']);
      done();
    }, done);
  });

  it('lists nested directory contents', function(done) {
    fs.readdir(path.join('nested', 'sub', 'dir'), function(err, items) {
      assert.isNull(err);
      assert.isArray(items);
      assert.deepEqual(items, ['empty', 'one.txt', 'two.txt']);
      done();
    });
  });

  withPromise.it('promise lists nested directory contents', function(done) {
    fs.promises
      .readdir(path.join('nested', 'sub', 'dir'))
      .then(function(items) {
        assert.isArray(items);
        assert.deepEqual(items, ['empty', 'one.txt', 'two.txt']);
        done();
      }, done);
  });

  it('calls with an error for bogus path', function(done) {
    fs.readdir('bogus', function(err, items) {
      assert.instanceOf(err, Error);
      assert.isUndefined(items);
      done();
    });
  });

  withPromise.it('promise calls with an error for bogus path', function(done) {
    fs.promises.readdir('bogus').then(
      function() {
        done(new Error('should not succeed.'));
      },
      function(err) {
        assert.instanceOf(err, Error);
        done();
      }
    );
  });

  it('calls with an error for restricted path', function(done) {
    fs.readdir('denied', function(err, items) {
      assert.instanceOf(err, Error);
      assert.equal(err.code, 'EACCES');
      assert.isUndefined(items);
      done();
    });
  });

  withPromise.it('promise calls with an error for restricted path', function(
    done
  ) {
    fs.promises.readdir('denied').then(
      function() {
        done(new Error('should not succeed.'));
      },
      function(err) {
        assert.instanceOf(err, Error);
        assert.equal(err.code, 'EACCES');
        done();
      }
    );
  });

  inVersion('>=10.10').it('should support "withFileTypes" option', function(
    done
  ) {
    fs.readdir(
      path.join('nested', 'sub', 'dir'),
      {withFileTypes: true},
      function(err, items) {
        assert.isNull(err);
        assert.isArray(items);
        assert.deepEqual(items, [
          {name: 'empty'},
          {name: 'one.txt'},
          {name: 'two.txt'}
        ]);
        assert.ok(items[0].isDirectory());
        assert.ok(items[1].isFile());
        assert.ok(items[2].isFile());
        done();
      }
    );
  });

  withPromise.it('should support "withFileTypes" option', function(done) {
    fs.promises
      .readdir(path.join('nested', 'sub', 'dir'), {withFileTypes: true})
      .then(function(items) {
        assert.isArray(items);
        assert.deepEqual(items, [
          {name: 'empty'},
          {name: 'one.txt'},
          {name: 'two.txt'}
        ]);
        assert.ok(items[0].isDirectory());
        assert.ok(items[1].isFile());
        assert.ok(items[2].isFile());
        done();
      }, done);
  });

  inVersion('>=10.10').it(
    'should support "withFileTypes" option with "encoding" option',
    function(done) {
      fs.readdir(
        path.join('nested', 'sub', 'dir'),
        {withFileTypes: true, encoding: 'buffer'},
        function(err, items) {
          assert.isNull(err);
          assert.isArray(items);
          items.forEach(function(item) {
            assert.equal(Buffer.isBuffer(item.name), true);
          });
          const names = items.map(function(item) {
            return item.name.toString();
          });
          assert.deepEqual(names, ['empty', 'one.txt', 'two.txt']);
          assert.ok(items[0].isDirectory());
          assert.ok(items[1].isFile());
          assert.ok(items[2].isFile());
          done();
        }
      );
    }
  );

  withPromise.it(
    'should support "withFileTypes" option with "encoding" option',
    function(done) {
      fs.promises
        .readdir(path.join('nested', 'sub', 'dir'), {
          withFileTypes: true,
          encoding: 'buffer'
        })
        .then(function(items) {
          assert.isArray(items);
          items.forEach(function(item) {
            assert.equal(Buffer.isBuffer(item.name), true);
          });
          const names = items.map(function(item) {
            return item.name.toString();
          });
          assert.deepEqual(names, ['empty', 'one.txt', 'two.txt']);
          assert.ok(items[0].isDirectory());
          assert.ok(items[1].isFile());
          assert.ok(items[2].isFile());
          done();
        });
    }
  );
});

describe('fs.readdirSync(path)', function() {
  beforeEach(function() {
    mock({
      'path/to/file.txt': 'file content',
      nested: {
        sub: {
          dir: {
            'one.txt': 'one content',
            'two.txt': 'two content',
            empty: {}
          }
        }
      }
    });
  });
  afterEach(mock.restore);

  it('lists directory contents', function() {
    const items = fs.readdirSync(path.join('path', 'to'));
    assert.isArray(items);
    assert.deepEqual(items, ['file.txt']);
  });

  it('lists nested directory contents', function() {
    const items = fs.readdirSync(path.join('nested', 'sub', 'dir'));
    assert.isArray(items);
    assert.deepEqual(items, ['empty', 'one.txt', 'two.txt']);
  });

  it('throws for bogus path', function() {
    assert.throws(function() {
      fs.readdirSync('bogus');
    });
  });

  it('throws when access refused', function() {
    assert.throws(function() {
      fs.readdirSync('denied');
    });
  });
});
