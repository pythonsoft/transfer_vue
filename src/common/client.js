/**
 * Created by chaoningxie on 2016/12/10.
 */
const utils = require('./utils');
const clientConnect = require('socket.io-client');
const socketStreamClient = require('socket.io-stream');
const crypto = require('crypto');
const stream = require('stream');

const TransferTask = require('./transferTask');

const config = require('../config');

class FileClient {
  constructor(options) {
    this.settings = Object.assign({
      host: config.host,
      port: config.port,
      key: config.secret.ump,
      userId: 'chaoningx',
      isCrypto: false,
      file: '',
      concurrency: 0,
    }, options);

    this.transferTaskInstance = null;
    this.isConnect = false;
    this.passedLength = 0;
    this.socket = null;
    this.stop = false;
  }

  transfer() {
    const me = this;

    me.connectState();
    me.showProcess(me.settings.file);
    const ticket = utils.cipher(`${me.settings.userId}-${me.settings.isCrypto ? 1 : 0}`, me.settings.key);

    const socket = clientConnect(`http://${me.settings.host}:${me.settings.port}/file?im-ticket=${ticket}&im-key=ump`, {
      extraHeaders: {
        'im-ticket': ticket,
        'im-key': 'ump'
      }
    });

    this.socket = socket;

    socket.on('connect', () => {
      const file = me.settings.file;
      const task = new TransferTask({
        name: file.name,
        size: file.size,
        lastModifiedTime: file.lastModifiedDate.toLocaleDateString()
      });
      task.socketId = socket.id;
      console.log("headerPackage===>",)
      socket.emit('headerPackage', task.headerPackage, config.umpAssistQueueName);
      me.transferTaskInstance = task;
      utils.console('socket connect, socket id blow ', me.getSocketId());
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

    socket.on('invalid_request', (msg) => {
      utils.console(`invalid_request socket id: ${me.getSocketId()}`, msg);
    });

    socket.on('complete', () => {
      utils.console('file transfer complete');
    });

    socket.on('error', (err) => {
      utils.console(`error socket id: ${me.getSocketId()}`, err);
      me.destroy();
    });

    socket.on('disconnect', (msg) => {
      utils.console(`disconnect with server${me.getSocketId()}`, msg);
      me.destroy();
    });
  }
  destroy() {
    this.transferTaskInstance = null;
  }
  stopTask() {
    this.stop = true;
    const pkg = this.transferTaskInstance.getPackage();
    this.socket.emit('stop', pkg.packageInfo, config.umpAssistQueueName);
  }
  restart() {
    this.stop = false;
    this.socket.emit('restart');
  }
  connectState() {
    const me = this;
    const fn = function (count) {
      console.log(`正在连接服务器(${me.settings.host}:${me.settings.port})...${count}`);
      if (!me.isConnect) {
        setTimeout(() => {
          fn(count + 1);
        }, 1000);
      }else{
        console.log('已经连上...');
      }
    };

    fn(1);
  }

  getSocketId() {
    return this.transferTaskInstance ? this.transferTaskInstance.socketId : '';
  }

  showProcess(file) {
    const me = this;
    const totalSize = file.size;
    let lastSize = 0;
    const startTime = Date.now();
    const interval = 5000;

    const show = function () {
      const percent = Math.ceil((me.passedLength / totalSize) * 100);
      const averageSpeed = (me.passedLength - lastSize) / interval * 1000;

      lastSize = me.passedLength;
      console.log(`已完成${utils.formatSize(me.passedLength)}, ${percent}%, 平均速度：${utils.formatSize(averageSpeed)}/s`);

      if (me.passedLength >= totalSize) {
        console.log(`共用时：${(Date.now() - startTime) / 1000}秒`);
      } else {
        setTimeout(() => {
          show();
        }, interval);
      }
    };

    show();
  }

  sendPartOfFilePackage() {
    let hasTask = true;
    const me = this;

    const createTask = function (index) {
      if (!hasTask) { return false; }
      const pkg = me.transferTaskInstance.getPackage();

      if (pkg === 'done') {
        hasTask = false;
        utils.console('transfer complete');
      } else if (pkg && !me.stop) {
        if (index < me.settings.concurrency) {
          createTask(index+1);
        }

        const file = me.settings.file;
        console.log("start==>", pkg.packageInfo.start);
        console.log("end==>", pkg.packageInfo.end);
        const blob = file.slice(pkg.packageInfo.start, pkg.packageInfo.end);
        const reader = new FileReader();

        reader.onerror = function(e){  //读取失败的时候重新执行一次
          console.log(e);
        }

        reader.readAsArrayBuffer(blob);
        reader.onload = function() {
          const buffer = reader.result;
          const rs = new stream.Readable();
          const rStream = socketStreamClient.createStream();
          rs.push(new Uint8Array(buffer));
          rs.push(null);
          if (me.settings.isCrypto) {
            const cipher = crypto.createCipher('aes192', me.settings.key);
            rs.pipe(cipher).pipe(rStream);
          } else {
            rs.pipe(rStream);
          }
          me.passedLength += buffer.size;
          console.log("send package===>");
          socketStreamClient(me.socket).emit('fileStream', rStream, pkg.packageInfo, config.umpAssistQueueName);
        }
      } else {
        hasTask = false;
        // utils.console('all the task is running');
      }
    };

    createTask(0);
  }
}

module.exports = FileClient;
