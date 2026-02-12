<template>
  <el-container class="app-layout">
    <app-sidebar />
    <el-container class="main-container" :class="{ collapsed: isCollapsed }">
      <app-header />
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="iris-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'

const appStore = useAppStore()
const isCollapsed = computed(() => appStore.sidebarCollapsed)
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.app-layout {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.main-container {
  flex-direction: column;
  height: 100vh;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: $iris-bg; // Fixed: Used defined variable $iris-bg
}

.app-main {
  padding: 0; // Padding handled by pages
  overflow-y: auto;
  position: relative;
}
</style>
