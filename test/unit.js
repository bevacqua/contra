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
