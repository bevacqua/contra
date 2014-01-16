# a.js

> Asynchronous control flow with sane debugging capabilities

Inspired on [async][1], but `a` aims to stay small and simple. Methods are implemented individually and not as part of a whole. That design helps when considering to export functions individually. If you need all the methods in `async`, then stick with it.

# Install

Install using `npm` or `bower`.

```shell
npm i a --save
```

```shell
bower i a --save
```

Or just download the [development source][2] and embed that in a `<script>` tag.

```html
<script src='a.js'></script>
```

# API

These are the methods provided by `a`.

## `waterfall(steps[, done])`

Executes steps in series. each step receives the arguments provided to the callback in the previous step. `done` gets all the results.

- `steps` Array of functions with the `(...results, next)` signature.
- `done` Optional function with the `(err, ...results)` signature.

Usage

```js
a.waterfall([
  function (next) {
    next(null, 1, 2, 3);
  },
  function (a, b, c, next) {
    if (a !== 1) {
      next(new Error('Expected a to be 1!')); return;
    }
    next(null, 2);
  },
  function (a, next) {
    next(null, a * 3, 'b');
  }
], function (err, result, something) {
  if (err) {
    console.log(err); return;
  }
  console.log(result);
  // <- 6
  console.log(something);
  // <- 'b'
});
```

## `parallel(steps[, done])`

Executes steps in parallel. `done` gets all the results. If you use an object for the steps, the results will be mapped into an object. Otherwise a result array, in the same order as the steps, will be returned.

- `steps` Collection of functions with the `(done)` signature. Can be an array or an object.
- `done` Optional function with the `(err, results)` signature.

Usage

```js
a.parallel([
  function (done) {
    setTimeout(function () {
      done(null, [1, 2, 3]);
    }, 3000);
  },
  function (done) {
    if (something) {
      done(new Error('Expected something!')); return;
    }
    done(null, 2);
  },
  function (done) {
    done(null, 3 * 3);
  }
], function (err, result) {
  if (err) {
    console.log(err); return;
  }
  console.log(result);
  // note that the result order is preserved despite of first step finishing last.
  // <- [[1, 2, 3], 2, 9]
});
```

Or, using objects.

```js
a.parallel({
  things: function (done) {
    done(null, [1, 2, 3]);
  },
  test: function (done) {
    if (something) {
      done(new Error('Expected something!')); return;
    }
    done(null, 2);
  },
  mult: function (done) {
    done(null, 3 * 3);
  }
}, function (err, result) {
  if (err) {
    console.log(err); return;
  }
  console.log(result);
  // <- { things: [1, 2, 3], test: 2, mult: 9 }
});
```

## `series(steps[, done])`

Executes steps in series. `done` gets all the results. If you use an object for the steps, the results will be mapped into an object. Otherwise a result array, in the same order as the steps, will be returned.

- `steps` Collection of functions with the `(done)` signature. Can be an array or an object.
- `done` Optional function with the `(err, results)` signature.

Usage

```js
a.series([
  function (done) {
    setTimeout(function () {
      done(null, [1, 2, 3]);
    }, 3000);
  },
  function (done) {
    if (something) {
      done(new Error('Expected something!')); return;
    }
    done(null, 2);
  },
  function (done) {
    done(null, 3 * 3);
  }
], function (err, result) {
  if (err) {
    console.log(err); return;
  }
  console.log(result);
  // <- [[1, 2, 3], 2, 9]
});
```

Or, using objects.

```js
a.series({
  things: function (done) {
    done(null, [1, 2, 3]);
  },
  test: function (done) {
    if (something) {
      done(new Error('Expected something!')); return;
    }
    done(null, 2);
  },
  mult: function (done) {
    done(null, 3 * 3);
  }
}, function (err, result) {
  if (err) {
    console.log(err); return;
  }
  console.log(result);
  // <- { things: [1, 2, 3], test: 2, mult: 9 }
});
```

# License

MIT

  [1]: https://github.com/caolan/async
  [2]: https://github.com/bevacqua/a/tree/master/src/a.js
