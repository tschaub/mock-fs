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

  exports.disable();

  try {
    // Perform action
    const res = fn();

    // Handle promise return
    if (res.then) {
      res.then(exports.enable);
      res.catch(exports.enable);
    } else {
      exports.enable();
    }

    return res;
  } catch (e) {
    exports.enable();
    throw e;
  }
};

/**
 * Temporarily disable Mocked FS
 */
exports.disable = () => {
  if (realBinding._mockedBinding) {
    storedBinding = realBinding._mockedBinding;
    delete realBinding._mockedBinding;
  }
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
