(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.contra = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function atoa (a, n) { return Array.prototype.slice.call(a, n); }

},{}],2:[function(require,module,exports){
var si = typeof setImmediate === 'function', tick;
if (si) {
  tick = function (fn) { setImmediate(fn); };
} else {
  tick = function (fn) { setTimeout(fn, 0); };
}

module.exports = tick;
},{}],3:[function(require,module,exports){
module.exports = Infinity;

},{}],4:[function(require,module,exports){
module.exports = 1;

},{}],5:[function(require,module,exports){
'use strict';

var _map = require('./_map');

module.exports = function each (concurrency) {
  return _map(concurrency, then);
  function then (collection, done) {
    return function mask (err) {
      done(err); // only return the error, no more arguments
    };
  }
};

},{"./_map":7}],6:[function(require,module,exports){
'use strict';

var a = require('./a');
var _map = require('./_map');

module.exports = function filter (concurrency) {
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
};

},{"./_map":7,"./a":8}],7:[function(require,module,exports){
'use strict';

var a = require('./a');
var once = require('./once');
var concurrent = require('./concurrent');
var CONCURRENTLY = require('./CONCURRENTLY');
var SERIAL = require('./SERIAL');

module.exports = function _map (cap, then, attached) {
  function api (collection, concurrency, iterator, done) {
    var args = arguments;
    if (args.length === 2) { iterator = concurrency; concurrency = CONCURRENTLY; }
    if (args.length === 3 && typeof concurrency !== 'number') { done = iterator; iterator = concurrency; concurrency = CONCURRENTLY; }
    var keys = Object.keys(collection);
    var tasks = a(collection) ? [] : {};
    keys.forEach(function insert (key) {
      tasks[key] = function iterate (cb) {
        if (iterator.length === 3) {
          iterator(collection[key], key, cb);
        } else {
          iterator(collection[key], cb);
        }
      };
    });
    concurrent(tasks, cap || concurrency, then ? then(collection, once(done)) : done);
  }
  if (!attached) { api.series = _map(SERIAL, then, true); }
  return api;
};

},{"./CONCURRENTLY":3,"./SERIAL":4,"./a":8,"./concurrent":9,"./once":19}],8:[function(require,module,exports){
'use strict';

module.exports = function a (o) { return Object.prototype.toString.call(o) === '[object Array]'; };

},{}],9:[function(require,module,exports){
'use strict';

var atoa = require('atoa');
var a = require('./a');
var once = require('./once');
var queue = require('./queue');
var errored = require('./errored');
var debounce = require('./debounce');
var CONCURRENTLY = require('./CONCURRENTLY');

module.exports = function concurrent (tasks, concurrency, done) {
  if (typeof concurrency === 'function') { done = concurrency; concurrency = CONCURRENTLY; }
  var d = once(done);
  var q = queue(worker, concurrency);
  var keys = Object.keys(tasks);
  var results = a(tasks) ? [] : {};
  q.unshift(keys);
  q.on('drain', function completed () { d(null, results); });
  function worker (key, next) {
    debounce(tasks[key], [proceed]);
    function proceed () {
      var args = atoa(arguments);
      if (errored(args, d)) { return; }
      results[key] = args.shift();
      next();
    }
  }
};

},{"./CONCURRENTLY":3,"./a":8,"./debounce":12,"./errored":15,"./once":19,"./queue":20,"atoa":1}],10:[function(require,module,exports){
'use strict';

module.exports = {
  curry: require('./curry'),
  concurrent: require('./concurrent'),
  series: require('./series'),
  waterfall: require('./waterfall'),
  each: require('./each'),
  map: require('./map'),
  filter: require('./filter'),
  queue: require('./queue'),
  emitter: require('./emitter')
};

},{"./concurrent":9,"./curry":11,"./each":13,"./emitter":14,"./filter":16,"./map":17,"./queue":20,"./series":21,"./waterfall":22}],11:[function(require,module,exports){
'use strict';

var atoa = require('atoa');

module.exports = function curry () {
  var args = atoa(arguments);
  var method = args.shift();
  return function curried () {
    var more = atoa(arguments);
    method.apply(method, args.concat(more));
  };
};

},{"atoa":1}],12:[function(require,module,exports){
'use strict';

var ticky = require('ticky');

module.exports = function debounce (fn, args, ctx) {
  if (!fn) { return; }
  ticky(function run () {
    fn.apply(ctx || null, args || []);
  });
};

},{"ticky":2}],13:[function(require,module,exports){
'use strict';

module.exports = require('./_each')();

},{"./_each":5}],14:[function(require,module,exports){
'use strict';

var atoa = require('atoa');
var debounce = require('./debounce');

module.exports = function emitter (thing, options) {
  var opts = options || {};
  var evt = {};
  if (thing === undefined) { thing = {}; }
  thing.on = function (type, fn) {
    if (!evt[type]) {
      evt[type] = [fn];
    } else {
      evt[type].push(fn);
    }
    return thing;
  };
  thing.once = function (type, fn) {
    fn._once = true; // thing.off(fn) still works!
    thing.on(type, fn);
    return thing;
  };
  thing.off = function (type, fn) {
    var c = arguments.length;
    if (c === 1) {
      delete evt[type];
    } else if (c === 0) {
      evt = {};
    } else {
      var et = evt[type];
      if (!et) { return thing; }
      et.splice(et.indexOf(fn), 1);
    }
    return thing;
  };
  thing.emit = function () {
    var args = atoa(arguments);
    return thing.emitterSnapshot(args.shift()).apply(this, args);
  };
  thing.emitterSnapshot = function (type) {
    var et = (evt[type] || []).slice(0);
    return function () {
      var args = atoa(arguments);
      var ctx = this || thing;
      if (type === 'error' && opts.throws !== false && !et.length) { throw args.length === 1 ? args[0] : args; }
      et.forEach(function emitter (listen) {
        if (opts.async) { debounce(listen, args, ctx); } else { listen.apply(ctx, args); }
        if (listen._once) { thing.off(type, listen); }
      });
      return thing;
    };
  };
  return thing;
};

},{"./debounce":12,"atoa":1}],15:[function(require,module,exports){
'use strict';

var debounce = require('./debounce');

module.exports = function errored (args, done, disposable) {
  var err = args.shift();
  if (err) { if (disposable) { disposable.discard(); } debounce(done, [err]); return true; }
};

},{"./debounce":12}],16:[function(require,module,exports){
'use strict';

module.exports = require('./_filter')();

},{"./_filter":6}],17:[function(require,module,exports){
'use strict';

module.exports = require('./_map')();

},{"./_map":7}],18:[function(require,module,exports){
'use strict';

module.exports = function noop () {};

},{}],19:[function(require,module,exports){
'use strict';

var noop = require('./noop');

module.exports = function once (fn) {
  var disposed;
  function disposable () {
    if (disposed) { return; }
    disposed = true;
    (fn || noop).apply(null, arguments);
  }
  disposable.discard = function () { disposed = true; };
  return disposable;
};

},{"./noop":18}],20:[function(require,module,exports){
'use strict';

var atoa = require('atoa');
var a = require('./a');
var once = require('./once');
var emitter = require('./emitter');
var debounce = require('./debounce');

module.exports = function queue (worker, concurrency) {
  var q = [], load = 0, max = concurrency || 1, paused;
  var qq = emitter({
    push: manipulate.bind(null, 'push'),
    unshift: manipulate.bind(null, 'unshift'),
    pause: function pause () { paused = true; },
    resume: function resume () { paused = false; debounce(labor); },
    pending: q
  });
  if (Object.defineProperty && !Object.definePropertyPartial) {
    Object.defineProperty(qq, 'length', { get: function getter () { return q.length; } });
  }
  function manipulate (how, task, done) {
    var tasks = a(task) ? task : [task];
    tasks.forEach(function insert (t) { q[how]({ t: t, done: done }); });
    debounce(labor);
  }
  function labor () {
    if (paused || load >= max) { return; }
    if (!q.length) { if (load === 0) { qq.emit('drain'); } return; }
    load++;
    var job = q.pop();
    worker(job.t, once(complete.bind(null, job)));
    debounce(labor);
  }
  function complete (job) {
    load--;
    debounce(job.done, atoa(arguments, 1));
    debounce(labor);
  }
  return qq;
};

},{"./a":8,"./debounce":12,"./emitter":14,"./once":19,"atoa":1}],21:[function(require,module,exports){
'use strict';

var concurrent = require('./concurrent');
var SERIAL = require('./SERIAL');

module.exports = function series (tasks, done) {
  concurrent(tasks, SERIAL, done);
};

},{"./SERIAL":4,"./concurrent":9}],22:[function(require,module,exports){
'use strict';

var atoa = require('atoa');
var once = require('./once');
var errored = require('./errored');
var debounce = require('./debounce');

module.exports = function waterfall (steps, done) {
  var d = once(done);
  function next () {
    var args = atoa(arguments);
    var step = steps.shift();
    if (step) {
      if (errored(args, d)) { return; }
      args.push(once(next));
      debounce(step, args);
    } else {
      debounce(d, arguments);
    }
  }
  next();
};

},{"./debounce":12,"./errored":15,"./once":19,"atoa":1}]},{},[10])(10)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXRvYS9hdG9hLmpzIiwibm9kZV9tb2R1bGVzL3RpY2t5L3RpY2t5LWJyb3dzZXIuanMiLCJzcmMvQ09OQ1VSUkVOVExZLmpzIiwic3JjL1NFUklBTC5qcyIsInNyYy9fZWFjaC5qcyIsInNyYy9fZmlsdGVyLmpzIiwic3JjL19tYXAuanMiLCJzcmMvYS5qcyIsInNyYy9jb25jdXJyZW50LmpzIiwic3JjL2NvbnRyYS5qcyIsInNyYy9jdXJyeS5qcyIsInNyYy9kZWJvdW5jZS5qcyIsInNyYy9lYWNoLmpzIiwic3JjL2VtaXR0ZXIuanMiLCJzcmMvZXJyb3JlZC5qcyIsInNyYy9maWx0ZXIuanMiLCJzcmMvbWFwLmpzIiwic3JjL25vb3AuanMiLCJzcmMvb25jZS5qcyIsInNyYy9xdWV1ZS5qcyIsInNyYy9zZXJpZXMuanMiLCJzcmMvd2F0ZXJmYWxsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdG9hIChhLCBuKSB7IHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhLCBuKTsgfVxuIiwidmFyIHNpID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJywgdGljaztcbmlmIChzaSkge1xuICB0aWNrID0gZnVuY3Rpb24gKGZuKSB7IHNldEltbWVkaWF0ZShmbik7IH07XG59IGVsc2Uge1xuICB0aWNrID0gZnVuY3Rpb24gKGZuKSB7IHNldFRpbWVvdXQoZm4sIDApOyB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRpY2s7IiwibW9kdWxlLmV4cG9ydHMgPSBJbmZpbml0eTtcbiIsIm1vZHVsZS5leHBvcnRzID0gMTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9tYXAgPSByZXF1aXJlKCcuL19tYXAnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlYWNoIChjb25jdXJyZW5jeSkge1xuICByZXR1cm4gX21hcChjb25jdXJyZW5jeSwgdGhlbik7XG4gIGZ1bmN0aW9uIHRoZW4gKGNvbGxlY3Rpb24sIGRvbmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gbWFzayAoZXJyKSB7XG4gICAgICBkb25lKGVycik7IC8vIG9ubHkgcmV0dXJuIHRoZSBlcnJvciwgbm8gbW9yZSBhcmd1bWVudHNcbiAgICB9O1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYSA9IHJlcXVpcmUoJy4vYScpO1xudmFyIF9tYXAgPSByZXF1aXJlKCcuL19tYXAnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmaWx0ZXIgKGNvbmN1cnJlbmN5KSB7XG4gIHJldHVybiBfbWFwKGNvbmN1cnJlbmN5LCB0aGVuKTtcbiAgZnVuY3Rpb24gdGhlbiAoY29sbGVjdGlvbiwgZG9uZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiBmaWx0ZXIgKGVyciwgcmVzdWx0cykge1xuICAgICAgZnVuY3Rpb24gZXhpc3RzIChpdGVtLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuICEhcmVzdWx0c1trZXldO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gb2ZpbHRlciAoKSB7XG4gICAgICAgIHZhciBmaWx0ZXJlZCA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhjb2xsZWN0aW9uKS5mb3JFYWNoKGZ1bmN0aW9uIG9tYXBwZXIgKGtleSkge1xuICAgICAgICAgIGlmIChleGlzdHMobnVsbCwga2V5KSkgeyBmaWx0ZXJlZFtrZXldID0gY29sbGVjdGlvbltrZXldOyB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgICB9XG4gICAgICBpZiAoZXJyKSB7IGRvbmUoZXJyKTsgcmV0dXJuOyB9XG4gICAgICBkb25lKG51bGwsIGEocmVzdWx0cykgPyBjb2xsZWN0aW9uLmZpbHRlcihleGlzdHMpIDogb2ZpbHRlcigpKTtcbiAgICB9O1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYSA9IHJlcXVpcmUoJy4vYScpO1xudmFyIG9uY2UgPSByZXF1aXJlKCcuL29uY2UnKTtcbnZhciBjb25jdXJyZW50ID0gcmVxdWlyZSgnLi9jb25jdXJyZW50Jyk7XG52YXIgQ09OQ1VSUkVOVExZID0gcmVxdWlyZSgnLi9DT05DVVJSRU5UTFknKTtcbnZhciBTRVJJQUwgPSByZXF1aXJlKCcuL1NFUklBTCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9tYXAgKGNhcCwgdGhlbiwgYXR0YWNoZWQpIHtcbiAgZnVuY3Rpb24gYXBpIChjb2xsZWN0aW9uLCBjb25jdXJyZW5jeSwgaXRlcmF0b3IsIGRvbmUpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDIpIHsgaXRlcmF0b3IgPSBjb25jdXJyZW5jeTsgY29uY3VycmVuY3kgPSBDT05DVVJSRU5UTFk7IH1cbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDMgJiYgdHlwZW9mIGNvbmN1cnJlbmN5ICE9PSAnbnVtYmVyJykgeyBkb25lID0gaXRlcmF0b3I7IGl0ZXJhdG9yID0gY29uY3VycmVuY3k7IGNvbmN1cnJlbmN5ID0gQ09OQ1VSUkVOVExZOyB9XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhjb2xsZWN0aW9uKTtcbiAgICB2YXIgdGFza3MgPSBhKGNvbGxlY3Rpb24pID8gW10gOiB7fTtcbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24gaW5zZXJ0IChrZXkpIHtcbiAgICAgIHRhc2tzW2tleV0gPSBmdW5jdGlvbiBpdGVyYXRlIChjYikge1xuICAgICAgICBpZiAoaXRlcmF0b3IubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgaXRlcmF0b3IoY29sbGVjdGlvbltrZXldLCBrZXksIGNiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVyYXRvcihjb2xsZWN0aW9uW2tleV0sIGNiKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgICBjb25jdXJyZW50KHRhc2tzLCBjYXAgfHwgY29uY3VycmVuY3ksIHRoZW4gPyB0aGVuKGNvbGxlY3Rpb24sIG9uY2UoZG9uZSkpIDogZG9uZSk7XG4gIH1cbiAgaWYgKCFhdHRhY2hlZCkgeyBhcGkuc2VyaWVzID0gX21hcChTRVJJQUwsIHRoZW4sIHRydWUpOyB9XG4gIHJldHVybiBhcGk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGEgKG8pIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKSA9PT0gJ1tvYmplY3QgQXJyYXldJzsgfTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGF0b2EgPSByZXF1aXJlKCdhdG9hJyk7XG52YXIgYSA9IHJlcXVpcmUoJy4vYScpO1xudmFyIG9uY2UgPSByZXF1aXJlKCcuL29uY2UnKTtcbnZhciBxdWV1ZSA9IHJlcXVpcmUoJy4vcXVldWUnKTtcbnZhciBlcnJvcmVkID0gcmVxdWlyZSgnLi9lcnJvcmVkJyk7XG52YXIgZGVib3VuY2UgPSByZXF1aXJlKCcuL2RlYm91bmNlJyk7XG52YXIgQ09OQ1VSUkVOVExZID0gcmVxdWlyZSgnLi9DT05DVVJSRU5UTFknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb25jdXJyZW50ICh0YXNrcywgY29uY3VycmVuY3ksIGRvbmUpIHtcbiAgaWYgKHR5cGVvZiBjb25jdXJyZW5jeSA9PT0gJ2Z1bmN0aW9uJykgeyBkb25lID0gY29uY3VycmVuY3k7IGNvbmN1cnJlbmN5ID0gQ09OQ1VSUkVOVExZOyB9XG4gIHZhciBkID0gb25jZShkb25lKTtcbiAgdmFyIHEgPSBxdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5KTtcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh0YXNrcyk7XG4gIHZhciByZXN1bHRzID0gYSh0YXNrcykgPyBbXSA6IHt9O1xuICBxLnVuc2hpZnQoa2V5cyk7XG4gIHEub24oJ2RyYWluJywgZnVuY3Rpb24gY29tcGxldGVkICgpIHsgZChudWxsLCByZXN1bHRzKTsgfSk7XG4gIGZ1bmN0aW9uIHdvcmtlciAoa2V5LCBuZXh0KSB7XG4gICAgZGVib3VuY2UodGFza3Nba2V5XSwgW3Byb2NlZWRdKTtcbiAgICBmdW5jdGlvbiBwcm9jZWVkICgpIHtcbiAgICAgIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICAgICAgaWYgKGVycm9yZWQoYXJncywgZCkpIHsgcmV0dXJuOyB9XG4gICAgICByZXN1bHRzW2tleV0gPSBhcmdzLnNoaWZ0KCk7XG4gICAgICBuZXh0KCk7XG4gICAgfVxuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3Vycnk6IHJlcXVpcmUoJy4vY3VycnknKSxcbiAgY29uY3VycmVudDogcmVxdWlyZSgnLi9jb25jdXJyZW50JyksXG4gIHNlcmllczogcmVxdWlyZSgnLi9zZXJpZXMnKSxcbiAgd2F0ZXJmYWxsOiByZXF1aXJlKCcuL3dhdGVyZmFsbCcpLFxuICBlYWNoOiByZXF1aXJlKCcuL2VhY2gnKSxcbiAgbWFwOiByZXF1aXJlKCcuL21hcCcpLFxuICBmaWx0ZXI6IHJlcXVpcmUoJy4vZmlsdGVyJyksXG4gIHF1ZXVlOiByZXF1aXJlKCcuL3F1ZXVlJyksXG4gIGVtaXR0ZXI6IHJlcXVpcmUoJy4vZW1pdHRlcicpXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXRvYSA9IHJlcXVpcmUoJ2F0b2EnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjdXJyeSAoKSB7XG4gIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICB2YXIgbWV0aG9kID0gYXJncy5zaGlmdCgpO1xuICByZXR1cm4gZnVuY3Rpb24gY3VycmllZCAoKSB7XG4gICAgdmFyIG1vcmUgPSBhdG9hKGFyZ3VtZW50cyk7XG4gICAgbWV0aG9kLmFwcGx5KG1ldGhvZCwgYXJncy5jb25jYXQobW9yZSkpO1xuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHRpY2t5ID0gcmVxdWlyZSgndGlja3knKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWJvdW5jZSAoZm4sIGFyZ3MsIGN0eCkge1xuICBpZiAoIWZuKSB7IHJldHVybjsgfVxuICB0aWNreShmdW5jdGlvbiBydW4gKCkge1xuICAgIGZuLmFwcGx5KGN0eCB8fCBudWxsLCBhcmdzIHx8IFtdKTtcbiAgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vX2VhY2gnKSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXRvYSA9IHJlcXVpcmUoJ2F0b2EnKTtcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlbWl0dGVyICh0aGluZywgb3B0aW9ucykge1xuICB2YXIgb3B0cyA9IG9wdGlvbnMgfHwge307XG4gIHZhciBldnQgPSB7fTtcbiAgaWYgKHRoaW5nID09PSB1bmRlZmluZWQpIHsgdGhpbmcgPSB7fTsgfVxuICB0aGluZy5vbiA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGlmICghZXZ0W3R5cGVdKSB7XG4gICAgICBldnRbdHlwZV0gPSBbZm5dO1xuICAgIH0gZWxzZSB7XG4gICAgICBldnRbdHlwZV0ucHVzaChmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGluZztcbiAgfTtcbiAgdGhpbmcub25jZSA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGZuLl9vbmNlID0gdHJ1ZTsgLy8gdGhpbmcub2ZmKGZuKSBzdGlsbCB3b3JrcyFcbiAgICB0aGluZy5vbih0eXBlLCBmbik7XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9O1xuICB0aGluZy5vZmYgPSBmdW5jdGlvbiAodHlwZSwgZm4pIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGMgPT09IDEpIHtcbiAgICAgIGRlbGV0ZSBldnRbdHlwZV07XG4gICAgfSBlbHNlIGlmIChjID09PSAwKSB7XG4gICAgICBldnQgPSB7fTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGV0ID0gZXZ0W3R5cGVdO1xuICAgICAgaWYgKCFldCkgeyByZXR1cm4gdGhpbmc7IH1cbiAgICAgIGV0LnNwbGljZShldC5pbmRleE9mKGZuKSwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGluZztcbiAgfTtcbiAgdGhpbmcuZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IGF0b2EoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gdGhpbmcuZW1pdHRlclNuYXBzaG90KGFyZ3Muc2hpZnQoKSkuYXBwbHkodGhpcywgYXJncyk7XG4gIH07XG4gIHRoaW5nLmVtaXR0ZXJTbmFwc2hvdCA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgdmFyIGV0ID0gKGV2dFt0eXBlXSB8fCBbXSkuc2xpY2UoMCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICAgICAgdmFyIGN0eCA9IHRoaXMgfHwgdGhpbmc7XG4gICAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJyAmJiBvcHRzLnRocm93cyAhPT0gZmFsc2UgJiYgIWV0Lmxlbmd0aCkgeyB0aHJvdyBhcmdzLmxlbmd0aCA9PT0gMSA/IGFyZ3NbMF0gOiBhcmdzOyB9XG4gICAgICBldC5mb3JFYWNoKGZ1bmN0aW9uIGVtaXR0ZXIgKGxpc3Rlbikge1xuICAgICAgICBpZiAob3B0cy5hc3luYykgeyBkZWJvdW5jZShsaXN0ZW4sIGFyZ3MsIGN0eCk7IH0gZWxzZSB7IGxpc3Rlbi5hcHBseShjdHgsIGFyZ3MpOyB9XG4gICAgICAgIGlmIChsaXN0ZW4uX29uY2UpIHsgdGhpbmcub2ZmKHR5cGUsIGxpc3Rlbik7IH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gIH07XG4gIHJldHVybiB0aGluZztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlcnJvcmVkIChhcmdzLCBkb25lLCBkaXNwb3NhYmxlKSB7XG4gIHZhciBlcnIgPSBhcmdzLnNoaWZ0KCk7XG4gIGlmIChlcnIpIHsgaWYgKGRpc3Bvc2FibGUpIHsgZGlzcG9zYWJsZS5kaXNjYXJkKCk7IH0gZGVib3VuY2UoZG9uZSwgW2Vycl0pOyByZXR1cm4gdHJ1ZTsgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL19maWx0ZXInKSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vX21hcCcpKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbm9vcCAoKSB7fTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG5vb3AgPSByZXF1aXJlKCcuL25vb3AnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBvbmNlIChmbikge1xuICB2YXIgZGlzcG9zZWQ7XG4gIGZ1bmN0aW9uIGRpc3Bvc2FibGUgKCkge1xuICAgIGlmIChkaXNwb3NlZCkgeyByZXR1cm47IH1cbiAgICBkaXNwb3NlZCA9IHRydWU7XG4gICAgKGZuIHx8IG5vb3ApLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gIH1cbiAgZGlzcG9zYWJsZS5kaXNjYXJkID0gZnVuY3Rpb24gKCkgeyBkaXNwb3NlZCA9IHRydWU7IH07XG4gIHJldHVybiBkaXNwb3NhYmxlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGF0b2EgPSByZXF1aXJlKCdhdG9hJyk7XG52YXIgYSA9IHJlcXVpcmUoJy4vYScpO1xudmFyIG9uY2UgPSByZXF1aXJlKCcuL29uY2UnKTtcbnZhciBlbWl0dGVyID0gcmVxdWlyZSgnLi9lbWl0dGVyJyk7XG52YXIgZGVib3VuY2UgPSByZXF1aXJlKCcuL2RlYm91bmNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcXVldWUgKHdvcmtlciwgY29uY3VycmVuY3kpIHtcbiAgdmFyIHEgPSBbXSwgbG9hZCA9IDAsIG1heCA9IGNvbmN1cnJlbmN5IHx8IDEsIHBhdXNlZDtcbiAgdmFyIHFxID0gZW1pdHRlcih7XG4gICAgcHVzaDogbWFuaXB1bGF0ZS5iaW5kKG51bGwsICdwdXNoJyksXG4gICAgdW5zaGlmdDogbWFuaXB1bGF0ZS5iaW5kKG51bGwsICd1bnNoaWZ0JyksXG4gICAgcGF1c2U6IGZ1bmN0aW9uIHBhdXNlICgpIHsgcGF1c2VkID0gdHJ1ZTsgfSxcbiAgICByZXN1bWU6IGZ1bmN0aW9uIHJlc3VtZSAoKSB7IHBhdXNlZCA9IGZhbHNlOyBkZWJvdW5jZShsYWJvcik7IH0sXG4gICAgcGVuZGluZzogcVxuICB9KTtcbiAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSAmJiAhT2JqZWN0LmRlZmluZVByb3BlcnR5UGFydGlhbCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxcSwgJ2xlbmd0aCcsIHsgZ2V0OiBmdW5jdGlvbiBnZXR0ZXIgKCkgeyByZXR1cm4gcS5sZW5ndGg7IH0gfSk7XG4gIH1cbiAgZnVuY3Rpb24gbWFuaXB1bGF0ZSAoaG93LCB0YXNrLCBkb25lKSB7XG4gICAgdmFyIHRhc2tzID0gYSh0YXNrKSA/IHRhc2sgOiBbdGFza107XG4gICAgdGFza3MuZm9yRWFjaChmdW5jdGlvbiBpbnNlcnQgKHQpIHsgcVtob3ddKHsgdDogdCwgZG9uZTogZG9uZSB9KTsgfSk7XG4gICAgZGVib3VuY2UobGFib3IpO1xuICB9XG4gIGZ1bmN0aW9uIGxhYm9yICgpIHtcbiAgICBpZiAocGF1c2VkIHx8IGxvYWQgPj0gbWF4KSB7IHJldHVybjsgfVxuICAgIGlmICghcS5sZW5ndGgpIHsgaWYgKGxvYWQgPT09IDApIHsgcXEuZW1pdCgnZHJhaW4nKTsgfSByZXR1cm47IH1cbiAgICBsb2FkKys7XG4gICAgdmFyIGpvYiA9IHEucG9wKCk7XG4gICAgd29ya2VyKGpvYi50LCBvbmNlKGNvbXBsZXRlLmJpbmQobnVsbCwgam9iKSkpO1xuICAgIGRlYm91bmNlKGxhYm9yKTtcbiAgfVxuICBmdW5jdGlvbiBjb21wbGV0ZSAoam9iKSB7XG4gICAgbG9hZC0tO1xuICAgIGRlYm91bmNlKGpvYi5kb25lLCBhdG9hKGFyZ3VtZW50cywgMSkpO1xuICAgIGRlYm91bmNlKGxhYm9yKTtcbiAgfVxuICByZXR1cm4gcXE7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uY3VycmVudCA9IHJlcXVpcmUoJy4vY29uY3VycmVudCcpO1xudmFyIFNFUklBTCA9IHJlcXVpcmUoJy4vU0VSSUFMJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2VyaWVzICh0YXNrcywgZG9uZSkge1xuICBjb25jdXJyZW50KHRhc2tzLCBTRVJJQUwsIGRvbmUpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGF0b2EgPSByZXF1aXJlKCdhdG9hJyk7XG52YXIgb25jZSA9IHJlcXVpcmUoJy4vb25jZScpO1xudmFyIGVycm9yZWQgPSByZXF1aXJlKCcuL2Vycm9yZWQnKTtcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB3YXRlcmZhbGwgKHN0ZXBzLCBkb25lKSB7XG4gIHZhciBkID0gb25jZShkb25lKTtcbiAgZnVuY3Rpb24gbmV4dCAoKSB7XG4gICAgdmFyIGFyZ3MgPSBhdG9hKGFyZ3VtZW50cyk7XG4gICAgdmFyIHN0ZXAgPSBzdGVwcy5zaGlmdCgpO1xuICAgIGlmIChzdGVwKSB7XG4gICAgICBpZiAoZXJyb3JlZChhcmdzLCBkKSkgeyByZXR1cm47IH1cbiAgICAgIGFyZ3MucHVzaChvbmNlKG5leHQpKTtcbiAgICAgIGRlYm91bmNlKHN0ZXAsIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJvdW5jZShkLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuICBuZXh0KCk7XG59O1xuIl19
