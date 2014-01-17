(function () {
  'use strict';

  // { name: 'core', dependencies: ['none'] }
  function a (o) { return o instanceof Array; }
  function atoa (a) { return Array.prototype.slice.call(a); }
  function cb (fn, args, ctx) { if (!fn) { return; } tick(function run () { fn.apply(ctx || null, args || []); }); }
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

  // cross-platform ticker
  var tick;
  if (typeof process === 'undefined' || !process.nextTick) {
    if (typeof setImmediate === 'function') {
      tick = function tick (fn) { setImmediate(fn); };
    } else {
      tick = function tick (fn) { setTimeout(fn, 0); };
    }
  } else {
    tick = typeof setImmediate === 'function' ? setImmediate : process.nextTick;
  }

  // { name: 'waterfall', dependencies: ['core'] }
  function _waterfall (steps, done) {
    function next () {
      var d = once(done);
      return once(function callback () {
        var args = atoa(arguments);
        var step = steps.shift();
        if (step) {
          if (handle(args, d)) { return; }
          args.push(next());
          cb(step, args);
        } else {
          cb(d, arguments);
        }
      });
    }
    next()();
  }

  // { name: 'series', dependencies: ['core'] }
  function _series (tasks, done) {
    var d = once(done);
    var keys = Object.keys(tasks);
    var results = a(tasks) ? [] : {};
    var pk;
    function next () {
      return once(function callback () {
        var k = keys.shift();
        var args = atoa(arguments);
        var step = tasks[k];
        if (pk) {
          if (handle(args, d)) { return; }
          results[pk] = args.shift();
        }
        pk = k;
        if (step) {
          cb(step, [next()]);
        } else {
          cb(d, [null, results]);
        }
      });
    }
    next()();
  }

  // { name: 'concurrent', dependencies: ['core'] }
  function _concurrent (tasks, done) {
    var d = once(done);
    var keys = Object.keys(tasks);
    var results = a(tasks) ? [] : {};
    var completed = 0, all = keys.length;
    keys.forEach(function iterator (key) { cb(tasks[key], [next(key)]); });
    function next (k) {
      var fn = once(function callback () {
        var args = atoa(arguments);
        if (handle(args, d, fn)) { return; }
        results[k] = args.shift();
        if (++completed === all) {
          cb(d, [null, results]);
        }
      });
      return fn;
    }
  }

  // { name: 'map', dependencies: ['series' or 'concurrent'] }
  function _map (flow, finish) {
    return function map (collection, iterator, done) {
      var keys = Object.keys(collection);
      var tasks = a(collection) ? [] : {};
      keys.forEach(function insert (key) {
        tasks[key] = function iterate (cb) {
          iterator(collection[key], cb);
        };
      });
      flow(tasks, finish ? finish(done) : done);
    };
  }

  // dependencies: ['map']
  function _each (flow) {
    _map(flow, finish);
    function finish (done) {
      return function (err) {
        done(err); // only return an optional error
      };
    }
  }

  // { name: 'emitter', dependencies: ['core'] }
  function _emitter (thing) {
    /* jshint validthis:true */
    var me = this;
    var sub = {};
    thing.on = function (type, fn) {
      if (!sub[type]) {
        sub[type] = [fn];
      } else {
        sub[type].push(fn);
      }
    };
    thing.emit = function () {
      var args = atoa(arguments);
      var type = args.shift();
      var st = sub[type];
      if (type === 'error' && !st) { throw args.length === 1 ? args[0] : args; }
      if (!st) { return; }
      st.forEach(function (s) { cb(s, args, me); });
    };
  }

  // { name: 'queue', dependencies: ['core'] }
  var _queue = function (worker, concurrency) {
    var q = [], load = 0, max = concurrency || 1;
    function _add (task, top, done) {
      var m = top ? 'unshift' : 'push';
      var tasks = task instanceof Array ? task : [task];
      tasks.forEach(function insert (t) { q[m]({ t: t, done: done }); });
      cb(labor);
    }
    function labor () {
      if (load >= max || !q.length) { return; }
      load++;
      var job = q.pop();
      worker(job.t, once(complete.bind(null, job)));
    }
    function complete (job, err) {
      load--;
      cb(job.done, [err]);
      cb(labor);
    }
    return {
      push: function (task, done) { _add(task, false, done); },
      unshift: function (task, done) { _add(task, true, done); },
      get length () { return q.length; }
    };
  };

  // { name: 'outro', dependencies: ['core'] }
  var $ = {
    waterfall: _waterfall,
    series: _series,
    concurrent: _concurrent,
    map: _map(_concurrent),
    queue: _queue,
    emitter: _emitter
  };

  $.map.series = _map(_series);

  // cross-platform export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = $;
  } else if (typeof define !== 'undefined' && define.amd) {
    define([], function amd () { return $; });
  } else {
    window.a = $;
  }
})();
