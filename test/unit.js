'use strict';

var assert = require('assert');
var λ = require('../');

assert.falsy = function (value, message) { assert.equal(false, !!value, message); };

describe('waterfall()', function () {
  it('should run tasks in a waterfall', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      assert.falsy(cc);
      next(null, 'a');
    }
    function c (d, next) {
      cc = true;
      assert.ok(cb);
      assert.equal(d, 'a');
      next(null, 'b');
    }
    function d (err, result) {
      assert.falsy(err);
      assert.ok(cb);
      assert.ok(cc);
      assert.equal(result, 'b');
      done();
    }
    λ.waterfall([b,c],d);
  });
});

describe('series()', function () {
  it('should run tasks in a series as array', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      assert.falsy(cc);
      next(null, 'a');
    }
    function c (next) {
      cc = true;
      assert.ok(cb);
      next(null, 'b');
    }
    function d (err, results) {
      assert.falsy(err);
      assert.ok(cb);
      assert.ok(cc);
      assert.equal(Object.keys(results).length, 2);
      assert.equal(results[0], 'a');
      assert.equal(results[1], 'b');
      done();
    }
    λ.series([b,c],d);
  });

  it('should run tasks in a series as object', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      assert.falsy(cc);
      next(null, 'a');
    }
    function c (next) {
      cc = true;
      assert.ok(cb);
      next(null, 'b');
    }
    function d (err, results) {
      assert.falsy(err);
      assert.ok(cb);
      assert.ok(cc);
      assert.equal(Object.keys(results).length, 2);
      assert.equal(results.e, 'a');
      assert.equal(results.f, 'b');
      done();
    }
    λ.series({ e: b, f: c }, d);
  });

  it('should short-circuit on error', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      assert.falsy(cc);
      next('d', 'a');
    }
    function c (next) {
      cc = true;
      assert.ok(cb);
      next(null, 'b');
    }
    function d (err, results) {
      assert.ok(err);
      assert.equal(err, 'd');
      assert.ok(cb);
      assert.falsy(cc);
      assert.falsy(results);
      done();
    }
    λ.series([b,c],d);
  });
});

describe('concurrent()', function () {
  it('should run tasks concurrently as array', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      assert.falsy(cc);
      next(null, 'a');
    }
    function c (next) {
      cc = true;
      assert.ok(cb);
      next(null, 'b');
    }
    function d (err, results) {
      assert.falsy(err);
      assert.ok(cb);
      assert.ok(cc);
      assert.equal(Object.keys(results).length, 2);
      assert.equal(results[0], 'a');
      assert.equal(results[1], 'b');
      done();
    }
    λ.concurrent([b,c],d);
  });

  it('should run tasks concurrently as object', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      assert.falsy(cc);
      next(null, 'a');
    }
    function c (next) {
      cc = true;
      assert.ok(cb);
      next(null, 'b');
    }
    function d (err, results) {
      assert.falsy(err);
      assert.ok(cb);
      assert.ok(cc);
      assert.equal(Object.keys(results).length, 2);
      assert.equal(results.a, 'a');
      assert.equal(results.d, 'b');
      done();
    }
    λ.concurrent({ a: b, d: c }, d);
  });

  it('should short-circuit on error', function (done) {
    function b (next) {
      next('b', 'a');
    }
    function c (next) {
      next(null, 'b');
    }
    function d (err, results) {
      assert.ok(err);
      assert.equal(err, 'b');
      assert.falsy(results);
      done();
    }
    λ.concurrent([b,c],d);
  });
});

describe('curry()', function () {
  it('should work with no extra arguments', function () {
    var fn = function (a,b,c) {
      assert.equal(a, 1);
      assert.equal(b, 3);
      assert.equal(c, 'c');
    };
    var applied = λ.curry(fn, 1, 3, 'c');
    applied();
  });

  it('should include extra arguments as well', function () {
    var fn = function (a,b,c,d,e) {
      assert.equal(a, 1);
      assert.equal(b, 3);
      assert.equal(c, 'c');
      assert.equal(d, 'd');
      assert.equal(e, 'e');
    };
    var applied = λ.curry(fn, 1, 3, 'c');
    applied('d', 'e');
  });

  it('should play well with λ.series', function (done) {
    var cb = false, cc = false;
    function b (n, next) {
      assert.equal(n, 1);
      cb = true;
      assert.falsy(cc);
      next(null, 'd');
    }
    function c (p, next) {
      assert.deepEqual(p, ['a']);
      cc = true;
      assert.ok(cb);
      next(null, 'b');
    }
    function d (err, results) {
      assert.falsy(err);
      assert.ok(cb);
      assert.ok(cc);
      assert.equal(Object.keys(results).length, 2);
      assert.equal(results[0], 'd');
      assert.equal(results[1], 'b');
      done();
    }
    λ.series([
      λ.curry(b, 1),
      λ.curry(c, ['a']),
    ], d);
  });
});

