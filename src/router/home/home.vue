<template>
  <div class="home">
    <ul v-if="$route.path === '/'" class="ul-menu-list">
      <li><router-link to="/chat">1. 聊天室</router-link></li>
      <li><router-link to="/transfer">2. 文件传输</router-link></li>
    </ul>
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'home',
    data() {
      return {

      }
    },
    created() {
      console.log(this.$route.path);
    }
  }
</script>

<style>
  .home {
    position:relative;
    height: 100%;
    color: aqua;
  }

  .ul-menu-list {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin-bottom: 200px;
  }

  .ul-menu-list li {
    margin-bottom: 50px;
    text-align: left;
  }

  .ul-menu-list li a {
    text-decoration: none;
    font-size: 40px;
    font-color: teal;
  }

</style>
