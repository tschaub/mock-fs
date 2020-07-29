const realBinding = process.binding('fs');
let storedBinding;

/**
 * Perform action, bypassing mock FS
 * @example
 * // This file exists on the real FS, not on the mocked FS
 * const filePath = '/path/file.json';
 * const data = mock.bypass(() => fs.readFileSync(filePath, 'utf-8'));
 */
exports = module.exports = function bypass(fn) {
  if (typeof fn !== 'function') {
    throw new Error(`Must provide a function to perform for mock.bypass()`);
  }

  // Deactivate mocked bindings
  exports.disable();
  delete realBinding._mockedBinding;

  let res;
  try {
    res = fn(); // Perform action
  } finally {
    exports.enable();
  }

  if (res.then) {
    // eslint-disable-next-line no-console
    console.warn(
      `Async functions are not supported with exports.bypass(). See https://github.com/tschaub/mock-fs/#advancedbypass`
    );
  }

  return res;
};

/**
 * Temporarily disable Mocked FS
 */
exports.disable = () => {
  storedBinding = realBinding._mockedBinding;
  delete realBinding._mockedBinding;
};

/**
 * Enables Mocked FS after being disabled by mock.disable()
 */
exports.enable = () => {
  if (storedBinding) {
    realBinding._mockedBinding = storedBinding;
    storedBinding = undefined;
  }
};
