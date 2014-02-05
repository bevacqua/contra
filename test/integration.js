'use strict';

var assert = require('assert');
var λ = require('../');

assert.falsy = function (value, message) { assert.equal(false, !!value, message); };

describe('concurrent()', function () {
  it('should return the results as expected', function (done) {
    var items = {
      a: 'a',
      b: { m: 2 },
      c: 'c',
      d: 'foo',
      e: [2],
      z: [3, 6, 7]
    };
    var tasks = {};
    Object.keys(items).forEach(function (key) {
      tasks[key] = fn(items[key]);
    });

    function fn (result) {
      return function (d) {
        setTimeout(function () {
          d(null, result);
        }, Math.random() * 100);
      };
    }

    function d (err, results) {
      assert.deepEqual(results, items);
      done();
    }

    λ.concurrent(tasks, 2, d);
  });
});
