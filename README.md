# contr(a)

> Asynchronous control flow with sane debugging capabilities

Inspired on [async][1], but `contr(a)` aims to stay small and simple, while powerful, that's inspired by [lodash][2. Methods are implemented individually and not as part of a whole. That design helps when considering to export functions individually. If you need all the methods in `async`, then stick with it.

- [API](#API)
- [Changelog](CHANGELOG.md)
- [Comparison with `async`](#comparison-with-async)
- [License](#License)

# Install

Install using `npm` or `bower`.

```shell
npm i a --save
```

```shell
bower i a --save
```

Or just download the [development source][3] and embed that in a `<script>` tag.

```html
<script src='a.js'></script>
```

You can also use it with AMD. Even if you shouldn't, because AMD kind of _really sucks_.

# API

These are the methods provided by `contr(a)`.

## `waterfall(steps[, done])`

Executes steps in series. each step receives the arguments provided to the callback in the previous step. `done` gets all the results.

- `steps` Array of functions with the `(...results, next)` signature.
- `done` Optional function with the `(err, ...results)` signature.

## `concurrent(steps[, done])`

Executes steps concurrently. `done` gets all the results. If you use an object for the steps, the results will be mapped into an object. Otherwise a result array, in the same order as the steps, will be returned.

- `steps` Collection of functions with the `(done)` signature. Can be an array or an object.
- `done` Optional function with the `(err, results)` signature.

## `series(steps[, done])`

Executes steps in series. `done` gets all the results. If you use an object for the steps, the results will be mapped into an object. Otherwise a result array, in the same order as the steps, will be returned.

- `steps` Collection of functions with the `(done)` signature. Can be an array or an object.
- `done` Optional function with the `(err, results)` signature.

# Comparison with `async`

One of the main differences with `async` is that we use collections rather than arrays for the functional things. As a result, functions like `contra.map` can take, (and result in), an object.

```js
contra.map({ a: 'foo', b: 'bar' }, transform, done);

function transform (item, done) {
  done(null, 'pony' + item);
}

function done (err, result) {
  console.log(result);
  // <- { a: 'ponyfoo', b: 'ponybar' }
}
```

In `contra`, [async][1]'s `parallel` is referred to as `concurrent`.

Methods like `mapSeries` in [async][1] follow the `map.series` convention in `contra`.

`contra` isn't meant to be a superset of `async`. Rather, it aims to provide a more focused library. Thus, it just includes bits and pieces of `async`'s API deemed reasonable.

While `contra` is inspired on `async` and `lodash` it has been written by [@bevacqua][4] from scratch.

# License

MIT

  [1]: https://github.com/caolan/async
  [2]: https://github.com/lodash/lodash
  [3]: https://github.com/bevacqua/contra/tree/master/src/contra.js
  [4]: https://github.com/bevacqua
