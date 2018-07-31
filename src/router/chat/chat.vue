<template>
  <div>
    <ul class="pages">
      <li class="chat page">
        <div class="chatArea">
          <ul class="messages">
            <li v-for="item in messageList" :class="getClass(item)">
              <template v-if="item.type === 'log'">
                <span>{{item.message}}</span>
              </template>
              <template v-else-if="item.type === 'message'">
                <span class="username" :style="getUsernameColor(item.username)">{{item.username}}:</span>
                <span class="messageBody">{{item.message}}</span>
              </template>
              <template v-else-if="item.type === 'typing'">
                <span class="username" :style="getUsernameColor(item.username)">{{item.username}}</span>
                <span class="messageBody">{{item.message}}</span>
              </template>
            </li>
          </ul>
        </div>
        <input class="inputMessage" placeholder="Type here..." v-model="message" @input="updateTyping" @keyup.enter="sendMessage"/>
      </li>
      <li class="login page" v-if="!isLogin">
        <div class="form">
          <h3 class="title">你的昵称是?</h3>
          <input class="usernameInput" type="text" maxlength="14" v-model="username" @keyup.enter="login" />
        </div>
      </li>
    </ul>
  </div>
</template>
<script>
  import './chat.css';
  import Vue from 'vue';

  const Chat = require('../../common/chat');

  export default {
    name: 'chat',
    data() {
      return {
        isLogin: false,
        username: '',
        chatInstance: null,
        messageList: [],
        message: '',
        typing: false,
        lastTypingTime: '',
        TYPING_TIMER_LENGTH: 400  //ms
      };
    },
    created() {
      const vueInstance = new Vue();
      this.chatInstance = new Chat(vueInstance);

      vueInstance.$on('add user success', (num) => {
        this.isLogin = true;
        this.messageList.push({
          type: 'log',
          message: `当前共有${num}人在线`
        });
      });

      vueInstance.$on('add user error', (message) => {
        this.$message.error(message);
      });

      vueInstance.$on('user entered', (num, username) => {
        this.messageList.push({
          type: 'log',
          message: `${username} 加入了`
        });
        this.messageList.push({
          type: 'log',
          message: `当前共有${num}人在线`
        });
      });

      vueInstance.$on('user left', (num, username) => {
        this.messageList.push({
          type: 'log',
          message: `${username} 离开了`
        });
        this.messageList.push({
          type: 'log',
          message: `当前共有${num}人在线`
        });
      });

      vueInstance.$on('typing', (username) => {
        this.messageList.push({
          type: 'typing',
          username: username,
          message: '正在输入'
        });
      });

      vueInstance.$on('stop typing', (username) => {
        console.log('stop typing', username);
        for (let i = this.messageList.length - 1; i > -1; i--) {
          if (this.messageList[i].type === 'typing' && this.messageList[i].username === username) {
            console.log('i===>', i);
            this.messageList.splice(i, 1);
            break;
          }
        }
      });

      vueInstance.$on('new message', (message, username) => {
        this.messageList.push({
          type: 'message',
          username: username,
          message: message
        });
      });
    },
    methods: {
      login() {
        if (!this.username) {
          this.$message.error('请输入昵称');
        } else {
          if (this.chatInstance.canAddUser()) {
            this.chatInstance.addUser(this.username);
          }
        }
      },
      sendMessage() {
        if (!this.username) {
          this.$message.error('请输入消息');
        } else {
          this.chatInstance.addMessage(this.message);
          this.messageList.push({
            type: 'message',
            username: this.username,
            message: this.message
          });
          this.message = '';
        }
      },
      updateTyping() {
        console.log('updateTyping');
        if (this.isLogin) {
          if (!this.typing) {
            this.typing = true;
            console.log('typing');
            this.chatInstance.typing();
          }
          this.lastTypingTime = (new Date()).getTime();

          setTimeout(() => {
            const typingTimer = (new Date()).getTime();
            const timeDiff = typingTimer - this.lastTypingTime;
            if (timeDiff >= this.TYPING_TIMER_LENGTH && this.typing) {
              console.log('stop typing');
              this.chatInstance.stopTyping();
              this.typing = false;
            }
          }, this.TYPING_TIMER_LENGTH);
        }
      },
      getClass(item) {
        if (item.type === 'log') {
          return 'log';
        } else if (item.type === 'message') {
          return 'message';
        } else if (item.type === 'typing') {
          return 'message typing';
        }
        return '';
      },
      getUsernameColor(username) {
        let hash = 7;
        for (let i = 0; i < username.length; i++) {
          hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        const COLORS = [
          '#e21400', '#91580f', '#f8a700', '#f78b00',
          '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
          '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
        ];
        const index = Math.abs(hash % COLORS.length);
        return `color:${COLORS[index]};`;
      }
    }
  };
</script>
<style>

</style>
