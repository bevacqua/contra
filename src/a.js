(function () {
  'use strict';

  function atoa (a) { return Array.prototype.slice.call(a); }
  function noop () {}
  var tick;

  var $ = {
    waterfall: function (steps, done) {
      function next () {
        var used;
        var d = done || noop;
        return function callback () {
          if (used) { return; }
          used = true;
          var args = atoa(arguments);
          var step = steps.shift();
          if (step) {
            var err = args.shift();
            if (err) { d(err); return; }
            args.push(next());
            step.apply(null, args);
          } else {
            d.apply(null, arguments);
          }
        };
      }
      next()();
    },
    parallel: function (tasks, done) {
      var a = tasks instanceof Array;
      var keys = a ? tasks : Object.keys(tasks);
      var complete;
      var completed = 0, all = keys.length;
      var results = a ? [] : {};
      keys.forEach(function iterator (key, i) {
        var k = a ? i : key;
        tick(tasks[k](next(k)));
      });

      function next (k) {
        var used;
        var d = done || noop;
        return function callback () {
          if (complete || used) { return; }
          used = true;
          var args = $.atoa(arguments);
          var err = args.shift();
          if (err) { complete = true; d(err); return; }
          results[k] = args.shift();
          if (++completed === all) {
            d(null, results);
          }
        };
      }
    }
  };

  // cross-platform ticks
  if (typeof process === 'undefined' || !process.nextTick) {
    if (typeof setImmediate === 'function') {
        tick = function tick (fn) { setImmediate(fn); };
    } else {
      tick = function tick (fn) { setTimeout(fn, 0); };
    }
  } else {
      if (typeof setImmediate !== 'undefined') {
          tick = setImmediate;
      } else {
          tick = process.nextTick;
      }
  }

  // cross-platform export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = $;
  } else if (typeof define !== 'undefined' && define.amd) {
    define([], function () { return $; });
  } else {
    window.a = $;
  }
})();
