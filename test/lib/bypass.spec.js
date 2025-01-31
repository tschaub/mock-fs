const fs = require('fs');
const path = require('path');
const {afterEach, describe, it} = require('mocha');
const mock = require('../../lib/index.js');
const helper = require('../helper.js');

const assert = helper.assert;

describe('mock.bypass()', () => {
  afterEach(mock.restore);

  it('runs a synchronous function using the real filesystem', () => {
    mock({'/path/to/file': 'content'});

    assert.equal(fs.readFileSync('/path/to/file', 'utf-8'), 'content');
    assert.isNotOk(fs.existsSync(__filename));
    assert.isOk(mock.bypass(() => fs.existsSync(__filename)));

    assert.isNotOk(fs.existsSync(__filename));
  });

  it('handles functions that throw', () => {
    mock({'/path/to/file': 'content'});

    const error = new Error('oops');

    assert.throws(() => {
      mock.bypass(() => {
        assert.isFalse(fs.existsSync('/path/to/file'));
        throw error;
      });
    }, error);

    assert.equal(fs.readFileSync('/path/to/file', 'utf8'), 'content');
  });

  it('bypasses patched process.cwd() and process.chdir()', () => {
    const originalCwd = process.cwd();
    mock({
      dir: {},
    });

    process.chdir('dir');
    assert.equal(process.cwd(), path.join(originalCwd, 'dir'));

    mock.bypass(() => {
      assert.equal(process.cwd(), originalCwd);
      process.chdir('lib');
      assert.equal(process.cwd(), path.join(originalCwd, 'lib'));
      process.chdir('..');
      assert.equal(process.cwd(), originalCwd);
    });
    assert.equal(process.cwd(), path.join(originalCwd, 'dir'));
    mock.restore();

    assert.equal(process.cwd(), originalCwd);
  });

  it('runs an async function using the real filesystem', (done) => {
    mock({'/path/to/file': 'content'});

    assert.equal(fs.readFileSync('/path/to/file', 'utf8'), 'content');
    assert.isFalse(fs.existsSync(__filename));

    mock
      .bypass(() => fs.promises.stat(__filename))
      .then((stat) => {
        assert.isTrue(stat.isFile());
        assert.isFalse(fs.existsSync(__filename));
        done();
      })
      .catch(done);
  });

  it('handles promise rejection', (done) => {
    mock({'/path/to/file': 'content'});

    assert.equal(fs.readFileSync('/path/to/file', 'utf8'), 'content');
    assert.isFalse(fs.existsSync(__filename));

    const error = new Error('oops');

    mock
      .bypass(() => {
        assert.isTrue(fs.existsSync(__filename));
        return Promise.reject(error);
      })
      .then(() => {
        done(new Error('should not succeed'));
      })
      .catch((err) => {
        assert.equal(err, error);

        assert.equal(fs.readFileSync('/path/to/file', 'utf8'), 'content');
        done();
      });
  });
});
