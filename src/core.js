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

  var tick;
