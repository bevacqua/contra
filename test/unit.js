'use strict';

var should = require('should');
var λ = require('../');

describe('waterfall()', function () {
  it('should run tasks in a waterfall', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      cc.should.not.be.ok;
      next(null, 'a');
    }
    function c (d, next) {
      cc = true;
      cb.should.be.ok;
      d.should.equal('a');
      next(null, 'b');
    }
    function d (err, result) {
      should(err).be.not.ok;
      cb.should.be.ok;
      cc.should.be.ok;
      result.should.equal('b');
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
      cc.should.not.be.ok;
      next(null, 'a');
    }
    function c (next) {
      cc = true;
      cb.should.be.ok;
      next(null, 'b');
    }
    function d (err, results) {
      should(err).be.not.ok;
      cb.should.be.ok;
      cc.should.be.ok;
      results.length.should.equal(2);
      results[0].should.equal('a');
      results[1].should.equal('b');
      done();
    }
    λ.series([b,c],d);
  });

  it('should run tasks in a series as object', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      cc.should.not.be.ok;
      next(null, 'a');
    }
    function c (next) {
      cc = true;
      cb.should.be.ok;
      next(null, 'b');
    }
    function d (err, results) {
      should(err).be.not.ok;
      cb.should.be.ok;
      cc.should.be.ok;
      should(Object.keys(results).length).equal(2);
      results.e.should.equal('a');
      results.f.should.equal('b');
      done();
    }
    λ.series({ e: b, f: c }, d);
  });

  it('should short-circuit on error', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      cc.should.not.be.ok;
      next('d', 'a');
    }
    function c (next) {
      cc = true;
      cb.should.be.ok;
      next(null, 'b');
    }
    function d (err, results) {
      err.should.be.ok;
      err.should.equal('d');
      cb.should.be.ok;
      cc.should.not.be.ok;
      should(results).be.not.ok;
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
      cc.should.not.be.ok;
      next(null, 'a');
    }
    function c (next) {
      cc = true;
      cb.should.be.ok;
      next(null, 'b');
    }
    function d (err, results) {
      should(err).be.not.ok;
      cb.should.be.ok;
      cc.should.be.ok;
      results.length.should.equal(2);
      should(results[0]).equal('a');
      should(results[1]).equal('b');
      done();
    }
    λ.concurrent([b,c],d);
  });

  it('should run tasks concurrently as object', function (done) {
    var cb = false, cc = false;
    function b (next) {
      cb = true;
      cc.should.not.be.ok;
      next(null, 'a');
    }
    function c (next) {
      cc = true;
      cb.should.be.ok;
      next(null, 'b');
    }
    function d (err, results) {
      should(err).be.not.ok;
      cb.should.be.ok;
      cc.should.be.ok;
      should(Object.keys(results).length).equal(2);
      should(results.a).equal('a');
      should(results.d).equal('b');
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
      should(err).be.ok;
      should(err).equal('b');
      should(results).be.not.ok;
      done();
    }
    λ.concurrent([b,c],d);
  });
});

describe('apply()', function () {
  it('should just work', function (done) {
    var cb = false, cc = false;
    function b (n, next) {
      n.should.equal(1);
      cb = true;
      cc.should.not.be.ok;
      next(null, 'a');
    }
    function c (p, next) {
      p.should.eql(['a']);
      cc = true;
      cb.should.be.ok;
      next(null, 'b');
    }
    function d (err, results) {
      should(err).be.not.ok;
      cb.should.be.ok;
      cc.should.be.ok;
      results.length.should.equal(2);
      results[0].should.equal('a');
      results[1].should.equal('b');
      done();
    }
    λ.series([
      λ.apply(b, 1),
      λ.apply(c, ['a']),
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
      n.should.equal(2);
      should(err).be.not.ok;
      should(results).be.not.ok;
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
      n.should.equal(2);
      should(err).be.not.ok;
      should(results).be.not.ok;
      done();
    }
    λ.each({ a: 'b', b: 'c' }, t, d);
  });

  it('should short-circuit on error', function (done) {
    function t (i, done) {
      done(i);
    }
    function d (err, results) {
      should(err).be.ok;
      should(results).be.not.ok;
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
      n.should.equal(2);
      should(err).be.not.ok;
      should(results).be.not.ok;
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
      n.should.equal(2);
      should(err).be.not.ok;
      should(results).be.not.ok;
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
      n.should.equal(1);
      should(err).be.ok;
      should(results).be.not.ok;
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
      should(err).be.not.ok;
      results.length.should.equal(2);
      results.should.eql([4, 5]);
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
      should(err).be.not.ok;
      should(Object.keys(results).length).equal(2);
      results.should.eql({ a: 4, b: 5 });
      done();
    }
    λ.map({ a: 'b', b: 'c' }, t, d);
  });

  it('should short-circuit on error', function (done) {
    function t (i, done) {
      done(i);
    }
    function d (err, results) {
      should(err).be.ok;
      should(results).be.not.ok;
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
      should(err).be.not.ok;
      results.length.should.equal(2);
      results.should.eql([4, 5]);
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
      should(err).be.not.ok;
      should(Object.keys(results).length).equal(2);
      results.should.eql({ a: 4, b: 5 });
      done();
    }
    λ.map.series({ a: 'b', b: 'c' }, t, d);
  });

  it('should short-circuit on error', function (done) {
    var n = 0;
    function t (i, done) {
      n++;
      done(i);
    }
    function d (err, results) {
      n.should.equal(1);
      should(err).be.ok;
      should(results).be.not.ok;
      done();
    }
    λ.map.series(['b','c'],t,d);
  });
});

describe('queue()', function () {
  it('should queue things', function (done) {
    var ww;
    function w (job, done) {
      ww = true;
      job.should.equal('a');
      done();
    }
    function d (err) {
      should(err).be.not.ok;
      should(ww).be.ok;
      done();
    }
    var q = λ.queue(w);
    q.push('a', d);
  });

  it('should pause and resume the queue', function (done) {
    var ww;
    function w (job, cb) {
      ww = true;
      job.should.equal('a');
      cb();
    }
    function d (err) {
      should(err).be.not.ok;
      should(ww).be.ok;
      done();
    }
    var q = λ.queue(w);
    q.pause();
    q.push('a', d);
    q.length.should.equal(1);
    q.resume();
  });

  it('should report errors', function (done) {
    var ww;
    function w (job, done) {
      ww = true;
      job.should.equal('a');
      done('e');
    }
    function d (err) {
      err.should.equal('e');
      should(ww).be.ok;
      done();
    }
    var q = λ.queue(w);
    q.push('a', d);
  });
});

describe('emitter()', function () {
  it('should just work', function (done) {
    var thing = { foo: 'bar' };

    λ.emitter(thing);

    should(thing.on).be.ok;
    should(thing.emit).be.ok;

    thing.on('something', function (a, b) {
      a.should.equal('a');
      b.should.equal(2);
      done();
    });

    thing.emit('something', 'a', 2);
  });

  it('should blow up on error if no listeners', function (done) {
    var thing = { foo: 'bar' };

    λ.emitter(thing);

    should(thing.on).be.ok;
    should(thing.emit).be.ok;

    thing.emit.bind(thing, 'error').should.throw();
    done();
  });

  it('should work just fine with at least one error listener', function (done) {
    var thing = { foo: 'bar' };

    λ.emitter(thing);

    should(thing.on).be.ok;
    should(thing.emit).be.ok;

    thing.on('error', function () {
      done();
    });
    thing.emit.bind(thing, 'error').should.not.throw();
  });
});
