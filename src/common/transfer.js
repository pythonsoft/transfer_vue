/**
 * Created by steven on 2018/07/24.
 */
const utils = require('./utils');
const clientConnect = require('socket.io-client');
const uuid = require('uuid');

const TransferTask = require('./transferTask');

const config = require('../config');

class FileClient {
  constructor(options) {
    this.settings = Object.assign({
      file: '',
      concurrency: 0,
      vueInstance: null
    }, options);

    this.transferTaskInstance = null;
    this.isConnect = false;
    this.passedLength = 0;
    this.socket = null;
    this.stop = false;
    this._id = uuid.v1();
    this.status = 'create';
    const file = this.settings.file;
    this.name = file.name;
    this.size = file.size;
    this.speed = 0;
  }

  getFileInfo() {
    return {
      name: this.name,
      size: this.size
    };
  }

  getId() {
    return this._id;
  }

  transfer() {
    const me = this;

    // me.connectState();
    me.countSpeed();
    const socket = clientConnect(`ws://${config.socketDomain}/file`, {
      transports: ['websocket']
    });

    this.socket = socket;

    socket.on('connected', () => {
      const file = me.settings.file;
      let lastModify = new Date();
      if (file.lastModified) {
        lastModify = new Date(file.lastModified);
      }
      const task = new TransferTask({
        name: file.name,
        size: file.size,
        lastModifiedTime: lastModify.toLocaleDateString(),
        userId: me.settings.userId,
        userName: me.settings.userName,
        _id: me._id
      });
      task.socketId = socket.id;
      socket.emit('headerPackage', task.headerPackage);
      me.transferTaskInstance = task;
      me.isConnect = true;
    });

    socket.on('transfer_start', () => {
      me.sendPartOfFilePackage();
    });

    socket.on('transfer_package_success', (data) => {
      me.transferTaskInstance.setSuccessPackage(data._id);
    });

    socket.on('transfer_package_error', (data) => {
      me.transferTaskInstance.setFailPackage(data._id, data.error);
    });

    socket.on('transfer_package_finish', (data) => {
      me.sendPartOfFilePackage();
    });

    socket.on('transfer_error', (msg) => {
      // console.log(`invalid_request socket id: ${me.getSocketId()}`, msg);
      me.alertError(msg);
      this.status = 'error';
      me.destroy();
    });

    socket.on('invalid_request', (msg) => {
      // console.log(`invalid_request socket id: ${me.getSocketId()}`, msg);
      me.alertError(msg);
      this.status = 'error';
      me.destroy();
    });

    socket.on('complete', () => {
      console.log('file transfer complete');
      this.status = 'complete';
    });

    socket.on('error', (err) => {
      // console.log(`error socket id: ${me.getSocketId()}`, err);
      this.status = 'error';
      me.alertError(err);
      me.destroy();
    });

    socket.on('disconnect', (msg) => {
      // console.log(`disconnect with server${me.getSocketId()}`, msg);
      me.destroy();
    });
  }
  alertError(error) {
    if (this.settings.vueInstance) {
      this.settings.vueInstance.$message.error(error);
    }
  }
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.transferTaskInstance = null;
    this.settings = null;
  }
  stopTask() {
    this.stop = true;
    const pkg = this.transferTaskInstance.getPackage();
    this.socket.emit('stop', pkg.packageInfo);
  }
  restart() {
    this.stop = false;
    this.socket.emit('restart');
  }
  deleteTask() {
    if (this.socket) {
      this.socket.emit('disconnect');
    }
    this.transferTaskInstance = null;
    this.isConnect = false;
    this.passedLength = 0;
    this.socket = null;
  }
  canStop() {
    if (this.stop) {
      return false;
    }
    if (this.status === 'complete' || this.status === 'error' || !this.socket) {
      return false;
    }

    return true;
  }

  canRestart() {
    if (!this.stop) {
      return false;
    }

    if (this.status === 'complete' || this.status === 'error' || !this.socket) {
      return false;
    }

    return true;
  }
  connectState() {
    const me = this;
    const fn = function (count) {
      // console.log(`正在连接服务器(${me.settings.host}:${me.settings.port})...${count}`);
      if (!me.isConnect) {
        setTimeout(() => {
          fn(count + 1);
        }, 1000);
      } else {
        // console.log('已经连上...');
      }
    };

    fn(1);
  }

  getSocketId() {
    return this.transferTaskInstance ? this.transferTaskInstance.socketId : '';
  }

  showProcess() {
    if (this.status === 'complete') {
      return '100';
    }
    const me = this;
    const totalSize = this.size;
    const percent = `${Math.ceil((me.passedLength / totalSize) * 100)}`;
    return percent;
  }

  countSpeed() {
    const me = this;
    const interval = 2000;
    const totalSize = this.size;
    let lastSize = 0;

    const show = function () {
      const percent = Math.ceil((me.passedLength / totalSize) * 100);
      const averageSpeed = (me.passedLength - lastSize) / interval * 1000;

      lastSize = me.passedLength;
      me.speed = `${utils.formatSize(averageSpeed)}/s`;
      // console.log(`已完成${utils.formatSize(me.passedLength)}, ${percent}%, 平均速度：${utils.formatSize(averageSpeed)}/s`);

      if (me.passedLength >= totalSize) {
        // console.log(`共用时：${(Date.now() - startTime) / 1000}秒`);
      } else {
        setTimeout(() => {
          show();
        }, interval);
      }
    };

    show();
  }

  getSpeed() {
    return this.speed;
  }
  sendPartOfFilePackage() {
    let hasTask = true;
    const me = this;

    const createTask = function (index) {
      if (!hasTask) { return false; }
      const pkg = me.transferTaskInstance.getPackage();

      if (pkg === 'done') {
        hasTask = false;
        // console.log('transfer complete');
      } else if (pkg && !me.stop) {
        me.transferTaskInstance._setStartStatus(pkg.packageInfo);
        if (index < me.settings.concurrency) {
          createTask(index + 1);
        }

        const file = me.settings.file;
        // console.log('start==>', pkg.packageInfo);
        const blob = file.slice(pkg.packageInfo.start, pkg.packageInfo.end);
        const reader = new FileReader();

        reader.onerror = function (e) { // 读取失败的时候重新执行一次
          // console.log(e);
        };

        reader.readAsArrayBuffer(blob);
        reader.onload = function () {
          const buffer = reader.result;
          me.passedLength += pkg.packageInfo.size;
          console.log('send package===>');
          me.socket.emit('fileBuffer', buffer, pkg.packageInfo);
        };
      } else {
        hasTask = false;
        // utils.console('all the task is running');
      }
    };

    createTask(0);
  }
}

module.exports = FileClient;
