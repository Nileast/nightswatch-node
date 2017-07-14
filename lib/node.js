'use strict';

const Client = require('ssh2').Client;

const utils = require('./utils');

const emptyFunc = () => {};

module.exports = class Node {
  constructor(nodeinfo, interval=1000) {
    if (!nodeinfo) throw new Error('Node object requires at least one argument.')

    this.nodeinfo = nodeinfo;
    this.conn = new Client();
    this.interval = interval;
  }

  watchStats(cb=emptyFunc, delay=undefined) {
    setTimeout(async () => {
      this.stats = {
        gpu: await this._module.getGPUs(this.conn),
        cpu: await this._module.getCPUUsage(this.conn),
        memory: await this._module.getMemory(this.conn),
        uptime: await this._module.getUptime(this.conn)
      }
      cb(this.stats);

      this.watchStats(cb, this.interval);
    }, delay ? delay : this.interval);
  }

  connect() {
    this.conn.connect(this.nodeinfo);

    return new Promise((resolve, reject) => {
      this.conn.on('ready', () => {
        this._module = require('./os/linux');
        resolve();
      })
    })
  }

  getHostname() {
    if (!this._module) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getHostname(this.conn);
  }

  getOS() {
    if (!this._module) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getOS(this.conn);
  }

  getCPUUsage() {
    if (!this._module) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getCPUUsage(this.conn);
  }

  getGPUs() {
    if (!this._module) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getGPUs(this.conn);
  }

  getCPUs() {
    if (!this._module) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getCPUs(this.conn);
  }

  getInfo() {
    if (!this._module) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getNode(this.conn)
      .then((info) => {
        this.info = info;
        return info;
      });
  }

  getUptime() {
    return this._module.getUptime(this.conn);
  }

  sshExec(cmd) {
    if (!this._module) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return utils.sshExec(this.conn, cmd);
  }
}