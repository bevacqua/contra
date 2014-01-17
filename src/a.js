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
        var args = atoa(arguments);console.log('ARG',args)
        var k = keys.shift();console.log('K',k)
        var step = tasks[k];
        if (step) {console.log('STEP',step)
          if (handle(args, done)) { return; }
          if (k) { results[k] = args[0]; console.log(args[0], 'r',k) }
          cb(step, [next()]);
        } else {console.log(results, 'd')
          cb(done, [null, results]);
        }
      });
    }
    keys.unshift(null);
    next()();
  }

  function _parallel (tasks, done) {
      var a = tasks instanceof Array;
      var keys = a ? tasks : Object.keys(tasks);
      var complete;
      var completed = 0, all = keys.length;
      var results = a ? [] : {};
      keys.forEach(function (key, i) {
        var k = a ? i : key;
        setTimeout(tasks[k](next(k)), 0);
      });

      function next (k) {
        var used;
        return function (err) {
          if (complete || used) { return; }
          used = true;
          var args = atoa(arguments);
          var err = args.shift();
          if (err) { complete = true; done(err); return; }
          results[k] = args.shift();
          if (++completed === all) {
            done(null, results);
          }
        }
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
