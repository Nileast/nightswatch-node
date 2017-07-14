'use strict';

const utils = require('../utils');

const defaultGpuQuery = {
  name: 'name',
  uuid: 'uuid',
  index: {
    name: 'index',
    type: 'int'
  },
  'temperature.gpu': {
    name: 'temperature',
    type: 'int'
  },
  'utilization.gpu': {
    name: 'utilization',
    type: 'int'
  },
  'memory.used': {
    name: 'usedMemory',
    type: 'int'
  },
  'memory.total': {
    name: 'totalMemory',
    type: 'int'
  }
};

async function getMemory(conn) {
  let memInfo = {};

  // Based on https://github.com/timjrobinson/node-free-memory/blob/master/index.js
  // license: MIT
  let stdout = await utils.sshExec(conn, 'free');
  stdout.trim().split('\n').slice(1).map(function (el) {
    var cl = el.split(/\s+(?=[\d\/])/).map(function(i, idx) { return idx ? parseInt(i, 10) : i; });

      switch(cl[0]) {
        case "Mem:":
          memInfo.memory = {
            total: cl[1],
            used: cl[1] - cl[6]
          };
          break;
        case "-/+ buffers/cache:":
          memInfo.buffer = memInfo.cache = {
            used: cl[1],
            total: cl[1] + cl[2]
          };
          break;
        case "Swap:":
          memInfo.swap = {
            total: cl[1],
            used: cl[1] - cl[3]
          };
          break;
      }
  });

  return memInfo;
}

async function getHostname(conn) {
  return await utils.sshExec(conn, 'hostname');
}

async function getOS(conn) {
  try {
    let res = await utils.sshExec(conn, 'lsb_release -drci');
    res = res.trim().split('\n');
    let osInfo = {};

    for (var i = 0; i < res.length; i++) {
      res[i] = res[i].split(':');
      if (res[i].length === 2) {
        osInfo[res[i][0]] = res[i][1].trim();
      }
    }
    return {
      id: osInfo['Distributor ID'],
      description: osInfo['Description'],
      release: osInfo['Release'],
      codename: osInfo['Codename']
    };
  } catch (e) {
    throw new Error('Can\'t find operating system information.');
  }
}

async function getCPUUsage(conn) {
  let stdout = await utils.sshExec(conn, "cat /proc/stat | grep 'cpu[0-9]'");
  let cpuUsage = [];
  stdout = stdout.trim().split('\n');
  for (let i = 0; i < stdout.length; i++) {
    let res = stdout[i].split(' ');

    for (var x = 1; x < res.length; x++) {
      res[x] = parseInt(res[x]);
    }

    cpuUsage.push({
      name: res[0],
      user: res[1],
      nice: res[2],
      system: res[3],
      idle: res[4],
      iowait: res[5],
      irq: res[6],
      softirq: res[8]
    })
  };
  return cpuUsage;
}

async function getCPUs(conn) {
  let cpu = await utils.sshExec(conn, 'lscpu');
  cpu = cpu.trim().split('\n');
  let cpuInfo = {};

  for (var i = 0; i < cpu.length; i++) {
    let dataPair = cpu[i].split(':');
    cpuInfo[dataPair[0]] = dataPair[1].trim();
  }

  return {
    'arch': cpuInfo['Architecture'],
    'vendor': cpuInfo['Vendor ID'],
    'arch': cpuInfo['Architecture'],
    'modelName': cpuInfo['Model name'],
    'cpus': parseInt(cpuInfo['CPU(s)']),
  };
}

function parseGPUInfo(arr, query) {
  const keys = Object.keys(query);
  let gpu = {};
  for (let i = 0; i < keys.length; i++) {
    let key = query[keys[i]];
    if (query[keys[i]] instanceof Object) {
      key = query[keys[i]].name;

      switch (query[keys[i]].type) {
        case 'int':
          gpu[key] = parseInt(arr[i]);
          break;
        case 'float':
          gpu[key] = parseFloat(arr[i]);
          break;
        case 'string':
          gpu[key] = arr[i].toString();
          break;
      }
    } else {
      gpu[key] = arr[i];
    }
  }
  return gpu;
}

async function getGPUs(conn) {
  const keys = Object.keys(defaultGpuQuery);
  let fields = keys.join(',');

  let stdout = await utils.sshExec(conn, `nvidia-smi --query-gpu=${fields} --format=csv,noheader,nounits`);
  stdout = stdout.trim().split('\n');

  let gpus = [];
  for (var x = 0; x < stdout.length; x++) {
    let gpuInfoArr = stdout[x].split(', ');
    let gpuInfo = {};

    gpus.push(parseGPUInfo(gpuInfoArr, defaultGpuQuery));
  }
  return gpus;
}

async function getNode(conn) {
  let list = [
    getHostname(conn),
    getMemory(conn),
    getOS(conn),
    getCPUs(conn)
  ];

  let values = await Promise.all(list);
  let info = {
    hostname: values[0],
    memory: values[1],
    os: values[2],
    cpu: values[3],
  };

  try {
    info.gpu = await getGPUs(conn);
  } catch (e) {
    console.log('Node might not have a gpu.');
    console.log(e);
  }

  return info;
}

module.exports = {
  getGPUs,
  getCPUs,
  getOS, 
  getMemory,
  getNode, 
  getHostname,
  getCPUUsage
}