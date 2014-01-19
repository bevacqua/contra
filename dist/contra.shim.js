if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(fn, ctx) {
    'use strict';
    if (this === void 0 || this === null || typeof fn !== 'function') {
      throw new TypeError();
    }
    var t = this;
    var len = t.length;
    for (var i = 0; i < len; i++) {
      if (i in t) { fn.call(ctx, t[i], i, t); }
    }
  };
}
if (!Function.prototype.bind) {
  Function.prototype.bind = function (context) {
    'use strict';
    if (typeof this !== 'function') {
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }
    var curried = Array.prototype.slice.call(arguments, 1);
    var original = this;
    var NoOp = function () {};
    var bound = function () {
      var ctx = this instanceof NoOp && context ? this : context;
      var args = curried.concat(Array.prototype.slice.call(arguments));
      return original.apply(ctx, args);
    };
    NoOp.prototype = this.prototype;
    bound.prototype = new NoOp();
    return bound;
  };
}
if (!Object.keys) {
  Object.keys = function (o) {
    var keys = [];
    for (var k in o) {
        if (o.hasOwnProperty(k)) {
            keys.push(k);
        }
    }
    return keys;
  };
}
