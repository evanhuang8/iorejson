# Rejson

[![npm version](https://badge.fury.io/js/iorejson.svg)](https://badge.fury.io/js/iorejson)

The node client for the rejson module of redis. Under the hood it uses the `ioredis` client, and the APIs are conformed to the conventions of `ioredis`.

## Installation

```
npm install iorejson
```

Unfortunately, the name `rejson` in npm is already taken.

## Example Usage

```javascript
var Rejson = require('iorejson');

var instance = new Rejson();
yield instance.connect()

yield instance.set('foo', '.', {
  bar: {
    hello: 'world'
  }
});

value = yield instance.get('foo', '.');
console.log(value);
```

## Connection

This modules passes all connection options directly onto `ioredis`, so you can just refer to its [documentation](https://github.com/luin/ioredis#connect-to-redis) for connection options.

By default, the client will connect automatically and emit a `ready` event when the connection is established. You can either listen to the `ready` event or use the `rejson.connect()` method, which returns a promise that resolves when connection is established.

## APIs

See [the API documentation](APIs.md).

Commands not implemented:

- `JSON.DEBUG`
- `JSON.FORGET` - use `JSON.DEL` instead
- `JSON.RESP`

## Development

To get started, simply install the require modules via `npm install`.

You may run the unit tests using `npm test`. Make sure `mocha` and `eslint` are in your global path.

You can make a file under `tests` that is called `redis.json` to specify your own redis credentials to use in tests.

## License

The MIT License (MIT)

Copyright (c) 2017 Evan Huang <evanhuang8@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.