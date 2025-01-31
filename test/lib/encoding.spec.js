const fs = require('fs');
const {afterEach, beforeEach, describe, it} = require('mocha');
const mock = require('../../lib/index.js');
const helper = require('../helper.js');

const assert = helper.assert;

const CHARS = [
  // // 1 utf-16, 1 utf-8 byte
  'A',

  // 1 utf-16 code unit, 3 utf-8 bytes
  '’',

  // // 2 utf-16 code units, 4 utf-8 bytes
  '😄',
];

const ENCODINGS = ['utf8', 'utf16le', 'latin1'];

for (const encoding of ENCODINGS) {
  for (const char of CHARS) {
    describe(`Encoding (${encoding} ${char})`, () => {
      const buffer = Buffer.from(char, encoding);

      beforeEach(() => mock());
      afterEach(() => mock.restore());

      beforeEach(() => fs.writeFileSync('file', char, {encoding}));

      it(`writes ${buffer.length} bytes`, () => {
        assert.strictEqual(fs.statSync('file').size, buffer.length);
      });

      it('reads the written value (buffer)', () => {
        const out = fs.readFileSync('file');
        assert.sameOrderedMembers(Array.from(out), Array.from(buffer));
      });
    });
  }
}