describe('each()', function () {
  it('should loop array concurrently', function (done) {
    var n = 0;
    function t (i, done) {
      n++;
      done();
    }
    function d (err, results) {
      assert.equal(n, 2);
      assert.falsy(err);
      assert.falsy(results);
      done();
    }
    λ.each(['b','c'],t,d);
  });

  it('should loop object concurrently', function (done) {
    var n = 0;
    function t (i, done) {
      n++;
      done();
    }
    function d (err, results) {
      assert.equal(n, 2);
      assert.falsy(err);
      assert.falsy(results);
      done();
    }
    λ.each({ a: 'b', b: 'c' }, t, d);
  });

  it('should short-circuit on error', function (done) {
    function t (i, done) {
      done(i);
    }
    function d (err, results) {
      assert.ok(err);
      assert.falsy(results);
      done();
    }
    λ.each(['b','c','e'],t,d);
  });
});

describe('each.series()', function () {
  it('should loop array in a series', function (done) {
    var n = 0;
    function t (i, done) {
      n++;
      done();
    }
    function d (err, results) {
      assert.equal(n, 2);
      assert.falsy(err);
      assert.falsy(results);
      done();
    }
    λ.each.series(['b','c'],t,d);
  });

  it('should loop object in a series', function (done) {
    var n = 0;
    function t (i, done) {
      n++;
      done();
    }
    function d (err, results) {
      assert.equal(n, 2);
      assert.falsy(err);
      assert.falsy(results);
      done();
    }
    λ.each.series({ a: 'b', b: 'c' }, t, d);
  });

  it('should short-circuit on error', function (done) {
    var n = 0;
    function t (i, done) {
      n++;
      done(i);
    }
    function d (err, results) {
      assert.equal(n, 1);
      assert.ok(err);
      assert.falsy(results);
      done();
    }
    λ.each.series(['b','c'],t,d);
  });
});

describe('map()', function () {
  it('should map array concurrently', function (done) {
    var n = 4;
    function t (i, done) {
      done(null, n++);
    }
    function d (err, results) {
      assert.falsy(err);
      assert.equal(Object.keys(results).length, 2);
      assert.deepEqual(results, [4, 5]);
      done();
    }
    λ.map(['b','c'],t,d);
  });

  it('should map object concurrently', function (done) {
    var n = 4;
    function t (i, done) {
      done(null, n++);
    }
    function d (err, results) {
      assert.falsy(err);
      assert.equal(Object.keys(results).length, 2);
      assert.deepEqual(results, { a: 4, b: 5 });
      done();
    }
    λ.map({ a: 'b', b: 'c' }, t, d);
  });

  it('should short-circuit on error', function (done) {
    function t (i, done) {
      done(i);
    }
    function d (err, results) {
      assert.ok(err);
      assert.falsy(results);
      done();
    }
    λ.map(['b','c','e'],t,d);
  });
});

describe('map.series()', function () {
  it('should map array in a series', function (done) {
    var n = 4;
    function t (i, done) {
      done(null, n++);
    }
    function d (err, results) {
      assert.falsy(err);
      assert.equal(Object.keys(results).length, 2);
      assert.deepEqual(results, [4, 5]);
      done();
    }
    λ.map.series(['b','c'],t,d);
  });

  it('should map object in a series', function (done) {
    var n = 4;
    function t (i, done) {
      done(null, n++);
    }
    function d (err, results) {
      assert.falsy(err);
      assert.equal(Object.keys(results).length, 2);
      assert.deepEqual(results, { a: 4, b: 5 });
      done();
    }
    λ.map.series({ a: 'b', b: 'c' }, t, d);
  });

  it('should fail on error', function (done) {
    function t (i, done) {
      done(i);
    }
    function d (err, results) {
      assert.ok(err);
      assert.falsy(results);
      done();
    }
    λ.map.series(['b','c'],t,d);
  });

  it('should short-circuit on error', function (done) {
    var n = 0;
    function t (i, done) {
      n++;
      done(i);
    }
    function d (err, results) {
      assert.equal(n, 1);
      assert.ok(err);
      assert.falsy(results);
      done();
    }
    λ.map.series(['b','c'],t,d);
  });
});


describe('filter()', function () {
  it('should filter array concurrently', function (done) {
    function t (i, done) {
      done(null, typeof i === 'string');
    }
    function d (err, results) {
      assert.falsy(err);
      assert.equal(results.length, 2);
      assert.deepEqual(results, ['b', 'c']);
      done();
    }
    λ.filter([1,2,'b',3,'c',5],t,d);
  });

  it('should filter object concurrently', function (done) {
    function t (i, done) {
      done(null, typeof i === 'string');
    }
    function d (err, results) {
      assert.falsy(err);
      assert.equal(Object.keys(results).length, 2);
      assert.deepEqual(results, { a: 'b', b: 'c' });
      done();
    }
    λ.filter({ n: 3, a: 'b', b: 'c', c: 4, d: 5, e: 6 }, t, d);
  });

  it('should short-circuit on error', function (done) {
    function t (i, done) {
      done(i);
    }
    function d (err, results) {
      assert.ok(err);
      assert.falsy(results);
      done();
    }
    λ.filter(['b','c','e'],t,d);
  });
});

