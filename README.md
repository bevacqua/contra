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

# Usage

## `a.waterfall(steps[, done])`

Executes steps in series, each step receives the arguments 
## `a.parallel(steps[, done])`

# License

MIT

  [1]: https://github.com/caolan/async
