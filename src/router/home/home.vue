<template>
  <div>
    <ul>
      <li><router-link to="/chat">聊天室</router-link></li>
      <li><router-link to="/transfer">文件传输</router-link></li>
    </ul>
  </div>
</template>

<script>
  export default {
    name: 'home',
    data() {
      return {

      }
    }
  }
</script>
