<template>
  <div style="position:relative;">
    <div class="upload-img-content">
      <template v-if="path">
        <img :src="path" class="upload-img-content-photo">
      </template>
      <template v-else>
        <img class="upload-img-content-photo imgStyle">
      </template>
    </div>
    <input id="img-input" accept="*" class="upload-img-input" @change='chooseImg' type="file">
    <label for="img-input" class="upload-img-content-change">选择文件</label>
    <button @click="stop" :disabled="!canStop">暂停</button>
    <button @click="start" :disabled="!canStart">开始</button>
    <button @click="remove" :disabled="!canDelete">删除</button>
  </div>
</template>
<script>
  const FileClient = require('../common/client');

  export default {
    name: 'transfer',
    data() {
      return {
        path: '',
        canStop: false,
        canStart: false,
        canDelete: false,
        task: null
      };
    },
    mounted() {
    },
    created() {
    },
    methods: {
      addImg() {

      },
      chooseImg(event) {
        const files = event.target.files;
        const tasks = [];
        for (let i = 0, len = files.length; i < len; i++) {
          const task = new FileClient({
            file: files[i]
          });
          task.transfer();
          tasks.push(task);
          this.task = task;     //目前只有一个task
          this.canStop = true;
          this.canDelete = true;
          this.canStart = false;
        }
      },
      stop() {
        this.task.stopTask();
        this.canStop = false;
        this.canStart = true;
      },
      start() {
        this.task.restart();
        this.canStop = true;
        this.canStart = false;
      },
      remove() {
        this.task.destroy();
        this.canStop = false;
        this.canStart = false;
        this.canDelete = false;
      }
    }
  };
</script>
<style>
  .upload-img-content {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .upload-img-content-photo {
    width: 62px;
    height: 62px;
  }

  .upload-img-input {
    position: absolute;
    left: -9999px;
  }

  .upload-img-content-change {
    font-size: 12px;
    color: #1497D6;
    position: absolute;
    top: 74px;
    left: 5px;
    z-index: 1;
  }

  .imgStyle {
    background: url(../assets/logo.png) no-repeat;
    background-size: 100% 100%;
    overflow: hidden;
  }
</style>

