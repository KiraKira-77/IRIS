<template>
  <el-header class="app-header" :class="{ 'is-workbench-dashboard': isWorkbenchDashboard }">
    <div class="left-panel">
      <div class="collapse-btn" @click="appStore.toggleSidebar">
        <el-icon :size="20">
          <component :is="appStore.sidebarCollapsed ? Expand : Fold" />
        </el-icon>
      </div>

      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbs"
          :key="index"
          :to="item.path ? { path: item.path } : undefined"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="right-panel">
      <el-tooltip content="文档中心" placement="bottom">
        <div class="icon-btn" @click="openDocumentCenter">
          <el-icon :size="18"><Document /></el-icon>
        </div>
      </el-tooltip>

      <el-tooltip content="消息通知" placement="bottom">
        <div class="icon-btn" @click="openMessageCenter">
          <el-badge :hidden="unreadAlertCount === 0" is-dot class="notice-badge">
            <el-icon :size="18"><Bell /></el-icon>
          </el-badge>
        </div>
      </el-tooltip>

      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-profile">
          <el-avatar
            :size="32"
            class="user-avatar"
            :src="
              userStore.userAvatar ||
              'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
            "
          />
          <span class="username">{{ userStore.userName || 'Admin' }}</span>
          <el-icon class="el-icon--right"><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item command="settings">系统设置</el-dropdown-item>
            <el-dropdown-item divided command="logout" class="logout-item">
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/stores'
import { alertApi } from '@/api'
import { Fold, Expand, Bell, Document, CaretBottom } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import type { AlertEvent } from '@/types'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const unreadAlertCount = ref(0)
const isWorkbenchDashboard = computed(() => route.path === '/workbench/dashboard')

const breadcrumbs = computed(() => {
  return route.matched
    .filter((item) => item.meta && item.meta.title && item.meta.title !== '首页')
    .map((item) => ({
      title: item.meta.title as string,
      path: item.children.length ? undefined : item.path,
    }))
})

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      await userStore.logout()
      router.push('/login')
    })
  }
}

onMounted(() => {
  loadUnreadAlertCount()
})

async function loadUnreadAlertCount() {
  try {
    const result = await alertApi.list({ page: 1, pageSize: 100 })
    const alerts = readAlertList(result)
    unreadAlertCount.value = alerts.filter((item) => !item.acknowledged).length
  } catch {
    unreadAlertCount.value = 0
  }
}

function readAlertList(result: { records?: AlertEvent[]; list?: AlertEvent[] }): AlertEvent[] {
  if (Array.isArray(result.records)) return result.records
  return Array.isArray(result.list) ? result.list : []
}

function openDocumentCenter() {
  router.push('/resource/archives')
}

function openMessageCenter() {
  router.push('/workbench/alerts')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.app-header {
  height: $iris-header-height;
  background: #fff;
  border-bottom: 1px solid $iris-border-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 10;
}

.app-header.is-workbench-dashboard {
  background:
    linear-gradient(90deg, oklch(7% 0.03 230), oklch(10% 0.04 242) 58%, oklch(7.5% 0.03 228));
  border-bottom-color: oklch(78% 0.15 205 / 24%);
  box-shadow:
    inset 0 -1px 0 oklch(78% 0.14 205 / 9%),
    0 10px 28px oklch(0% 0 0 / 18%);

  .collapse-btn,
  .icon-btn {
    color: oklch(87% 0.03 220);

    &:hover {
      background: oklch(100% 0 0 / 8%);
      color: oklch(84% 0.13 205);
    }
  }

  .user-profile {
    color: oklch(91% 0.026 220);

    &:hover {
      background: oklch(100% 0 0 / 8%);
    }

    .username {
      color: oklch(94% 0.02 220);
    }
  }

  :deep(.el-breadcrumb__separator) {
    color: oklch(82% 0.05 220 / 52%);
  }

  :deep(.el-breadcrumb__inner) {
    color: oklch(94% 0.02 220) !important;

    &.is-link {
      color: oklch(82% 0.04 220) !important;

      &:hover {
        color: oklch(84% 0.13 205) !important;
      }
    }
  }
}

.left-panel {
  display: flex;
  align-items: center;
  gap: 20px;

  .collapse-btn {
    cursor: pointer;
    color: $iris-text-secondary;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: $iris-bg;
      color: $iris-primary;
    }
  }
}

.right-panel {
  display: flex;
  align-items: center;
  gap: 16px;

  .icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $iris-text-secondary;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: $iris-bg;
      color: $iris-primary;
    }

    .notice-badge {
      display: flex;
    }
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: $iris-bg;
    }

    .username {
      font-size: 14px;
      font-weight: 500;
      color: $iris-text-primary;
    }
  }
}

:deep(.el-breadcrumb__inner) {
  font-weight: 500 !important;

  &.is-link {
    font-weight: 400 !important;
    color: $iris-text-muted;

    &:hover {
      color: $iris-primary;
    }
  }
}
</style>
