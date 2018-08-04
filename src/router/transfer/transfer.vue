<template>
  <div style="position: relative;padding-top: 100px;font-size: 20px;">
    <div style="height: 50px;">
      <input id="img-input" accept="*" class="upload-img-input" @change='chooseImg' type="file">
      <label for="img-input" class="upload-img-content-change">选择文件</label>
    </div>
    <div class="file-table">
      <el-table :data="rows" style="width: 100%;" align="center">
        <el-table-column prop="name" label="文件名" width="200">
          <template slot-scope="props">
            {{ getFileName(props.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="文件进度" width="100">
          <template slot-scope="props">
            {{ `${getFileProgress(props.row)}%` }}
          </template>
        </el-table-column>
        <el-table-column prop="speed" label="传输速度" width="100">
          <template slot-scope="props">
            {{ `${getFileSpeed(props.row)}` }}
          </template>
        </el-table-column>
        <el-table-column prop="fileInfo" label="文件大小" width="100">
          <template slot-scope="props">
            {{ getFileSize(props.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="_id" label="操作" width="80">
          <template slot-scope="props">
            pages   <i class="iconfont icon-delete" @click="deleteAttachment(props.row)"></i>
            <i class="iconfont icon-play" v-if="canRestart(props.row)" @click="restartTask(props.row)"></i>
            <i class="iconfont icon-pause" v-if="canStop(props.row)" @click="stopTask(props.row)"></i>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>
  import { formatSize } from '../../common/utils';
  import './transfer.css';

  const FileClient = require('../../common/transfer');

  export default {
    name: 'transfer',
    data() {
      return {
        rows: []
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
        for (let i = 0, len = files.length; i < len; i++) {
          const task = new FileClient({
            file: files[i]
          });
          task.transfer();
          this.rows.push(task);
        }
      },
      getFileName(row) {
        if(row.getFileInfo){
          return row.getFileInfo().name;
        }else{
          return row.name;
        }
      },
      getFileProgress(row) {
        if(row.showProcess){
          return row.showProcess();
        }else{
          return row.progress;
        }
      },
      getFileSpeed(row) {
        if(row.getSpeed){
          return row.getSpeed();
        }else{
          return row.speed || '';
        }
      },
      getFileSize(row) {
        if(row.getFileInfo){
          return formatSize(row.getFileInfo().size);
        }else{
          return formatSize(row.fileInfo.size);
        }
      },
      deleteAttachment(row) {
        row.deleteTask();
        const index = this.rows.indexOf(row);
        this.rows.splice(index, 1);
      },
      canStop(row){
        if(row.getFileInfo){
          return row.canStop();
        }
        return false;
      },
      canRestart(row){
        if(row.getFileInfo){
          return row.canRestart();
        }
        return false;
      },
      stopTask(row){
        if(row.getFileInfo){
          row.stopTask();
        }
      },
      restartTask(row){
        if(row.getFileInfo){
          row.restart();
        }
      }
    }
  };
</script>

