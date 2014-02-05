(function (Object, root) {
  'use strict';

  // { name: 'core', dependencies: [] }
  var undef = 'undefined';
  var SERIAL = 1;
  var CONCURRENT = Infinity;
  function a (o) { return Object.prototype.toString.call(o) === '[object Array]'; }
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
  var tick, si = typeof setImmediate === 'function';
  if (typeof process === undef || !process.nextTick) {
    if (si) {
      tick = function tick (fn) { setImmediate(fn); };
    } else {
      tick = function tick (fn) { setTimeout(fn, 0); };
    }
  } else {
    tick = si ? setImmediate : process.nextTick;
  }

  // { name: 'curry', dependencies: ['core'] }
  function _curry () {
    var args = atoa(arguments);
    var method = args.shift();
    return function curried () {
      var more = atoa(arguments);
      method.apply(method, args.concat(more));
    };
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

  // { name: 'concurrent', dependencies: ['core'] }
  function _concurrent (tasks, concurrency, done) {
    if (!done) { done = concurrency; concurrency = CONCURRENT; }
    var d = once(done);
    var q = _queue(worker, concurrency);
    var keys = Object.keys(tasks);
    var results = a(tasks) ? [] : {};
    q.unshift(keys);
    q.on('drain', function completed () { d(null, results); });
    function worker (key, next) {
      cb(tasks[key], [proceed]);
      function proceed () {
        var args = atoa(arguments);
        if (handle(args, d)) { return; }
        results[key] = args.shift();
        next();
      }
    }
  }

  // { name: 'series', dependencies: ['concurrent'] }
  function _series (tasks, done) {
    _concurrent(tasks, SERIAL, done);
  }

  // { name: 'map', dependencies: ['concurrent'] }
  function _map (cap, then) {
    return function map (collection, concurrency, iterator, done) {
      if (arguments.length === 2) { iterator = concurrency; concurrency = CONCURRENT; }
      if (arguments.length === 3 && typeof concurrency !== 'number') { done = iterator; iterator = concurrency; concurrency = CONCURRENT; }
      var keys = Object.keys(collection);
      var tasks = a(collection) ? [] : {};
      keys.forEach(function insert (key) {
        tasks[key] = function iterate (cb) {
          iterator(collection[key], cb);
        };
      });
      _concurrent(tasks, cap || concurrency, then ? then(collection, done) : done);
    };
  }

  // { name: 'each', dependencies: ['map'] }
  function _each (concurrency) {
    return _map(concurrency, then);
    function then (collection, done) {
      return function mask (err) {
        done(err); // only return the error, no more arguments
      };
    }
  }

  // { name: 'filter', dependencies: ['map'] }
  function _filter (concurrency) {
    return _map(concurrency, then);
    function then (collection, done) {
      return function filter (err, results) {
        function exists (item, key) {
          return !!results[key];
        }
        function ofilter () {
          var filtered = {};
          Object.keys(collection).forEach(function omapper (key) {
            if (exists(null, key)) { filtered[key] = collection[key]; }
          });
          return filtered;
        }
        if (err) { done(err); return; }
        done(null, a(results) ? collection.filter(exists) : ofilter());
      };
    }
  }

  // { name: 'emitter', dependencies: ['core'] }
  function _emitter (thing) {
    var evt = {};
    thing.on = function (type, fn) {
      if (!evt[type]) {
        evt[type] = [fn];
      } else {
        evt[type].push(fn);
      }
    };
    thing.once = function (type, fn) {
      fn._once = true; // thing.off(fn) still works!
      thing.on(type, fn);
    };
    thing.off = function (type, fn) {
      var et = evt[type];
      if (!et) { return; }
      et.splice(et.indexOf(fn), 1);
    };
    thing.emit = function () {
      var args = atoa(arguments);
      var type = args.shift();
      var et = evt[type];
      if (type === 'error' && !et) { throw args.length === 1 ? args[0] : args; }
      if (!et) { return; }
      evt[type] = et.filter(function emitter (listen) {
        cb(listen, args);
        return !listen._once;
      });
    };
    return thing;
  }

  // { name: 'queue', dependencies: ['emitter'] }
  function _queue (worker, concurrency) {
    var q = [], load = 0, max = concurrency || 1, paused;
    var qq = _emitter({
      push: _add(false),
      unshift: _add(true),
      pause: function () { paused = true; },
      resume: function () { paused = false; cb(labor); },
      pending: q
    });
    if (Object.defineProperty && !Object.definePropertyPartial) {
      Object.defineProperty(qq, 'length', { get: function () { return q.length; } });
    }
    function _add (top) {
      var m = top ? 'unshift' : 'push';
      return function manipulate (task, done) {
        var tasks = a(task) ? task : [task];
        tasks.forEach(function insert (t) { q[m]({ t: t, done: done }); });
        cb(labor);
      };
    }
    function labor () {
      if (paused || (max !== CONCURRENT && load >= max)) { return; }
      if (!q.length) { if (load === 0) { qq.emit('drain'); } return; }
      load++;
      var job = q.pop();
      worker(job.t, once(complete.bind(null, job)));
      cb(labor);
    }
    function complete (job) {
      load--;
      cb(job.done, atoa(arguments).splice(1));
      cb(labor);
    }
    return qq;
  }

  // { name: 'outro', dependencies: ['core'] }
  var λ = {
    curry: _curry,
    concurrent: _concurrent,
    series: _series,
    waterfall: _waterfall,
    each: _each(),
    map: _map(),
    filter: _filter(),
    queue: _queue,
    emitter: _emitter
  };

  λ.each.series = _each(SERIAL);
  λ.map.series = _map(SERIAL);
  λ.filter.series = _filter(SERIAL);

  // cross-platform export
  if (typeof module !== undef && module.exports) {
    module.exports = λ;
  } else {
    root.contra = λ;
  }
})(Object, this);
