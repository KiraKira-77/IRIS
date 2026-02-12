<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">档案管理</h2>
        <span class="page-subtitle">项目档案与工作底稿台账</span>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="项目名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索项目名称"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="归档状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="可查阅" value="active" />
            <el-option label="已封存" value="sealed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 档案卡片列表 -->
    <el-row :gutter="20">
      <el-col :span="8" v-for="archive in filteredArchives" :key="archive.id">
        <div class="archive-card" @click="openDrawer(archive)">
          <div class="card-top">
            <div class="icon-circle" :class="archive.status">
              <el-icon :size="24"
                ><FolderOpened v-if="archive.status === 'active'" /><Lock v-else
              /></el-icon>
            </div>
            <el-tag
              :type="archive.status === 'active' ? 'success' : 'info'"
              effect="dark"
              size="small"
              round
            >
              {{ archive.status === 'active' ? '可查阅' : '已封存' }}
            </el-tag>
          </div>
          <h3 class="project-name">{{ archive.projectName }}</h3>
          <p class="archive-date">归档日期：{{ archive.archiveDate }}</p>
          <div class="doc-count">
            <el-icon><Document /></el-icon>
            <span>{{ archive.documents.length }} 份文档</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 档案详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="档案详情" size="550px" destroy-on-close>
      <div v-if="selectedArchive" class="drawer-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="项目名称"
            ><strong>{{ selectedArchive.projectName }}</strong></el-descriptions-item
          >
          <el-descriptions-item label="归档日期">{{
            selectedArchive.archiveDate
          }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="selectedArchive.status === 'active' ? 'success' : 'info'"
              effect="dark"
              size="small"
            >
              {{ selectedArchive.status === 'active' ? '可查阅' : '已封存' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title">文档清单</h4>
        <el-table :data="selectedArchive.documents" size="small" border>
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="category" label="分类" width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="light">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="文件名" min-width="200">
            <template #default="{ row }">
              <el-link type="primary" :underline="false">
                <el-icon style="margin-right: 4px"><Document /></el-icon>
                {{ row.name }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default>
              <el-button link type="primary" size="small">下载</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="drawer-actions" v-if="selectedArchive.status === 'active'">
          <el-button type="primary" :icon="Upload">上传文档</el-button>
          <el-button type="warning" @click="handleSeal">封存档案</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Search, FolderOpened, Lock, Document, Upload } from '@element-plus/icons-vue'
import { mockArchives } from '@/mock'
import type { Archive } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({ keyword: '', status: '' })

const filteredArchives = computed(() => {
  return mockArchives.filter((item) => {
    if (searchForm.keyword && !item.projectName.includes(searchForm.keyword)) return false
    if (searchForm.status && item.status !== searchForm.status) return false
    return true
  })
})

const drawerVisible = ref(false)
const selectedArchive = ref<Archive | null>(null)

const openDrawer = (archive: Archive) => {
  selectedArchive.value = archive
  drawerVisible.value = true
}

const handleSeal = () => {
  ElMessageBox.confirm('封存后将无法修改，确认封存吗？', '封存档案', {
    type: 'warning',
    confirmButtonText: '确认封存',
    cancelButtonText: '取消',
  }).then(() => {
    if (selectedArchive.value) {
      selectedArchive.value.status = 'sealed'
      ElMessage.success('档案已封存')
    }
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: $iris-text-primary;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }
  .page-subtitle {
    font-size: 14px;
    color: $iris-text-secondary;
  }
}

.archive-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: $iris-shadow-card;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $iris-shadow-card-hover;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      &.active {
        background: rgba(16, 185, 129, 0.1);
        color: $iris-success;
      }
      &.sealed {
        background: #f1f5f9;
        color: $iris-text-muted;
      }
    }
  }

  .project-name {
    font-size: 16px;
    font-weight: 600;
    color: $iris-text-primary;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  .archive-date {
    font-size: 13px;
    color: $iris-text-muted;
    margin-bottom: 12px;
  }
  .doc-count {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: $iris-text-secondary;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 24px 0 12px;
  padding-left: 12px;
  border-left: 4px solid $iris-primary;
}

.drawer-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>
