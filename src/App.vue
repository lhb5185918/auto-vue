<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  created() {
    // 页面加载时检查localStorage中是否有token
    const token = localStorage.getItem('token');
    if (token) {
      // 如果有token，设置到axios默认header中
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};
</script>

<style scoped>
/* 你的样式 */
</style>