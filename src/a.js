(function () {
  'use strict';

  // core
  function a (o) { return o instanceof Array; }
  function atoa (a) { return Array.prototype.slice.call(a); }
  function cb (fn, args) { if (!fn) { return; } tick(function run () { fn.apply(null, args); }); }
  function once (fn) {
    var disposed;
    function disposable () {
      if (disposed) { return; }
      disposed = true;
      fn.apply(null, arguments);
    }
    disposable.discard = function () { disposed = true; };
    return disposable;
  }
  function handle (args, done, disposable) {
    var err = args.shift();
    if (err) { if (disposable) { disposable.discard(); } cb(done, [err]); return true; }
  }

  var tick;

  // methods
  function _waterfall (steps, done) {
    function next () {
      return once(function callback () {
        var args = atoa(arguments);
        var step = steps.shift();
        if (step) {
          if (handle(args, done)) { return; }
          args.push(next());
          cb(step, args);
        } else {
          cb(done, arguments);
        }
      });
    }
    next()();
  }

  function _series (tasks, done) {
    var keys = Object.keys(tasks);
    var results = a(tasks) ? [] : {};
    var pk;
    function next () {
      return once(function callback () {
        var k = keys.shift();
        var args = atoa(arguments);
        var step = tasks[k];
        if (pk) {
          if (handle(args, done)) { return; }
          results[pk] = args.shift();
        }
        pk = k;
        if (step) {
          cb(step, [next()]);
        } else {
          cb(done, [null, results]);
        }
      });
    }
    next()();
  }

  function _parallel (tasks, done) {
    var keys = Object.keys(tasks);
    var results = a(tasks) ? [] : {};
    var completed = 0, all = keys.length;
    keys.forEach(function iterator (key) { cb(tasks[key], [next(key)]); });
    function next (k) {
      var fn = once(function callback () {
        var args = atoa(arguments);
        if (handle(args, done, fn)) { return; }
        results[k] = args.shift();
        if (++completed === all) {
          cb(done, [null, results]);
        }
      });
      return fn;
    }
  }

  function _map (flow) {
    return function map (collection, transformer, done) {
      var keys = Object.keys(collection);
      var tasks = a(collection) ? [] : {};
      keys.forEach(function iterator (key) {
        tasks[key] = function transform (cb) {
          transformer(collection[key], cb);
        };
      });
      flow(tasks, done);
    };
  }

  // api
  var $ = {
    waterfall: _waterfall,
    series: _series,
    parallel: _parallel,
    map: _map(_parallel),
    mapSeries: _map(_series)
  };

  // cross-platform ticks
  if (typeof process === 'undefined' || !process.nextTick) {
    if (typeof setImmediate === 'function') {
      tick = function tick (fn) { setImmediate(fn); };
    } else {
      tick = function tick (fn) { setTimeout(fn, 0); };
    }
  } else {
    tick = typeof setImmediate === 'function' ? setImmediate : process.nextTick;
  }

  // cross-platform export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = $;
  } else if (typeof define !== 'undefined' && define.amd) {
    define([], function amd () { return $; });
  } else {
    window.a = $;
  }
})();
