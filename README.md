![contra.png][logo]

> Asynchronous flow control with a `_` taste to it

Inspired on [async][1], `λ` aims to stay small and simple, while powerful, which is inspired by [lodash][2]. Methods are implemented individually and not as part of a whole. That design helps when considering to export functions individually. If you need all the methods in `async`, then stick with it.

#### Quick Links

- [CHANGELOG](CHANGELOG.md)
- [Comparison with `async`](#comparison-with-async)
- [Browser Support](#browser-support)
- [License](#License)

#### API

[Flow Control](#flow-control-methods)

- `λ.waterfall`
- `λ.series`
- `λ.concurrent`

[Functional](#functional-methods)

- `λ.map`
- `λ.map.series`
- `λ.each`
- `λ.each.series`

[Uncategorized](#uncategorized-methods)

- `λ.emitter`
- `λ.queue`

# Install

Install using `npm` or `bower`.

```shell
npm i contra --save
```

```shell
bower i contra --save
```

Or just download the [development source][3] and embed that in a `<script>` tag.

```html
<script src='contra.js'></script>
```

You can also use it with AMD. Even if you shouldn't, because AMD kind of _really sucks_.

# API

These are the asynchronous flow control methods provided by `λ`.

## `λ.waterfall(tasks[, done])`

Executes tasks in series. Each step receives the arguments from the previous step.

- `tasks` Array of functions with the `(...results, next)` signature
- `done` Optional function with the `(err, ...results)` signature

```js
λ.waterfall([
  function (next) {
    next(null, 'params for', 'next', 'step');
  },
  function (a, b, c, next) {
    console.log(b);
    // <- 'next'
    next(null, 'ok', 'done');
  }
], function (err, ok, result) {
  console.log(result);
  // <- 'done'
});
```

## `λ.series(tasks[, done])`

Executes tasks in series. `done` gets all the results. Results get passed as an array or hash to an optional `done` callback. Task order is preserved in results.

- `tasks` Collection of functions with the `(next)` signature. Can be an array or an object
- `done` Optional function with the `(err, results)` signature

```js
λ.series([
  function (next) {
    setTimeout(function () {
      next(null, 'boom');
    }, 1000);
  },
  function (next) {
    next(null, 'foo');
  }
], function (err, results) {
  console.log(results);
  // <- ['boom', 'foo']
});
```

Using objects

```js
λ.series({
  first: function (next) {
    setTimeout(function () {
      next(null, 'boom');
    }, 1000);
  },
  second: function (next) {
    next(null, 'foo');
  }
}, function (err, results) {
  console.log(results);
  // <- { first: 'boom', second: 'foo' }
});
```

## `λ.concurrent(tasks[, done])`

Executes tasks concurrently. Results get passed as an array or hash to an optional `done` callback. Task order is preserved in results.

- `tasks` Collection of functions with the `(cb)` signature. Can be an array or an object
- `done` Optional function with the `(err, results)` signature

```js
λ.concurrent([
  function (cb) {
    setTimeout(function () {
      cb(null, 'boom');
    }, 1000);
  },
  function (cb) {
    cb(null, 'foo');
  }
], function (err, results) {
  console.log(results);
  // <- ['boom', 'foo']
});
```

Using objects

```js
λ.concurrent({
  first: function (cb) {
    setTimeout(function () {
      cb(null, 'boom');
    }, 1000);
  },
  second: function (cb) {
    cb(null, 'foo');
  }
}, function (err, results) {
  console.log(results);
  // <- { first: 'boom', second: 'foo' }
});
```

## `λ.each(items, iterator[, done])`

Applies an iterator to each element in the collection concurrently.

- `items` Collection of items. Can be an array or an object
- `iterator(item, cb)` Function to execute on each item
  - `item` The current item
  - `cb` Needs to be called when processing for current item is done
- `done` Optional function with the `(err)` signature

```js
λ.each({ thing: 900, another: 23 }, function (item, cb) {
  setTimeout(function () {
    console.log(item);
    cb();
  }, item);
});
// <- 23
// <- 900
```

## `λ.each.series(items, iterator[, done])`

Same as `λ.each(items, iterator[, done])`, but in series instead of concurrently.

## `λ.map(items, iterator[, done])`

Applies an iterator to each element in the collection concurrently. Produces an object with the transformation results. Task order is preserved in results.

- `items` Collection of items. Can be an array or an object
- `iterator(item, cb)` Function to execute on each item
  - `item` The current item
  - `cb` Needs to be called when processing for current item is done
- `done` Optional function with the `(err)` signature

```js
λ.each({ thing: 900, another: 23 }, function (item, cb) {
  setTimeout(function () {
    cb(null, item * 2);
  }, item);
}, function (err, result) {
  console.log(result);
  <- { thing: 1800, another: 46 }
});
```

## `λ.map.series(items, iterator[, done])`

Same as `λ.map(items, iterator[, done])`, but in series instead of concurrently.

## `λ.queue(worker[, concurrency=1])`

- `worker(job, done)` Function to process jobs in the queue
  - `job` The current job
  - `done` Needs to be called when processing for current job is done
- `concurrency` Optional concurrency level, defaults to `1` (serial)

Creates a queue you can `push` or `unshift` tasks to.

## `λ.emitter(thing)`

Augments `thing` with `on` and `emit` methods.

- `thing` Writable JavaScript object
- `emit(type, ...arguments)` Emits an event of type `type`, passing arguments
- `on(type, fn)` Registers an event listener `fn`, of type `type`

```js
var thing = { foo: 'bar' };

λ.emitter(thing);

thing.on('something', function (level) {
  console.log('something level ' + level);
});

thing.emit('something', 4);
// <- 'something level 4'
```

## `λ.apply(fn, ...arguments)`

Returns a function bound with some arguments and a `next` callback.

```js
λ.apply(fn, 1, 3, 5);
// <- function (next) {
  fn(1, 3, 5);
}
```

# Comparison with `async`

[`async`][1]|`λ`
---|---
Aimed at Noders|All ages may use!
Arrays for [some][5], collections for [others][6]|Collections for **everyone**!
`parallel`|`concurrent`
`mapSeries`|`map.series`
More _comprehensive_|More _focused_
`29.6k`|`5.4k`

`λ` isn't meant to be a superset of `async`. Rather, it aims to provide a more focused library. Thus, it just includes bits and pieces of `async`'s API deemed reasonable.

`λ` is inspired on `async` and `lodash`, but it has been authored by [@bevacqua][4] from scratch.

# Browser Support

It's coming.

# License

MIT

  [logo]: https://raw.github.com/bevacqua/contra/master/resources/contra.png
  [1]: https://github.com/caolan/async
  [2]: https://github.com/lodash/lodash
  [3]: https://github.com/bevacqua/contra/tree/master/src/contra.js
  [4]: https://github.com/bevacqua
  [5]: https://github.com/caolan/async#maparr-iterator-callback
  [6]: https://github.com/caolan/async#paralleltasks-callback
