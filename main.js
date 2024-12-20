import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import Chart from 'chart.js'

Vue.use(ElementUI)
Vue.config.productionTip = false

// 添加全局错误处理
Vue.config.errorHandler = function(err, vm, info) {
  console.error('Vue错误:', err)
  console.error('错误信息:', info)
}

window.addEventListener('unhandledrejection', event => {
  console.error('未处理的Promise拒绝:', event.reason)
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app') 