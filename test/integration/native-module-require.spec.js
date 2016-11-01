/**
 * native-module MUST have been pre-required by mocha in order for this test to
 * fail properly.
 */
describe('native module re-requires', function() {
  it('should work', function() {
    require('../../lib/index');
    require('native-module/hello');
  });
});
