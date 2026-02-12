<template>
  <el-aside :width="isCollapsed ? '64px' : '240px'" class="app-sidebar">
    <div class="sidebar-header">
      <div class="logo-icon">
        <el-icon :size="24" color="#fff"><Monitor /></el-icon>
      </div>
      <transition name="fade">
        <h1 v-show="!isCollapsed" class="app-title">IRIS Platform</h1>
      </transition>
    </div>

    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      :collapse="isCollapsed"
      background-color="#0f172a"
      text-color="#94a3b8"
      active-text-color="#ffffff"
      unique-opened
      router
    >
      <el-menu-item index="/workbench/dashboard">
        <el-icon><Odometer /></el-icon>
        <template #title>工作台</template>
      </el-menu-item>

      <el-sub-menu index="/resource">
        <template #title>
          <el-icon><Folder /></el-icon>
          <span>资源管理</span>
        </template>
        <el-menu-item index="/resource/standards">标准管理</el-menu-item>
        <el-menu-item index="/resource/checklists">内控清单</el-menu-item>
        <el-menu-item index="/resource/archives">档案管理</el-menu-item>
        <el-menu-item index="/resource/personnel">人员管理</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="/plan">
        <template #title>
          <el-icon><Calendar /></el-icon>
          <span>计划管控</span>
        </template>
        <el-menu-item index="/plan/create">计划编制</el-menu-item>
        <el-menu-item index="/plan/list">计划管理</el-menu-item>
        <el-menu-item index="/plan/overview">计划一览</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="/project">
        <template #title>
          <el-icon><OfficeBuilding /></el-icon>
          <span>项目管理</span>
        </template>
        <el-menu-item index="/project/list">项目列表</el-menu-item>
        <el-menu-item index="/project/create">项目启动</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="/rectification">
        <template #title>
          <el-icon><SetUp /></el-icon>
          <span>整改管理</span>
        </template>
        <el-menu-item index="/rectification/list">整改单列表</el-menu-item>
        <el-menu-item index="/rectification/create">创建整改单</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="/smart">
        <template #title>
          <el-icon><DataAnalysis /></el-icon>
          <span>智能内控</span>
        </template>
        <el-menu-item index="/smart/analysis">统计分析</el-menu-item>
        <el-menu-item index="/smart/rules">规则库</el-menu-item>
        <el-menu-item index="/smart/models">模型库</el-menu-item>
        <el-menu-item index="/smart/tools">工具库</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="/system">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </template>
        <el-menu-item index="/workbench/logs">日志中心</el-menu-item>
        <el-menu-item index="/workbench/alerts">告警中心</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores'
import {
  Monitor,
  Odometer,
  Folder,
  Calendar,
  OfficeBuilding,
  SetUp,
  DataAnalysis,
  Setting,
} from '@element-plus/icons-vue'

const route = useRoute()
const appStore = useAppStore()

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.app-sidebar {
  background-color: $iris-bg-sidebar;
  height: 100vh;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: $iris-header-height;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, $iris-primary 0%, $iris-primary-dark 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .app-title {
    margin-left: 12px;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    letter-spacing: 0.5px;
  }
}

.sidebar-menu {
  border-right: none;
  flex: 1;
  padding-top: 8px;

  :deep(.el-sub-menu__title) {
    &:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
  }

  :deep(.el-menu-item) {
    border-radius: 8px;
    margin: 4px 10px;
    height: 48px;
    line-height: 48px;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }

    &.is-active {
      background: linear-gradient(90deg, $iris-primary 0%, $iris-primary-dark 100%) !important;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba($iris-primary, 0.3);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