describe('filter.series()', function () {
  it('should filter array in a series', function (done) {
    function t (i, done) {
      done(null, typeof i === 'string');
    }
    function d (err, results) {
      assert.falsy(err);
      assert.equal(results.length, 2);
      assert.deepEqual(results, ['b', 'c']);
      done();
    }
    λ.filter.series([1,2,'b',3,'c',5],t,d);
  });

  it('should filter object in a series', function (done) {
    function t (i, done) {
      done(null, typeof i === 'string');
    }
    function d (err, results) {
      assert.falsy(err);
      assert.equal(Object.keys(results).length, 2);
      assert.deepEqual(results, { a: 'b', b: 'c' });
      done();
    }
    λ.filter.series({ n: 3, a: 'b', b: 'c', c: 4, d: 5, e: 6 }, t, d);
  });
});

describe('queue()', function () {
  it('should queue things', function (done) {
    var ww;
    function w (job, done) {
      ww = true;
      assert.equal(job, 'a');
      done();
    }
    function d (err) {
      assert.falsy(err);
      assert.ok(ww);
      done();
    }
    var q = λ.queue(w);
    q.push('a', d);
  });

  it('should pause and resume the queue', function (done) {
    var ww;
    function w (job, cb) {
      ww = true;
      assert.equal(job, 'a');
      cb();
    }
    function d (err) {
      assert.falsy(err);
      assert.ok(ww);
      done();
    }
    var q = λ.queue(w);
    q.pause();
    q.push('a', d);
    assert.equal(q.pending.length, 1);
    q.resume();
  });

  it('should forward errors', function (done) {
    var ww;
    function w (job, done) {
      ww = true;
      assert.equal(job, 'a');
      done('e');
    }
    function d (err) {
      assert.equal(err, 'e');
      assert.ok(ww);
      done();
    }
    var q = λ.queue(w);
    q.push('a', d);
  });

  it('should emit drain', function (done) {
    var ww;
    function w (job, done) {
      assert.fail(null, null, 'invoked worker');
    }
    function d (err) {
      assert.fail(null, null, 'invoked job completion');
    }
    function drained () {
      assert.falsy(ww);
      done();
    }
    var q = λ.queue(w);
    q.on('drain', drained);
    q.push([], d);
  });
});

describe('emitter()', function () {
  it('should just work', function (done) {
    var thing = { foo: 'bar' };

    λ.emitter(thing);

    assert.ok(thing.on);
    assert.ok(thing.once);
    assert.ok(thing.off);
    assert.ok(thing.emit);

    thing.on('something', function (a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 2);
      done();
    });

    thing.emit('something', 'a', 2);
  });

  it('should run once() listeners once', function (done) {
    var thing = { foo: 'bar' };
    var c = 0;

    λ.emitter(thing);

    function me () {
      c++;
      assert.ok(c < 2);
      done();
    }

    thing.once('something', me);
    thing.on('something', function () {
      assert.equal(c, 1);
    })

    thing.emit('something');
    thing.emit('something');
  });

  it('shouldn\'t blow up on careless off() calls', function () {
    var thing = { foo: 'bar' };

    λ.emitter(thing);

    // the thing event type doesn't even exist.
    thing.off('something', function () {});
  });

  it('should turn off on() listeners', function (done) {
    var thing = { foo: 'bar' };

    λ.emitter(thing);

    function me () {
      assert.fail(null, null, 'invoked on() listener');
    }

    thing.on('something', me);
    thing.off('something', me);
    thing.on('something', done);
    thing.emit('something');
  });

  it('should turn off once() listeners', function (done) {
    var thing = { foo: 'bar' };

    λ.emitter(thing);

    function me () {
      assert.fail(null, null, 'invoked once() listener');
    }

    thing.once('something', me);
    thing.off('something', me);
    thing.on('something', done);
    thing.emit('something');
  });

  it('should blow up on error if no listeners', function (done) {
    var thing = { foo: 'bar' };

    λ.emitter(thing);

    assert.throws(thing.emit.bind(thing, 'error'));
    done();
  });

  it('should work just fine with at least one error listener', function (done) {
    var thing = { foo: 'bar' };

    λ.emitter(thing);

    thing.on('error', function () {
      done();
    });
    assert.doesNotThrow(thing.emit.bind(thing, 'error'));
  });
});
