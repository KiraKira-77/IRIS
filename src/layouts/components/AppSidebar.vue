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
      <template v-for="group in visibleMenuGroups" :key="group.code">
        <el-menu-item v-if="group.children.length === 1" :index="group.children[0]!.path">
          <el-icon><component :is="groupIconMap[group.code]" /></el-icon>
          <template #title>{{ group.children[0]!.label }}</template>
        </el-menu-item>

        <el-sub-menu v-else :index="`/${group.code}`">
          <template #title>
            <el-icon><component :is="groupIconMap[group.code]" /></el-icon>
            <span>{{ group.label }}</span>
          </template>
          <el-menu-item
            v-for="item in group.children"
            :key="item.code"
            :index="item.path"
          >
            {{ item.label }}
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore, useUserStore } from '@/stores'
import { APP_MENU_GROUPS, filterMenuGroupsByCodes } from '@/features/permissions/menu-access'
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
const userStore = useUserStore()

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)
const visibleMenuGroups = computed(() =>
  filterMenuGroupsByCodes(APP_MENU_GROUPS, userStore.userInfo?.menuCodes || []),
)
const groupIconMap: Record<string, Component> = {
  workbench: Odometer,
  resource: Folder,
  plan: Calendar,
  project: OfficeBuilding,
  rectification: SetUp,
  smart: DataAnalysis,
  system: Setting,
}
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
