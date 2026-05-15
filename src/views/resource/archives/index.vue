<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">档案管理</h2>
        <span class="page-subtitle">项目归档后生成的一条完整项目档案</span>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="项目名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索项目名称或编号"
            clearable
            style="width: 220px"
            @keyup.enter="loadArchives"
          />
        </el-form-item>
        <el-form-item label="归档状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="可查阅" value="active" />
            <el-option label="已封存" value="sealed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="loadArchives">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-row v-loading="loading" :gutter="16">
      <el-col v-for="archive in archives" :key="archive.id" :xs="24" :sm="12" :lg="8">
        <div class="archive-card" @click="openArchiveDetail(archive)">
          <div class="card-top">
            <div class="icon-circle" :class="archive.status">
              <el-icon :size="22">
                <FolderOpened v-if="archive.status === 'active'" />
                <Lock v-else />
              </el-icon>
            </div>
            <el-tag :type="archive.status === 'active' ? 'success' : 'info'" effect="dark" size="small" round>
              {{ archive.status === 'active' ? '可查阅' : '已封存' }}
            </el-tag>
          </div>
          <h3 class="project-name">{{ archive.projectName }}</h3>
          <p class="archive-code">{{ archive.projectCode || archive.projectId }}</p>
          <p class="archive-date">归档日期：{{ archive.archiveDate || '—' }}</p>
          <div class="archive-metrics">
            <span>{{ archive.taskCount || 0 }} 个检查项</span>
            <span>{{ archive.workOrderCount || 0 }} 个工单</span>
            <span>{{ archive.rectificationCount || 0 }} 个整改单</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-empty v-if="!loading && archives.length === 0" description="暂无项目档案" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, FolderOpened, Lock } from '@element-plus/icons-vue'
import { archiveApi } from '@/api'
import type { Archive, PageResult } from '@/types'

type ArchivePage = PageResult<Archive> & {
  records?: Archive[]
  pageNo?: number
}

const router = useRouter()
const searchForm = reactive({ keyword: '', status: '' })
const loading = ref(false)
const archives = ref<Archive[]>([])

onMounted(() => {
  loadArchives()
})

const loadArchives = async () => {
  loading.value = true
  try {
    const page = (await archiveApi.list({
      page: 1,
      pageSize: 100,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
    })) as ArchivePage
    archives.value = page.records || page.list || []
  } finally {
    loading.value = false
  }
}

const openArchiveDetail = (archive: Archive) => {
  router.push(`/resource/archives/detail/${archive.id}`)
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
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 700;
    color: $iris-text-primary;
  }

  .page-subtitle {
    font-size: 14px;
    color: $iris-text-secondary;
  }
}

.archive-card {
  padding: 20px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid $iris-border-light;
  border-radius: 8px;
  box-shadow: $iris-shadow-card;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: $iris-primary;
    transform: translateY(-2px);
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;

  &.active {
    color: $iris-success;
    background: rgba(16, 185, 129, 0.1);
  }

  &.sealed {
    color: $iris-text-muted;
    background: #f1f5f9;
  }
}

.project-name {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: $iris-text-primary;
}

.archive-code,
.archive-date {
  margin: 0 0 8px;
  font-size: 13px;
  color: $iris-text-muted;
}

.archive-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #eef2f7;
  font-size: 12px;
  color: $iris-text-secondary;
}

</style>
