![contra.png][logo]

[![badge](https://travis-ci.org/bevacqua/contra.png?branch=master)](https://travis-ci.org/bevacqua/contra) [![badge](https://badge.fury.io/js/contra.png)](http://badge.fury.io/js/contra) [![badge](https://badge.fury.io/bo/contra.png)](http://badge.fury.io/bo/contra)

> Asynchronous flow control with a functional taste to it

`λ` aims to stay small and simple, while powerful. Inspired by [async][1] and [lodash][2]. Methods are implemented individually and not as part of a whole. That design helps when considering to export functions individually. If you need all the methods in `async`, then stick with it. Otherwise, you might want to check `λ` out!

Feature requests will be considered on a case-by-case basis.

#### Quick Links

- [CHANGELOG](CHANGELOG.md)
- [Comparison with `async`](#comparison-with-async)
- [Browser Support](#browser-support)
- [License](#License)

#### API

Flow Control

- [`λ.waterfall`](#%CE%BBwaterfalltasks-done)
- [`λ.series`](#%CE%BBseriestasks-done)
- [`λ.concurrent`](#%CE%BBconcurrenttasks-done)

Functional

- [`λ.each`](#%CE%BBeachitems-iterator-done)
- [`λ.each.series`](#%CE%BBeachseriesitems-iterator-done)
- [`λ.map`](#%CE%BBmapitems-iterator-done)
- [`λ.map.series`](#%CE%BBmapseriesitems-iterator-done)
- [`λ.filter`](#%CE%BBfilteritems-iterator-done)
- [`λ.filter.series`](#%CE%BBfilterseriesitems-iterator-done)

Uncategorized

- [`λ.queue`](#%CE%BBqueueworker-concurrency1)
- [`λ.emitter`](#%CE%BBemitterthing)
- [`λ.apply`](#%CE%BBapplyfn-arguments)

# Install

Install using `npm` or `bower`. Or get the [source code][3] and embed that in a `<script>` tag.

```shell
npm i contra --save
```

```shell
bower i contra --save
```

You can use it as a Common.JS module, or embed it directly in your HTML.

```js
var λ = require('contra');
```

```html
<script src='contra.js'></script>
<script>
var λ = contra;
</script>
```

<sub>The only reason `contra` isn't published as `λ` directly is to make it easier for you to type.</sub>

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

Applies an iterator to each element in the collection concurrently. Produces an object with the transformation results. Task order is preserved in the results.

- `items` Collection of items. Can be an array or an object
- `iterator(item, cb)` Function to execute on each item
  - `item` The current item
  - `cb` Needs to be called when processing for current item is done
- `done` Optional function with the `(err, results)` signature

```js
λ.map({ thing: 900, another: 23 }, function (item, cb) {
  setTimeout(function () {
    cb(null, item * 2);
  }, item);
}, function (err, results) {
  console.log(results);
  <- { thing: 1800, another: 46 }
});
```

## `λ.map.series(items, iterator[, done])`

Same as `λ.map(items, iterator[, done])`, but in series instead of concurrently.

## `λ.filter(items, iterator[, done])`

Applies an iterator to each element in the collection concurrently. Produces an object with the filtered results. Task order is preserved in results.

- `items` Collection of items. Can be an array or an object
- `iterator(item, cb)` Function to execute on each item
  - `item` The current item
  - `cb` Needs to be called when processing for current item is done
    - `err` An optional error which will short-circuit the filtering process, calling `done`
    - `keep` Truthy will keep the item. Falsy will remove it in the results
- `done` Optional function with the `(err, results)` signature

```js
λ.filter({ thing: 900, another: 23, foo: 69 }, function (item, cb) {
  setTimeout(function () {
    cb(null, item % 23 === 0);
  }, item);
}, function (err, results) {
  console.log(results);
  <- { another: 23, foo: 69 }
});
```

## `λ.filter.series(items, iterator[, done])`

Same as `λ.filter(items, iterator[, done])`, but in series instead of concurrently.

## `λ.queue(worker[, concurrency=1])`

Used to create a job queue.

- `worker(job, done)` Function to process jobs in the queue
  - `job` The current job
  - `done` Needs to be called when processing for current job is done
- `concurrency` Optional concurrency level, defaults to `1` (serial)

Returns a queue you can `push` or `unshift` jobs to. You can pause and resume the queue by hand.

- `push(job[, done])` Array of jobs or an individual job object. Enqueue those jobs, resume processing. Optional callback to run when each job is completed
- `unshift(job)` Array of jobs or an individual job object. Add jobs to the top of the queue, resume processing. Optional callback to run when each job is completed
- `pending` Property. Jobs that haven't started processing yet
- `length` Short-hand for `pending.length`, only works if getters can be defined
- `pause()` Stop processing jobs. Those already being processed will run to completion
- `resume()` Start processing jobs again

```js
var q = λ.queue(worker);

function worker (job, done) {
  console.log(job);
  done(null);
}

q.push('job', function () {
  console.log('this job is done!');
});

q.push(['some', 'more'], function () {
  console.log('one of these jobs is done!');
});

// <- 'job'
// <- 'some'
// <- 'more'
```

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

Returns `thing`.

Events of type `error` have a special behavior. `λ.emitter` will throw if there are no `error` listeners when an error event is emitted.

```js
var thing = { foo: 'bar' };

λ.emitter(thing);

thing.emit('error', 'foo');
<- throws 'foo'
```

If an `'error'` listener is registered, then it'll work just like any other event type.

```js
var thing = { foo: 'bar' };

λ.emitter(thing);

thing.on('error', function (err) {
  console.log(err);
});

thing.emit('error', 'foo');
<- 'foo'
```

## `λ.apply(fn, ...arguments)`

Returns a function bound with some arguments and a `next` callback.

```js
λ.apply(fn, 1, 3, 5);
// <- function (next) { fn(1, 3, 5, next); }
```

# Comparison with `async`

[`async`][1]|`λ`
---|---
Aimed at Noders|Tailored for browsers
Arrays for [some][5], collections for [others][6]|Collections for **everyone**!
`parallel`|`concurrent`
`mapSeries`|`map.series`
More _comprehensive_|More _focused_
`~29.6k (minified, uncompressed)`|`~2.6k (minified, uncompressed)`

`λ` isn't meant to be a replacement for `async`. It aims to provide a more focused library, and a bit more consistency.

# Browser Support

[![Browser Support](https://ci.testling.com/bevacqua/contra.png)](https://ci.testling.com/bevacqua/contra)

If you need support for one of the legacy browsers listed below, you'll need `contra.shim.js`.

- IE < 10
- Safari < 6
- Opera < 16

```js
require('contra/shim');
var λ = require('contra');
```

```html
<script src='contra.shim.js'></script>
<script src='contra.js'></script>
<script>
var λ = contra;
</script>
```

The shim currently clocks around `~1k` minified, uncompressed.

# License

MIT

  [logo]: https://raw.github.com/bevacqua/contra/master/resources/contra.png
  [1]: https://github.com/caolan/async
  [2]: https://github.com/lodash/lodash
  [3]: https://github.com/bevacqua/contra/tree/master/src/contra.js
  [4]: https://github.com/bevacqua
  [5]: https://github.com/caolan/async#maparr-iterator-callback
  [6]: https://github.com/caolan/async#paralleltasks-callback
