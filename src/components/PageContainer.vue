<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">{{ title }}</h2>
        <div class="breadcrumb" v-if="showBreadcrumb">
          <slot name="breadcrumb"></slot>
        </div>
      </div>
      <div class="header-right">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="page-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  showBreadcrumb: {
    type: Boolean,
    default: true
  }
});
</script>

<style scoped>
.page-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.breadcrumb {
  color: #6b7280;
  font-size: 14px;
}

.page-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
</style> 