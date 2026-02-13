<template>
  <div class="page-container iris-page">
    <div class="profile-header-card">
      <div class="profile-cover">
        <div class="cover-content">
          <h1 class="welcome-text">Hello, {{ userStore.userInfo?.name || 'User' }}</h1>
          <p class="welcome-sub">愿您今天的工作一切顺利</p>
        </div>
      </div>
      <div class="profile-user-info">
        <div class="avatar-wrapper">
          <el-avatar :size="100" :src="userStore.userAvatar || defaultAvatar" class="user-avatar" />
          <div class="status-indicator"></div>
        </div>
        <div class="user-text">
          <h2 class="user-name">
            {{ userStore.userInfo?.name }}
            <el-tag size="small" effect="dark" round class="user-status-tag">在职</el-tag>
          </h2>
          <div class="user-meta">
            <span class="meta-item">
              <el-icon><Postcard /></el-icon>
              {{ userStore.userInfo?.username }}
            </span>
            <span class="meta-divider">|</span>
            <span class="meta-item">
              <el-icon><OfficeBuilding /></el-icon>
              {{ userStore.userInfo?.department || '暂无部门' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-body">
      <el-card class="info-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="header-title">
              <el-icon><User /></el-icon>
              基本信息
            </span>
            <el-button type="primary" link>编辑资料</el-button>
          </div>
        </template>

        <div class="info-grid">
          <div class="info-item">
            <label>用户姓名</label>
            <div class="value">{{ userStore.userInfo?.name }}</div>
          </div>
          <div class="info-item">
            <label>登录账号</label>
            <div class="value font-mono">{{ userStore.userInfo?.username }}</div>
          </div>
          <div class="info-item">
            <label>所属部门</label>
            <div class="value">{{ userStore.userInfo?.department || '—' }}</div>
          </div>
          <div class="info-item">
            <label>用户 ID</label>
            <div class="value font-mono text-muted">{{ userStore.userInfo?.id }}</div>
          </div>
          <div class="info-item">
            <label>联系电话</label>
            <div class="value">
              <span v-if="userStore.userInfo?.phone">{{ userStore.userInfo.phone }}</span>
              <span v-else class="text-placeholder">未绑定</span>
            </div>
          </div>
          <div class="info-item">
            <label>电子邮箱</label>
            <div class="value">
              <span v-if="userStore.userInfo?.email">{{ userStore.userInfo.email }}</span>
              <span v-else class="text-placeholder">未绑定</span>
            </div>
          </div>
        </div>
      </el-card>

      <div class="profile-footer">
        <p>IRIS IT Risk & Control Platform</p>
        <p class="copyright">© 2026 Current Version v1.0.0 (Beta)</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores'
import { User, OfficeBuilding, Postcard } from '@element-plus/icons-vue'

const userStore = useUserStore()
const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

onMounted(async () => {
  if (!userStore.userInfo && userStore.isLoggedIn) {
    await userStore.fetchUserInfo()
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.profile-header-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.profile-cover {
  height: 180px;
  background: linear-gradient(120deg, $iris-primary 0%, #3b82f6 50%, #6366f1 100%);
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 32px;

  // Pattern overlay
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  .cover-content {
    position: relative;
    z-index: 1;
    color: white;

    .welcome-text {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .welcome-sub {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 4px;
    }
  }
}

.profile-user-info {
  padding: 0 32px 24px;
  display: flex;
  align-items: flex-end;
  margin-top: -40px;
  position: relative;

  .avatar-wrapper {
    position: relative;
    margin-right: 24px;

    .user-avatar {
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      background: white;
    }

    .status-indicator {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 16px;
      height: 16px;
      background: #10b981;
      border: 3px solid white;
      border-radius: 50%;
    }
  }

  .user-text {
    padding-bottom: 24px;

    .user-name {
      font-size: 24px;
      font-weight: 600;
      color: $iris-text-primary;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      color: $iris-text-secondary;
      font-size: 14px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;

        .el-icon {
          font-size: 16px;
        }
      }

      .meta-divider {
        color: $iris-border-light;
      }
    }
  }
}

.info-card {
  border: none;
  border-radius: 12px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: $iris-text-primary;
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: $iris-primary;
        font-size: 18px;
      }
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); // Changed to 3 columns
  gap: 24px;
  padding: 8px 0;

  .info-item {
    label {
      display: block;
      font-size: 13px;
      color: $iris-text-muted;
      margin-bottom: 6px;
    }

    .value {
      font-size: 15px;
      color: $iris-text-primary;
      font-weight: 500;

      &.font-mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      .text-placeholder {
        color: $iris-text-placeholder;
        font-style: italic;
      }
    }
  }
}

.text-muted {
  color: $iris-text-muted !important;
}

.profile-footer {
  text-align: center;
  margin-top: 40px;
  color: $iris-text-placeholder;
  font-size: 12px;

  p {
    margin: 4px 0;
  }

  .copyright {
    opacity: 0.8;
  }
}
</style>
