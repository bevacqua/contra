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
    function next () {
      return once(function callback () {
        var args = atoa(arguments);
        var k = keys.shift();
        var step = tasks[k];
        if (step) {
          if (handle(args, done)) { return; }
          results[k] = args;
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
    var completed = 0, all = keys.length;
    var results = a(tasks) ? [] : {};
    keys.forEach(function iterator (key) { cb(tasks[key], [next(key)]); });
    function next (key) {
      var fn = once(function callback () {
        var args = $.atoa(arguments);
        if (handle(args, done, fn)) { return; }
        results[key] = args.shift();
        if (++completed === all) {
          cb(done, [results]);
        }
      });
      return fn;
    }
  }

  function _map (flow) {
    return function map (collection, transformer, done) {
      var keys = Object.keys(collection);
      var tasks = keys.map(function loop (key) {
        return function transform (transformed) {
          transformer(collection[key], transformed);
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
