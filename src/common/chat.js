/**
 * @author yawenxu
 * @date 2018/7/26
 */
const clientConnect = require('socket.io-client');
const config = require('../config');

class Chat {
  constructor (vueInstance) {
    const socket = clientConnect(`ws://${config.socketDomain}/chat`, {
      transports: ['websocket']
    });

    this.socket = socket;
    this.vueInstance = vueInstance;

    socket.on('connected', () => {
      console.log('connected chat server');
      this.status = 'connected';

      socket.on('add user success', (num, username) => {
        console.log('num==>', num);
        this.socket.username = username;
        this.vueInstance.$emit('add user success', num);
      });

      socket.on('add user error', (message) => {
        this.vueInstance.$emit('add user error', message);
      });

      socket.on('user entered', (num, username, socketId) => {
        if (socketId !== socket.id) {
          this.vueInstance.$emit('user entered', num, username);
        }
      });

      socket.on('new message', (message, username, socketId) => {
        this.vueInstance.$emit('new message', message, username, socketId);
      });

      socket.on('user left', (num, username) => {
        this.vueInstance.$emit('user left', num, username);
      });

      socket.on('typing', (username) => {
        this.vueInstance.$emit('typing', username);
      });

      socket.on('stop typing', (username) => {
        this.vueInstance.$emit('stop typing', username);
      });

      socket.on('disconnect', () => {
        this.status === 'disconnected'
        console.log('server disconnect');
      });
    });
  }

  isLogin () {
    if (this.socket && this.socket.username) {
      return true;
    }
    return false;
  }

  getStatus() {
    return this.status;
  }

  canAddUser() {
    if (this.socket && this.status === 'connected' && !this.socket.username) {
      return true;
    }
    return false;
  }

  addUser(username) {
    this.socket.emit('add user', username);
  }

  addMessage(message) {
    this.socket.emit('new message', message);
  }

  typing() {
    this.socket.emit('typing');
  }

  stopTyping() {
    this.socket.emit('stop typing');
  }
}

module.exports = Chat;
