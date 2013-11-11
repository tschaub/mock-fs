var chai = require('chai');


/** @type {boolean} */
chai.Assertion.includeStack = true;


/**
 * Chai's assert function configured to include stacks on failure.
 * @type {function}
 */
exports.assert = chai.assert;
