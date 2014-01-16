'use strict';

var should = require('should');
var a = require('../');

describe('series()', function () {
  it('should run tasks in a series', function (done) {
    var cb = false, cc = false, cd = false;
    function b (next) {
      cb = true;
      cc.should.not.be.ok;
      next();
    }
    function c (next) {
      cc = true;
      cb.should.be.ok;
      next();
    }
    function d (err, results) {
      cd = true;
      should(err).be.not.ok;
      cb.should.be.ok;
      cc.should.be.ok;
      results.length.should.equal(2);
      done();
    }
    a.series([b,c],d);
  });
});

describe('mapSeries()', function () {
  it('should map array in a series', function (done) {
    var n = 4;
    function t (i, done) {
      done(null, n++);
    }
    function d (err, results) {
      should(err).be.not.ok;
      results.length.should.equal(2);
      results.should.equal([4, 5]);
      done();
    }
    a.mapSeries(['b','c'],t,d);
  });

  it('should map object in a series', function (done) {
    var n = 4;
    function t (i, done) {
      done(null, n++);
    }
    function d (err, results) {
      should(err).be.not.ok;
      results.length.should.equal(2);
      results.should.equal({ a: 4, b: 5 });
      done();
    }
    a.mapSeries({ a: 'b', b: 'c' }, t, d);
  });
});
