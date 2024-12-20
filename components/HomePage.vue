<template>
  <el-container class="home-container">
    <el-aside :width="isCollapse ? '64px' : '200px'">
      <el-menu
        :router="true"
        :default-active="$route.path"
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#fff"
        active-text-color="#409EFF"
        @select="handleSelect"
      >
        <el-menu-item index="/project-analysis">
          <i class="el-icon-data-line"></i>
          <span slot="title">项目分析</span>
        </el-menu-item>
        
        <el-submenu index="project">
          <template slot="title">
            <i class="el-icon-folder"></i>
            <span>项目管理</span>
          </template>
          <el-menu-item index="/project-manage">项目列表</el-menu-item>
        </el-submenu>

        <el-submenu index="report">
          <template slot="title">
            <i class="el-icon-document"></i>
            <span>测试报告</span>
          </template>
          <el-menu-item index="/test-report">报告列表</el-menu-item>
        </el-submenu>

        <el-submenu index="system">
          <template slot="title">
            <i class="el-icon-setting"></i>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system-manage">系统设置</el-menu-item>
        </el-submenu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header>
        <div class="header-left">
          <i 
            :class="['collapse-btn', 'el-icon-' + (isCollapse ? 'right' : 'left')]"
            @click="toggleCollapse"
          ></i>
        </div>
        <div class="header-right">
          <!-- 头部右侧内容 -->
        </div>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: 'HomePage',
  data() {
    return {
      isCollapse: false
    }
  },
  computed: {
    activeMenu() {
      return this.$route.path
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse;
    },
    handleSelect(key, keyPath) {
      console.log('菜单选择:', key, keyPath);
      if (key.startsWith('/')) {
        this.$router.push(key).catch(err => {
          if (err.name !== 'NavigationDuplicated') {
            console.error('导航错误:', err);
          }
        });
      }
    },
    handleLogout() {
      localStorage.removeItem('token');
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.home-container {
  height: 100vh;
}

.el-aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.el-menu {
  border-right: none;
  height: 100%;
}

.el-menu:not(.el-menu--collapse) {
  width: 200px;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
  padding: 8px;
}

.collapse-btn:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

/* 图标样式 */
.el-menu-item i {
  margin-right: 5px;
  width: 24px;
  text-align: center;
  font-size: 18px;
}

/* 确保子菜单图标对齐 */
.el-submenu i {
  vertical-align: middle;
  margin-right: 5px;
  width: 24px;
  text-align: center;
  font-size: 18px;
}

/* 菜单项文字样式 */
.el-menu-item span,
.el-submenu__title span {
  margin-left: 5px;
}
</style> 