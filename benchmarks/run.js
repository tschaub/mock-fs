var fs = require('fs');
var path = require('path');

function noop(done) {
  process.nextTick(done);
}


function measure(bench, duration, callback) {
  var beforeEach = bench.beforeEach || noop;
  var afterEach = bench.afterEach || noop;

  var cumulative = 0;

  function iterate(completed) {
    if (cumulative / 1e9 > duration) {
      return callback(null, completed, cumulative);
    }
    beforeEach(function(beforeEachErr) {
      if (beforeEachErr) {
        return callback(beforeEachErr);
      }
      try {
        var time = process.hrtime();
        bench.test(function(testErr) {
          var diff = process.hrtime(time);
          cumulative += diff[0] * 1e9 + diff[1];
          ++completed;
          if (testErr) {
            return callback(testErr);
          }
          afterEach(function(afterEachErr) {
            if (afterEachErr) {
              return callback(afterEachErr);
            }
            setImmediate(function() {
              iterate(completed);
            });
          });
        });
      } catch (testErr) {
        return callback(testErr);
      }
    });
  }
  iterate(0);
}

function run(paths, num) {
  var name = paths[num];
  if (!name) {
    process.exit(0);
  }
  var bench = require(name);
  measure(bench, 1, function(err, completed, cumulative) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('%s %d ops/sec',
        path.basename(name), Math.floor(completed / (cumulative / 1e9)));
    ++num;
    run(paths, num);
  });
}

// run all .js in the tests dir
fs.readdir(path.join(__dirname, 'tests'), function(err, files) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  var paths = files.filter(function(name) {
    return /\.js$/.test(name);
  }).map(function(name) {
    return path.join(__dirname, 'tests', name);
  });
  run(paths, 0);
});
