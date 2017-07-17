# nights-watch-nodeinfo

[![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]
## Installation

```
  npm install --save nights-watch-node
```

## Usage

```js
const NWNode = require('nightswatch-node');

// Create a node
const node = new NWNode({
  "host": "127.0.1.1",
  "port": 22,
  "username": "your-username",
  "password": "your-password"
});

// Connect to the remote machine
node.connect()
  .then(async () => {
    // Get computer uptime
    await node.getUptime();     // returns {uptime: xxx, idle: xxx}

    // Get CPU information
    await node.getCPUs()        // {id: xxx, arch: xxx, vendor: xxx, modelName: xxx}
  });
```

## Getting To Know Yeoman

Yeoman has a heart of gold. He&#39;s a person with feelings and opinions, but he&#39;s very easy to work with. If you think he&#39;s too opinionated, he can be easily convinced. Feel free to [learn more about him](http://yeoman.io/).

## Created with
[Yeoman](https://npmjs.org/package/yo) and [Generator-simple-package](https://npmjs.org/package/generator-simple-package)

## License
MIT © [nghiattran]()

[npm-image]: https://badge.fury.io/js/nights-watch-nodeinfo.svg
[npm-url]: https://npmjs.org/package/nights-watch-nodeinfo
[travis-image]: https://travis-ci.org/nghiattran/nights-watch-nodeinfo.svg?branch=master
[travis-url]: https://travis-ci.org/nghiattran/nights-watch-nodeinfo
[daviddm-image]: https://david-dm.org/nghiattran/nights-watch-nodeinfo.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/nghiattran/nights-watch-nodeinfo
[coveralls-image]: https://coveralls.io/repos/nghiattran/nights-watch-nodeinfo/badge.svg
[coveralls-url]: https://coveralls.io/github/nghiattran/nights-watch-nodeinfo
