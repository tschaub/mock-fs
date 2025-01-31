const fs = require('fs');
const path = require('path');

function numFiles(dir, items, callback) {
  const total = items.length;
  let files = 0;
  let completed = 0;

  if (total === 0) {
    callback(null, 0);
  }
  items.forEach(function (item) {
    fs.stat(path.join(dir, item), function (err, stats) {
      if (err) {
        return callback(err);
      }
      if (stats && stats.isFile()) {
        ++files;
      }
      ++completed;
      if (completed === total) {
        callback(null, files);
      }
    });
  });
}

/**
 * Count the number of files in a directory.
 * @param {string} dir Path to directory.
 * @param {function(Error, number):void} callback Callback.
 */
module.exports = function (dir, callback) {
  fs.readdir(dir, function (err, items) {
    if (err) {
      return callback(err);
    }
    numFiles(dir, items, callback);
  });
};
