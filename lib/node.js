'use strict';

const Client = require('ssh2').Client;
const path = require('path');
const Promise = require('bluebird');

const utils = require('./utils');

const emptyFunc = () => {};

module.exports = class Node {
  constructor(nodeinfo, interval=1000) {
    /* istanbul ignore next */
    if (!nodeinfo) throw new Error('Node object requires at least one argument.')

    this._isConnected = false;
    this.nodeinfo = nodeinfo;
    this.conn = new Client();
    this.interval = interval;
  }

  watchStats(cb=emptyFunc, delay=undefined) {
    if (!this._isConnected) return;

    setTimeout(async () => {
      this.stats = {
        gpu: await this._module.getGPUUsage(this.conn),
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
        this._isConnected = true;
        this._module = require(path.join(__dirname, 'os', 'linux'));
        resolve();
      })
    })
  }

  getHostname() {
    /* istanbul ignore next */
    if (!this._isConnected) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getHostname(this.conn);
  }

  getOS() {
    /* istanbul ignore next */
    if (!this._isConnected) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getOS(this.conn);
  }

  getCPUUsage() {
    /* istanbul ignore next */
    if (!this._isConnected) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getCPUUsage(this.conn);
  }

  getGPUs() {
    /* istanbul ignore next */
    if (!this._isConnected) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getGPUs(this.conn);
  }

  getCPUs() {
    /* istanbul ignore next */
    if (!this._isConnected) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getCPUs(this.conn);
  }

  getInfo() {
    /* istanbul ignore next */
    if (!this._isConnected) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getInfo(this.conn)
      .then((info) => {
        this.info = info;
        return info;
      });
  }

  getUptime() {
    /* istanbul ignore next */
    if (!this._isConnected) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return this._module.getUptime(this.conn);
  }

  sshExec(cmd) {
    /* istanbul ignore next */
    if (!this._isConnected) throw Error('SSH connection is not opened yet. Call connect() to open.');

    return utils.sshExec(this.conn, cmd);
  }

  close() {
    return new Promise((resolve, reject) => {
      this.conn.on('close', (error) => {
        if (error) return reject(new Error('Unable to close connection.'));
        this._isConnected = false;
        resolve();
      })

      this.conn.end();
    })
  }
}