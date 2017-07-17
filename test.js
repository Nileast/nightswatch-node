'use strict';

const assert = require('assert');
const Node = require('./');

const auth = require('./secret.json')

function isString(v) {
  return typeof v === 'string' || v instanceof String;
}

describe('test Node', function() {
  let node = new Node(auth, 500);

  before((done) => {
    node.connect()
      .then(() => {
        done();
      })

  })

  it('test getUptime', (done) => {
    node.getUptime()
      .then((info) => {
        assert(info instanceof Object);
        assert(Number.isInteger(info.uptime));
        assert(Number.isInteger(info.idle));
        done();
      })
    .catch((e) => {
      done(e);
    })
  });

  it('test getHostname', (done) => {
    node.getHostname()
      .then((info) => {
        assert(isString(info));
        done();
      })
    .catch((e) => {
      done(e);
    })
  });

  it('test getOS', (done) => {
    node.getOS()
      .then((info) => {
        assert(info instanceof Object);
        assert('id' in info && isString(info.id));
        assert('description' in info && isString(info.description));
        assert('release' in info && isString(info.release));
        assert('codename' in info && isString(info.codename));

        done();
      })
    .catch((e) => {
      done(e);
    })
  });

  it('test getCPUUsage', (done) => {
    node.getCPUUsage()
      .then((cpus) => {
        assert(cpus instanceof Array);
        // console.log(cpus);
        for (var i = 0; i < cpus.length; i++) {
          assert('name' in cpus[i] && isString(cpus[i].name));
          assert('user' in cpus[i] && Number.isInteger(cpus[i].user));
          assert('nice' in cpus[i] && Number.isInteger(cpus[i].nice));
          assert('system' in cpus[i] && Number.isInteger(cpus[i].system));
          assert('idle' in cpus[i] && Number.isInteger(cpus[i].idle));
          assert('iowait' in cpus[i] && Number.isInteger(cpus[i].iowait));
          assert('irq' in cpus[i] && Number.isInteger(cpus[i].irq));
          assert('softirq' in cpus[i] && Number.isInteger(cpus[i].softirq));
        }

        done();
      })
    .catch((e) => {
      done(e);
    })
  });

  it('test getGPUs', (done) => {
    node.getGPUs()
      .then((gpus) => {
        assert(gpus instanceof Array);
        for (var i = 0; i < gpus.length; i++) {
          assert('name' in gpus[i] && isString(gpus[i].name));
          assert('uuid' in gpus[i] && isString(gpus[i].uuid));
          assert('index' in gpus[i] && Number.isInteger(gpus[i].index));
          assert('temperature' in gpus[i] && Number.isInteger(gpus[i].temperature));
          assert('utilization' in gpus[i] && Number.isInteger(gpus[i].utilization));
          assert('usedMemory' in gpus[i] && Number.isInteger(gpus[i].usedMemory));
          assert('totalMemory' in gpus[i] && Number.isInteger(gpus[i].totalMemory));
        }

        done();
      })
    .catch((e) => {
      done(e);
    })
  });

  it('test getCPUs', (done) => {
    node.getCPUs()
      .then((info) => {
        assert(info instanceof Object);
        assert('arch' in info && isString(info.arch));
        assert('vendor' in info && isString(info.vendor));
        assert('modelName' in info && isString(info.modelName));
        assert('quantity' in info && Number.isInteger(info.quantity));
        done();
      })
    .catch((e) => {
      done(e);
    })
  });

  it('test getInfo', (done) => {
    node.getInfo()
      .then((info) => {
        assert(info instanceof Object);
        assert('hostname' in info && isString(info.hostname));
        assert('memory' in info && info.memory instanceof Object);
        assert('os' in info && info.os instanceof Object);
        assert('cpu' in info && info.cpu instanceof Object);
        assert('uptime' in info && info.uptime instanceof Object);
        assert('gpu' in info && info.gpu instanceof Array);

        done();
      })
    .catch((e) => {
      done(e);
    })
  });

  it('test watchStats', (done) => {
    node.watchStats((stats) => {
      assert(stats instanceof Object);
      assert('gpu' in stats && stats.gpu instanceof Array);
      assert('cpu' in stats && stats.cpu instanceof Array);
      assert('memory' in stats && stats.memory instanceof Object);
      assert('uptime' in stats && stats.uptime instanceof Object);

      done();
    })
  });

  it('test sshExec', (done) => {
    node.sshExec('ls')
      .then((data) => {
        assert(data);
        done();
      })
      .catch((e) => {
        done(e);
      })
  });


  after((done) => {
    node.close()
      .then(() => { 
        done();
      })
      .catch((e) => {
        assert(false, e);
        done();
      })
  })
});

