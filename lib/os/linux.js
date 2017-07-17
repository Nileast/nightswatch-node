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

/**
 * Get memory and swap information from computer.
 * @param  {Object} conn SSH2 connection object
 * @return {Promise(Object)}      Return object contains 'memory' and 'swap' object which also has 'total' and 'used' field.
 */
async function getMemory(conn) {
  let memInfo = {};

  // Based on https://github.com/timjrobinson/node-free-memory/blob/master/index.js
  // license: MIT
  let stdout = await utils.sshExec(conn, 'free');
  stdout.split('\n').slice(1).map(function (el) {
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

/**
 * Get computer hostname
 * @param  {Object} conn SSH2 connection object
 * @return {Promise(String)}      hostname
 */
async function getHostname(conn) {
  return await utils.sshExec(conn, 'hostname');
}

/**
 * Get operating system information about computer
 * @param  {Object} conn SSH2 connection object
 * @return {Promise(Object)}      An object with following fields:
 * `id`: Distributor ID
 * `description`
 * `release`
 * `codename`
 */
async function getOS(conn) {
  try {
    let res = await utils.sshExec(conn, 'lsb_release -drci');
    res = res.split('\n');
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
    /* istanbul ignore next */
    throw new Error('Can\'t find operating system information.');
  }
}

/**
 * Get CPU usage from computer using.
 * @param  {Object} conn SSH2 connection object.
 * @return {Promise(Array)}        Array of CPUs usage. One entry for each CPU.
 */
async function getCPUUsage(conn) {
  let stdout = await utils.sshExec(conn, "cat /proc/stat | grep 'cpu[0-9]'");
  let cpuUsage = [];
  stdout = stdout.split('\n');
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

/**
 * Get CPU information from computer.
 * @param  {Object} conn SSH2 connection object.
 * @return {Promise(Object)}      Returned object has following fields.
 * `arch`: CPU architecture.
 * `vendor`: vendor ID
 * `modelName`: CPU name.
 * `quantity`: number of CPUs.
 */
async function getCPUs(conn) {
  let cpu = await utils.sshExec(conn, 'lscpu');
  cpu = cpu.split('\n');
  let cpuInfo = {};

  for (var i = 0; i < cpu.length; i++) {
    let dataPair = cpu[i].split(':');
    cpuInfo[dataPair[0]] = dataPair[1].trim();
  }

  return {
    'arch': cpuInfo['Architecture'],
    'vendor': cpuInfo['Vendor ID'],
    'modelName': cpuInfo['Model name'],
    'quantity': parseInt(cpuInfo['CPU(s)']),
  };
}

/**
 * Get GPU information from computer. This function can be also used to get GPU usage.
 * @param  {Object} conn  SSH2 connection object.
 * @param  {Object} query Gpu query fields. See more https://nvidia.custhelp.com/app/answers/detail/a_id/3751/~/useful-nvidia-smi-queries. Default to be defaultGpuQuery.
 * @return {Promise(Array)}        Array of GPUs. Returned data depends on query value.
 */
async function getGPUs(conn, query=defaultGpuQuery) {
  const keys = Object.keys(query);
  let fields = keys.join(',');

  let stdout = await utils.sshExec(conn, `nvidia-smi --query-gpu=${fields} --format=csv,noheader,nounits`);
  stdout = stdout.split('\n');

  let gpus = [];
  for (var x = 0; x < stdout.length; x++) {
    let gpuInfoArr = stdout[x].split(', ');
    let gpuInfo = {};

    gpus.push(utils.parseGPUInfo(gpuInfoArr, query));
  }
  return gpus;
}

/**
 * Get GPU usage from computer. This function is an alias of getGPUs.
 * @param  {Object} conn  SSH2 connection object.
 * @param  {Object} query Gpu query fields. See more https://nvidia.custhelp.com/app/answers/detail/a_id/3751/~/useful-nvidia-smi-queries. Default to be defaultGpuQuery.
 * @return {Promise(Array)}        Array of GPUs. Returned data depends on query value.
 */
const getGPUUsage = getGPUs;

/**
 * Get uptime from computer.
 * @param  {Object} conn  SSH2 connection object.
 * @return {Promise(Object)}       An object with 2 fields 'uptime' (time passed since the computer is started in seconds) and 'idle' (number of seconds computer has been idle. This is a sum of all idle time in CPUs)
 */
async function getUptime(conn) {
  let stdout = await utils.sshExec(conn, 'cat /proc/uptime');
  let numbers = stdout.split(' ').map((x) => parseInt(x));
  return {
    uptime: numbers[0],
    idle: numbers[1]
  }
}

/**
 * Get all information about a computer. This function gets hostname, memory, uptime and also os, CPU, GPU information.
 * @param  {Object} conn  SSH2 connection object.
 * @return {Promise(Object)}      Object with following fields:
 * `hostname`
 * `memory`
 * `CPU`
 * `gpu`
 * `uptime`
 */
async function getInfo(conn) {
  let list = [
    getHostname(conn),
    getMemory(conn),
    getOS(conn),
    getCPUs(conn),
    getUptime(conn)
  ];

  let values = await Promise.all(list);
  let info = {
    hostname: values[0],
    memory: values[1],
    os: values[2],
    cpu: values[3],
    uptime: values[4]
  };

  try {
    info.gpu = await getGPUs(conn);
  } catch (e) {
    /* istanbul ignore next */
    throw Error('Computer might not have a GPU or GPU is not a NVIDIA.')
  }

  return info;
}


module.exports = {
  getGPUs,
  getGPUUsage,
  getCPUs,
  getCPUUsage,
  getOS, 
  getMemory,
  getInfo, 
  getHostname,
  getUptime
}