<template>
  <div class="page-container iris-page">
    <section class="standards-hero">
      <div class="hero-copy">
        <span class="hero-kicker">资源库</span>
        <h2 class="page-title">标准管理</h2>
        <p class="page-subtitle">维护内控标准、发布状态、可见范围与版本记录。</p>
      </div>
      <div class="hero-panel">
        <div class="hero-stat hero-stat-main">
          <span class="stat-label">标准总量</span>
          <strong>{{ standardStats.total }}</strong>
          <span class="stat-note">当前筛选结果</span>
        </div>
        <div class="hero-stat">
          <span class="stat-label">生效中</span>
          <strong>{{ standardStats.active }}</strong>
        </div>
        <div class="hero-stat">
          <span class="stat-label">草稿</span>
          <strong>{{ standardStats.draft }}</strong>
        </div>
        <div class="hero-stat">
          <span class="stat-label">域内可见</span>
          <strong>{{ standardStats.scoped }}</strong>
        </div>
      </div>
      <div class="hero-actions">
        <el-button
          v-if="canCreateStandard"
          type="primary"
          :icon="Plus"
          size="large"
          @click="openDialog()"
          >新建标准</el-button
        >
      </div>
    </section>

    <!-- 搜索栏 -->
    <div class="standards-toolbar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="标准名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="名称、编号或描述"
            clearable
            class="keyword-input"
            @keyup.enter="handleSearchSubmit"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="searchForm.category"
            placeholder="全部分类"
            clearable
            class="category-select"
            @change="handleFilterChange"
          >
            <el-option label="法律法规" value="law" />
            <el-option label="行业准则" value="industry" />
            <el-option label="内部制度" value="internal" />
            <el-option label="通用标准" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            class="status-select"
            @change="handleFilterChange"
          >
            <el-option label="生效中" value="active" />
            <el-option label="草稿" value="draft" />
            <el-option label="已停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearchSubmit">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <section class="table-shell">
      <div class="table-heading">
        <div>
          <h3>标准台账</h3>
          <p>按最新筛选结果展示，可进入详情查看版本历史。</p>
        </div>
        <span class="table-count">当前页 {{ tableData.length }} 条</span>
      </div>
      <el-table
        :data="tableData"
        v-loading="loading"
        style="width: 100%"
        size="large"
        :default-sort="{ prop: 'uploadDate', order: 'descending' }"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="title" label="标准名称" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            <button class="standard-title-button" type="button" @click="openDetail(row)">
              <span>{{ row.title }}</span>
              <small>{{ row.standardCode }}</small>
            </button>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="130">
          <template #default="{ row }">
            <el-tag :type="categoryType(row.category)" effect="light" round>{{
              categoryLabel(row.category)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="140" align="center">
          <template #default="{ row }">
            <div class="version-cell">
              <span class="version-label">{{ row.version }}</span>
              <el-tag
                v-if="getVersionCount(row) > 1"
                size="small"
                effect="plain"
                round
                type="info"
                class="version-count"
                >共{{ getVersionCount(row) }}版</el-tag
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column label="可见范围" width="140">
          <template #default="{ row }">
            <el-tag
              :type="row.visibilityLevel === 'PUBLIC' ? 'success' : 'warning'"
              effect="light"
              round
            >
              {{ row.visibilityLevel === 'PUBLIC' ? '全员可见' : '域内可见' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="维护域" width="150">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" round>{{ scopeLabel(row.ownerScopeId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploadDate" label="上传日期" width="130" sortable="custom">
          <template #default="{ row }">
            {{ uploadDateLabel(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="dark" size="small">{{
              statusLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
              <el-button
                v-if="getRowAccessState(row).canEdit"
                link
                type="primary"
                size="small"
                @click="openDialog(row)"
                >编辑</el-button
              >
              <el-button
                v-if="getRowAccessState(row).canEdit && row.status === 'active'"
                link
                type="success"
                size="small"
                @click="openUpgradeDialog(row)"
                >升版</el-button
              >
              <el-button
                v-if="getRowAccessState(row).canEdit && row.status === 'active'"
                link
                type="warning"
                size="small"
                @click="handleDisable(row)"
                >停用</el-button
              >
              <el-button
                v-if="getRowAccessState(row).canEdit && row.status === 'disabled'"
                link
                type="success"
                size="small"
                @click="handleEnable(row)"
                >启用</el-button
              >
              <el-button
                v-if="getRowAccessState(row).canDelete"
                link
                type="danger"
                size="small"
                @click="handleDelete(row)"
                >删除</el-button
              >
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新建/编辑抽屉 -->
    <el-drawer v-model="dialogVisible" size="720px" class="standard-editor-drawer" destroy-on-close>
      <template #header>
        <div class="editor-header">
          <div>
            <span class="editor-kicker">{{ editingRow ? '维护标准' : '录入标准' }}</span>
            <h3>{{ editingRow ? '编辑标准' : '新建标准' }}</h3>
          </div>
          <el-tag v-if="editingRow" :type="statusType(editingRow.status)" effect="light" round>
            {{ statusLabel(editingRow.status) }}
          </el-tag>
        </div>
      </template>
      <el-form :model="form" label-position="top" size="large" class="standard-editor-form">
        <section class="form-section">
          <div class="form-section-heading">
            <span>01</span>
            <div>
              <h4>基础信息</h4>
            </div>
          </div>
          <div class="form-grid">
            <el-form-item label="标准编号" required>
              <el-input v-model="form.standardCode" placeholder="例如 STD-001" />
            </el-form-item>
            <el-form-item label="版本号">
              <el-input v-model="form.version" placeholder="如 V1.0" />
            </el-form-item>
          </div>
          <el-form-item label="标准名称" required>
            <el-input v-model="form.title" placeholder="请输入标准名称" />
          </el-form-item>
          <div class="form-grid">
            <el-form-item label="分类" required>
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="法律法规" value="law" />
                <el-option label="行业准则" value="industry" />
                <el-option label="内部制度" value="internal" />
                <el-option label="通用标准" value="system" />
              </el-select>
            </el-form-item>
            <el-form-item label="可见范围" required>
              <el-radio-group v-model="form.visibilityLevel" class="visibility-radio-group">
                <el-radio-button label="PUBLIC">全员可见</el-radio-button>
                <el-radio-button label="SCOPED">域内可见</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>
          <el-form-item label="描述">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="概括适用范围、控制要求或引用场景"
            />
          </el-form-item>
        </section>

        <section class="form-section">
          <div class="form-section-heading">
            <span>02</span>
            <div>
              <h4>权限范围</h4>
            </div>
          </div>
          <el-form-item label="维护域" required>
            <el-select v-model="form.ownerScopeId" style="width: 100%">
              <el-option
                v-for="scope in editableScopeOptions"
                :key="scope.id"
                :label="formatResourceScopeOptionLabel(scope)"
                :value="scope.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.visibilityLevel === 'SCOPED'" label="共享可见范围">
            <el-select
              v-model="form.grantScopeIds"
              multiple
              clearable
              collapse-tags
              collapse-tags-tooltip
              style="width: 100%"
            >
              <el-option
                v-for="scope in grantScopeOptions"
                :key="scope.id"
                :label="formatResourceScopeOptionLabel(scope)"
                :value="scope.id"
              />
            </el-select>
          </el-form-item>
        </section>

        <section class="form-section">
          <div class="form-section-heading">
            <span>03</span>
            <div>
              <h4 class="required-section-title">附件</h4>
            </div>
          </div>
          <div class="attachment-editor">
            <div v-if="editingAttachments.length > 0" class="attachment-section">
              <div class="attachment-section-title">已上传附件</div>
              <div class="attachment-list">
                <div
                  v-for="attachment in editingAttachments"
                  :key="attachment.id"
                  class="attachment-item"
                >
                  <div class="attachment-info">
                    <div class="attachment-name">{{ attachment.name }}</div>
                    <div class="attachment-meta">
                      <span>{{ formatAttachmentSize(attachment.size) }}</span>
                      <span>{{ attachment.uploadedBy || '未知' }}</span>
                      <span>{{ attachment.uploadedAt || '-' }}</span>
                    </div>
                  </div>
                  <div class="attachment-actions">
                    <el-button link type="primary" @click="handleDownloadAttachment(attachment)">
                      下载
                    </el-button>
                    <el-button
                      v-if="editingRow"
                      link
                      type="danger"
                      @click="handleDeleteExistingAttachment(attachment)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <el-upload
              v-model:file-list="pendingAttachmentFiles"
              action="#"
              :auto-upload="false"
              :limit="5"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              :on-change="handleAttachmentFileChange"
              :on-remove="handleAttachmentFileRemove"
              :on-exceed="handleAttachmentFileExceed"
              class="attachment-upload"
            >
              <el-button type="primary" plain>上传附件</el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持 PDF、Word、Excel 格式，单个文件不超过 20MB，保存时自动上传
                </div>
              </template>
            </el-upload>
          </div>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave()">{{
          editingRow ? '保存修改' : '保存'
        }}</el-button>
        <el-button
          type="success"
          @click="handleQuickPublish"
          v-if="!editingRow || editingRow.status === 'draft'"
          >{{ editingRow ? '保存并发布' : '立即发布' }}</el-button
        >
      </template>
    </el-drawer>

    <!-- 升版弹窗 -->
    <el-dialog v-model="upgradeDialogVisible" title="升版标准" width="520px" destroy-on-close>
      <div v-if="upgradeSourceRow" class="upgrade-info">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="标准编号">{{
            upgradeSourceRow.standardCode
          }}</el-descriptions-item>
          <el-descriptions-item label="标准名称">{{ upgradeSourceRow.title }}</el-descriptions-item>
          <el-descriptions-item label="当前版本">
            <el-tag type="info" size="small">{{ upgradeSourceRow.version }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form
        :model="upgradeForm"
        label-width="100px"
        label-position="top"
        size="large"
        style="margin-top: 20px"
      >
        <el-form-item label="新版本号" required>
          <el-input
            v-model="upgradeForm.newVersion"
            placeholder="请输入新版本号，如 V2.0、2026版、Rev.3 等"
          />
        </el-form-item>
        <el-form-item label="说明" required>
          <el-input
            v-model="upgradeForm.changeLog"
            type="textarea"
            :rows="3"
            placeholder="请描述本次修订的主要变更内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="upgradeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpgrade">
          <el-icon style="margin-right: 4px"><TopRight /></el-icon>
          创建新版本草稿
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="标准详情" size="560px" destroy-on-close>
      <div v-if="detailRow" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标准编号">{{ detailRow.standardCode }}</el-descriptions-item>
          <el-descriptions-item label="标准名称"
            ><strong>{{ detailRow.title }}</strong></el-descriptions-item
          >
          <el-descriptions-item label="分类">
            <el-tag :type="categoryType(detailRow.category)" effect="light" round>{{
              categoryLabel(detailRow.category)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="版本">
            <el-tag type="info" effect="dark" size="small">{{ detailRow.version }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detailRow.status)" effect="dark" size="small">{{
              statusLabel(detailRow.status)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="可见范围">
            <el-tag
              :type="detailRow.visibilityLevel === 'PUBLIC' ? 'success' : 'warning'"
              effect="light"
              round
            >
              {{ detailRow.visibilityLevel === 'PUBLIC' ? '全员可见' : '域内可见' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="维护域">
            {{ scopeLabel(detailRow.ownerScopeId) }}
          </el-descriptions-item>
          <el-descriptions-item label="共享可见范围">
            <template v-if="detailRow.grants.length > 0">
              <el-tag
                v-for="grant in detailRow.grants"
                :key="grant.scopeId"
                size="small"
                effect="plain"
                round
                style="margin-right: 4px"
              >
                {{ scopeLabel(grant.scopeId) }}
              </el-tag>
            </template>
            <span v-else>无</span>
          </el-descriptions-item>
          <el-descriptions-item label="我的权限">
            <el-tag :type="detailAccessState?.canEdit ? 'success' : 'info'" effect="light" round>
              {{ detailAccessState?.canEdit ? '可编辑' : '只读' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布日期">{{ detailRow.publishDate }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{
            detailRow.operatorName || '未知'
          }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{
            detailRow.description || '暂无描述'
          }}</el-descriptions-item>
          <el-descriptions-item label="修订说明" v-if="detailRow.changeLog">
            {{ detailRow.changeLog }}
          </el-descriptions-item>
          <el-descriptions-item label="附件">
            <div
              v-if="detailRow.attachments.length > 0"
              class="attachment-list attachment-list--detail"
            >
              <div
                v-for="attachment in detailRow.attachments"
                :key="attachment.id"
                class="attachment-item"
              >
                <div class="attachment-info">
                  <div class="attachment-name">{{ attachment.name }}</div>
                  <div class="attachment-meta">
                    <span>{{ formatAttachmentSize(attachment.size) }}</span>
                    <span>{{ attachment.uploadedBy || '未知' }}</span>
                    <span>{{ attachment.uploadedAt || '-' }}</span>
                  </div>
                </div>
                <div class="attachment-actions">
                  <el-button link type="primary" @click="handleDownloadAttachment(attachment)">
                    下载
                  </el-button>
                </div>
              </div>
            </div>
            <span v-else>无</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 版本历史时间线 -->
        <div v-if="versionHistory.length > 0" class="version-history">
          <h4 class="section-title">
            <el-icon><Clock /></el-icon>
            版本历史
            <span class="version-count-label">（共 {{ versionHistory.length }} 个版本）</span>
          </h4>
          <el-timeline>
            <el-timeline-item
              v-for="(v, idx) in versionHistory"
              :key="v.id"
              :timestamp="v.publishDate"
              :type="
                v.id === detailRow.id ? 'primary' : v.status === 'archived' ? 'info' : 'success'
              "
              :hollow="v.id !== detailRow.id"
              placement="top"
            >
              <div
                class="timeline-card"
                :class="{
                  'is-current': v.id === detailRow.id,
                  'is-expanded': expandedVersions[v.id],
                }"
              >
                <div class="timeline-header" @click="toggleVersionExpand(v.id)">
                  <div class="header-left">
                    <el-tag
                      :type="v.id === detailRow.id ? 'primary' : 'info'"
                      size="small"
                      effect="dark"
                      >{{ v.version }}</el-tag
                    >
                    <el-tag :type="statusType(v.status)" size="small" effect="light">{{
                      statusLabel(v.status)
                    }}</el-tag>
                    <span v-if="v.id === detailRow.id" class="current-badge">← 当前</span>
                  </div>
                  <el-icon class="expand-icon" :class="{ 'is-rotated': expandedVersions[v.id] }">
                    <ArrowDown />
                  </el-icon>
                </div>
                <p v-if="v.changeLog" class="timeline-changelog">
                  <el-icon style="margin-right: 4px; vertical-align: -2px"><EditPen /></el-icon>
                  {{ v.changeLog }}
                </p>
                <p class="timeline-operator">操作人：{{ v.operatorName || '未知' }}</p>

                <!-- 展开的完整内容 -->
                <el-collapse-transition>
                  <div v-show="expandedVersions[v.id]" class="version-detail">
                    <div
                      v-for="section in getVersionHistoryDetailSections(v)"
                      :key="`${v.id}-${section.title}`"
                      class="version-detail-block"
                    >
                      <div class="version-detail-title">{{ section.title }}</div>
                      <el-descriptions :column="1" border size="small" class="version-desc">
                        <el-descriptions-item
                          v-for="item in section.items"
                          :key="`${section.title}-${item.label}`"
                          :label="item.label"
                        >
                          {{ item.value }}
                        </el-descriptions-item>
                      </el-descriptions>
                    </div>

                    <div class="version-detail-block">
                      <div class="version-detail-title">附件</div>
                      <div
                        v-if="v.attachments.length > 0"
                        class="attachment-list attachment-list--detail"
                      >
                        <div
                          v-for="attachment in v.attachments"
                          :key="attachment.id"
                          class="attachment-item"
                        >
                          <div class="attachment-info">
                            <div class="attachment-name">{{ attachment.name }}</div>
                            <div class="attachment-meta">
                              <span>{{ formatAttachmentSize(attachment.size) }}</span>
                              <span>{{ attachment.uploadedBy || '未知' }}</span>
                              <span>{{ attachment.uploadedAt || '-' }}</span>
                            </div>
                          </div>
                          <div class="attachment-actions">
                            <el-button
                              link
                              type="primary"
                              @click="handleDownloadAttachment(attachment)"
                            >
                              下载
                            </el-button>
                          </div>
                        </div>
                      </div>
                      <div v-else class="version-empty-text">无</div>
                    </div>

                    <!-- 与上一版本的变更对比 -->
                    <div v-if="idx < versionHistory.length - 1" class="version-diff">
                      <div class="diff-title">
                        <el-icon><Switch /></el-icon>
                        与前版 {{ versionHistory[idx + 1]?.version }} 的变更
                      </div>
                      <div class="diff-items">
                        <template
                          v-for="change in getVersionChanges(v, versionHistory[idx + 1])"
                          :key="change.field"
                        >
                          <div class="diff-row">
                            <span class="diff-field">{{ change.label }}</span>
                            <div class="diff-values">
                              <span class="diff-old">
                                <el-icon><Remove /></el-icon>
                                {{ change.oldVal || '(空)' }}
                              </span>
                              <span class="diff-new">
                                <el-icon><CirclePlus /></el-icon>
                                {{ change.newVal || '(空)' }}
                              </span>
                            </div>
                          </div>
                        </template>
                        <div
                          v-if="getVersionChanges(v, versionHistory[idx + 1]).length === 0"
                          class="diff-empty"
                        >
                          内容无变化（仅版本号升级）
                        </div>
                      </div>
                    </div>
                    <div v-else class="version-diff">
                      <div class="diff-empty" style="padding: 8px 0">
                        <el-tag type="info" size="small" effect="plain">初始版本</el-tag>
                      </div>
                    </div>

                    <!-- 回退按钮：只在当前查看的不是这个版本且该版本是已归档的时候显示 -->
                    <div
                      v-if="
                        v.status === 'archived' && v.id !== getCurrentActiveId(v.standardGroupId)
                      "
                      class="rollback-action"
                    >
                      <el-button
                        type="warning"
                        size="small"
                        plain
                        @click.stop="openRollbackDialog(v)"
                      >
                        <el-icon style="margin-right: 4px"><RefreshLeft /></el-icon>
                        回退到此版本
                      </el-button>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="drawer-actions">
          <el-button v-if="detailAccessState?.canEdit" type="primary" @click="handleEditFromDrawer"
            >编辑</el-button
          >
          <el-button
            type="success"
            v-if="detailAccessState?.canEdit && detailRow.status === 'active'"
            @click="openUpgradeDialog(detailRow)"
          >
            <el-icon style="margin-right: 4px"><TopRight /></el-icon>
            升版
          </el-button>
          <el-button
            type="success"
            v-if="detailAccessState?.canEdit && detailRow.status === 'draft'"
            @click="handlePublishFromDrawer"
            >发布</el-button
          >
          <el-button
            type="warning"
            v-if="detailAccessState?.canEdit && detailRow.status === 'active'"
            @click="handleDisable(detailRow)"
            >停用</el-button
          >
          <el-button
            type="success"
            v-if="detailAccessState?.canEdit && detailRow.status === 'disabled'"
            @click="handleEnable(detailRow)"
            >启用</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ArrowDown,
  CirclePlus,
  Clock,
  EditPen,
  Plus,
  Refresh,
  RefreshLeft,
  Remove,
  Search,
  Switch,
  TopRight,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadProps, UploadRawFile, UploadUserFile } from 'element-plus'
import { resourceScopeApi, standardApi } from '@/api'
import {
  buildStandardListRequestParams,
  buildStandardSearchInteraction,
  buildStandardSubmitState,
  buildStandardUpsertPayload,
  formatStandardUploadDate,
  normalizeStandardPageFromApi,
  normalizeStandardFromApi,
  validateStandardEditorForm,
} from '@/features/standards/standard-data'
import type { StandardTableSortState } from '@/features/standards/standard-data'
import {
  buildStandardVersionChanges,
  buildVersionHistoryDetailSections,
} from '@/features/standards/standard-version-history'
import { refreshStandardDialogContext } from '@/features/standards/standard-dialog-context'
import { buildStandardAccessState } from '@/features/permissions/standard-access'
import { DEFAULT_RESOURCE_SCOPE_OPTIONS } from '@/features/permissions/user-access'
import {
  filterGrantScopeOptions,
  formatResourceScopeOptionLabel,
  mapResourceScopesToOptions,
  resolveResourceScopeOptions,
} from '@/features/permissions/resource-scope-adapter'
import { useUserStore } from '@/stores'
import type { Attachment, ResourceScopeOption, Standard, UserAccessContext } from '@/types'

const ATTACHMENT_MAX_SIZE = 20 * 1024 * 1024
const ATTACHMENT_ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx'])

const loading = ref(false)
const searchForm = reactive({ keyword: '', category: '', status: '' })
const allStandards = ref<Standard[]>([])
const tableData = ref<Standard[]>([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const sortState = reactive<StandardTableSortState>({ prop: 'uploadDate', order: 'descending' })
const userStore = useUserStore()
const scopeOptions = ref<ResourceScopeOption[]>([...DEFAULT_RESOURCE_SCOPE_OPTIONS])
const currentTenantId = computed(() => userStore.userInfo?.tenantId || 1001)

const emptyAccessContext: UserAccessContext = {
  isSuperAdmin: false,
  scopePermissions: [],
}

const currentAccessContext = computed(() => userStore.accessContext || emptyAccessContext)
const editableScopeOptions = computed(() => {
  const permittedScopes = currentAccessContext.value.isSuperAdmin
    ? scopeOptions.value
    : scopeOptions.value.filter(
        (scope) => hasScopeAction(scope.id, 'create') || hasScopeAction(scope.id, 'manage'),
      )

  const currentOwnerScope = editingRow.value
    ? scopeOptions.value.find((scope) => scope.id === editingRow.value?.ownerScopeId)
    : null

  if (!currentOwnerScope || permittedScopes.some((scope) => scope.id === currentOwnerScope.id)) {
    return permittedScopes
  }

  return [currentOwnerScope, ...permittedScopes]
})
const canCreateStandard = computed(
  () => currentAccessContext.value.isSuperAdmin || editableScopeOptions.value.length > 0,
)

const dialogVisible = ref(false)
const editingRow = ref<Standard | null>(null)
const pendingAttachmentFiles = ref<UploadUserFile[]>([])
const form = reactive({
  standardCode: '',
  title: '',
  category: '',
  version: 'V1.0',
  description: '',
  visibilityLevel: 'PUBLIC' as Standard['visibilityLevel'],
  ownerScopeId: '',
  grantScopeIds: [] as string[],
})
const grantScopeOptions = computed(() =>
  filterGrantScopeOptions(scopeOptions.value, form.ownerScopeId),
)
const editingAttachments = computed(() => editingRow.value?.attachments || [])

const upgradeDialogVisible = ref(false)
const upgradeSourceRow = ref<Standard | null>(null)
const upgradeForm = reactive({
  newVersion: '',
  changeLog: '',
})

const drawerVisible = ref(false)
const detailRow = ref<Standard | null>(null)
const versionHistory = ref<Standard[]>([])
const detailAccessState = computed(() =>
  detailRow.value ? buildStandardAccessState(detailRow.value, currentAccessContext.value) : null,
)

const expandedVersions = reactive<Record<string, boolean>>({})

const toggleVersionExpand = (id: string) => {
  expandedVersions[id] = !expandedVersions[id]
}

const getVersionHistoryDetailSections = (standard: Standard) =>
  buildVersionHistoryDetailSections(standard, { categoryLabel, statusLabel, scopeLabel })

const getVersionChanges = (current: Standard, previous?: Standard) =>
  buildStandardVersionChanges(current, previous, {
    categoryLabel,
    visibilityLabel,
    scopeLabel,
  })

const getCurrentActiveId = (groupId: string): string | null => {
  const active = versionHistory.value.find(
    (item) => item.standardGroupId === groupId && item.status === 'active',
  )
  return active?.id ?? null
}

const getVersionCount = (row: Standard) =>
  row.versionCount ||
  versionHistory.value.filter((item) => item.standardGroupId === row.standardGroupId).length ||
  1

const standardStats = computed(() => {
  const rows = tableData.value

  return {
    total: pagination.total,
    active: rows.filter((item) => item.status === 'active').length,
    draft: rows.filter((item) => item.status === 'draft').length,
    scoped: rows.filter((item) => item.visibilityLevel === 'SCOPED').length,
  }
})

onMounted(() => {
  void Promise.all([loadScopeOptions(), loadStandards()])
})

const loadScopeOptions = async () => {
  try {
    const scopes = await resourceScopeApi.list()
    const mappedOptions = mapResourceScopesToOptions(scopes)

    scopeOptions.value = resolveResourceScopeOptions(mappedOptions, DEFAULT_RESOURCE_SCOPE_OPTIONS)
  } catch {
    scopeOptions.value = [...DEFAULT_RESOURCE_SCOPE_OPTIONS]
  }
}

const loadStandards = async () => {
  loading.value = true

  try {
    const page = normalizeStandardPageFromApi(
      await standardApi.list(buildStandardListRequestParams(searchForm, pagination, sortState)),
    )
    allStandards.value = page.list
    tableData.value = page.list
    pagination.total = page.total
    pagination.page = page.page
    pagination.pageSize = page.pageSize
    syncSelectedRows()
  } finally {
    loading.value = false
  }
}

const handleSortChange = async ({ order }: StandardTableSortState) => {
  sortState.prop = 'uploadDate'
  sortState.order = order === 'ascending' ? 'ascending' : 'descending'
  pagination.page = 1
  await loadStandards()
}

const handleSearchSubmit = async () => {
  const interaction = buildStandardSearchInteraction('submit', searchForm, pagination)

  Object.assign(searchForm, interaction.form)
  Object.assign(pagination, interaction.pagination)

  await loadStandards()
}

const handleFilterChange = async () => {
  const interaction = buildStandardSearchInteraction('filter', searchForm, pagination)

  Object.assign(searchForm, interaction.form)
  Object.assign(pagination, interaction.pagination)

  await loadStandards()
}

const handlePageChange = async (page: number) => {
  const interaction = buildStandardSearchInteraction('paginate', searchForm, pagination, { page })

  Object.assign(pagination, interaction.pagination)
  await loadStandards()
}

const handlePageSizeChange = async (pageSize: number) => {
  const interaction = buildStandardSearchInteraction('resize', searchForm, pagination, { pageSize })

  Object.assign(pagination, interaction.pagination)
  await loadStandards()
}

const handleReset = async () => {
  const interaction = buildStandardSearchInteraction('reset', searchForm, pagination)

  Object.assign(searchForm, interaction.form)
  Object.assign(pagination, interaction.pagination)

  await loadStandards()
}

const refreshScopeDialogContext = async () => {
  try {
    await refreshStandardDialogContext(userStore.fetchUserInfo, loadScopeOptions)
    return true
  } catch {
    ElMessage.error(
      '\u52a0\u8f7d\u6700\u65b0\u7ef4\u62a4\u57df\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u540e\u91cd\u8bd5',
    )
    return false
  }
}

const openDialog = async (row?: Standard) => {
  if (!(await refreshScopeDialogContext())) {
    return
  }

  if (row && !getRowAccessState(row).canEdit) {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u5bf9\u4f60\u662f\u53ea\u8bfb\u7684')
    return
  }
  if (!row && !canCreateStandard.value) {
    ElMessage.warning(
      '\u5f53\u524d\u8d26\u53f7\u6ca1\u6709\u53ef\u521b\u5efa\u6807\u51c6\u7684\u7ef4\u62a4\u57df',
    )
    return
  }

  if (row) {
    editingRow.value = row
    form.standardCode = row.standardCode
    form.title = row.title
    form.category = row.category
    form.version = row.version
    form.description = row.description || ''
    form.visibilityLevel = row.visibilityLevel
    form.ownerScopeId = row.ownerScopeId
    form.grantScopeIds = row.grants.map((grant) => grant.scopeId)
  } else {
    editingRow.value = null
    form.standardCode = ''
    form.title = ''
    form.category = ''
    form.version = 'V1.0'
    form.description = ''
    form.visibilityLevel = 'PUBLIC'
    form.ownerScopeId = editableScopeOptions.value[0]?.id || ''
    form.grantScopeIds = []
  }

  pendingAttachmentFiles.value = []
  dialogVisible.value = true
}

const openDetail = async (row: Standard) => {
  loading.value = true

  try {
    detailRow.value = normalizeStandardFromApi(await standardApi.detail(row.id))
    versionHistory.value = (await standardApi.versions(row.id)).map(normalizeStandardFromApi)
    drawerVisible.value = true
  } finally {
    loading.value = false
  }
}

const openUpgradeDialog = async (row: Standard) => {
  if (!(await refreshScopeDialogContext())) {
    return
  }

  if (!getRowAccessState(row).canEdit) {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u4e0d\u5141\u8bb8\u5347\u7248')
    return
  }

  upgradeSourceRow.value = row
  upgradeForm.newVersion = ''
  upgradeForm.changeLog = ''
  upgradeDialogVisible.value = true
  drawerVisible.value = false
}

const handleSave = async (targetStatus?: Standard['status']) => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const currentRow = editingRow.value
    const nextStatus = targetStatus ?? currentRow?.status ?? 'draft'
    const submitState = buildStandardSubmitState(nextStatus, currentRow, today())
    const shouldPublishSavedDraft =
      Boolean(currentRow) && currentRow?.status === 'draft' && nextStatus === 'active'
    const persistedStatus = shouldPublishSavedDraft ? 'draft' : submitState.status
    const persistedPublishDate = shouldPublishSavedDraft ? null : submitState.publishDate
    let savedStandard: Standard

    if (currentRow) {
      savedStandard = normalizeStandardFromApi(
        await standardApi.update(
          currentRow.id,
          buildStandardUpsertPayload(form, {
            tenantId: currentTenantId.value,
            status: persistedStatus,
            publishDate: persistedPublishDate,
            standardGroupId: currentRow.standardGroupId,
            versionNumber: currentRow.versionNumber,
            previousVersionId: currentRow.previousVersionId,
            changeLog: currentRow.changeLog,
          }),
        ),
      )
    } else {
      savedStandard = normalizeStandardFromApi(
        await standardApi.create(
          buildStandardUpsertPayload(form, {
            tenantId: currentTenantId.value,
            status: submitState.status,
            publishDate: submitState.publishDate,
            changeLog: '\u521d\u59cb\u521b\u5efa',
          }),
        ),
      )
    }

    const uploadedCount = await uploadPendingAttachments(savedStandard.id)
    if (shouldPublishSavedDraft) {
      savedStandard = normalizeStandardFromApi(await standardApi.publish(savedStandard.id))
    }
    dialogVisible.value = false
    await loadStandards()
    updateDetailRow(savedStandard.id)
    ElMessage.success(
      uploadedCount > 0
        ? `${statusSaveMessage(nextStatus, Boolean(currentRow))}，附件已上传`
        : statusSaveMessage(nextStatus, Boolean(currentRow)),
    )
  } finally {
    loading.value = false
  }
}

const handleQuickPublish = async () => {
  await handleSave('active')
}

const handlePublishFromDrawer = async () => {
  const current = detailRow.value
  if (!current) return
  if (!detailAccessState.value?.canEdit) {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u4e0d\u5141\u8bb8\u53d1\u5e03')
    return
  }

  loading.value = true

  try {
    const published = normalizeStandardFromApi(await standardApi.publish(current.id))

    await loadStandards()
    detailRow.value = published
    versionHistory.value = (await standardApi.versions(published.id)).map(normalizeStandardFromApi)
    ElMessage.success('标准已发布，旧版已自动归档')
  } finally {
    loading.value = false
  }
}

const handleUpgrade = async () => {
  if (!upgradeForm.newVersion.trim()) {
    ElMessage.warning('\u8bf7\u8f93\u5165\u65b0\u7248\u672c\u53f7')
    return
  }
  if (!upgradeForm.changeLog.trim()) {
    ElMessage.warning('\u8bf7\u586b\u5199\u4fee\u8ba2\u8bf4\u660e')
    return
  }

  const source = upgradeSourceRow.value
  if (!source) return

  loading.value = true

  try {
    const version = upgradeForm.newVersion.trim()

    const createdDraft = normalizeStandardFromApi(
      await standardApi.upgrade(source.id, {
        version,
        changeLog: upgradeForm.changeLog.trim(),
      }),
    )
    upgradeDialogVisible.value = false
    await loadStandards()

    ElMessage.success(`\u5df2\u521b\u5efa ${version} \u7248\u672c\u8349\u7a3f`)

    await openDialog(createdDraft)
  } finally {
    loading.value = false
  }
}

const openRollbackDialog = (targetVersion: Standard) => {
  ElMessageBox.prompt(
    `将基于「${targetVersion.version}」的内容创建新版本草稿，请输入新版本号：`,
    `\u56de\u9000\u5230 ${targetVersion.version}`,
    {
      confirmButtonText: '下一步',
      cancelButtonText: '\u53d6\u6d88',
      type: 'warning',
      inputPlaceholder: '例如 V3.0',
      inputValidator: (value: string) => {
        if (!value || !value.trim()) return '版本号不能为空'
        return true
      },
    },
  ).then((result) => {
    const version = typeof result === 'string' ? result : (result as { value: string }).value
    ElMessageBox.prompt(`请输入回退到「${targetVersion.version}」的原因：`, '回退原因', {
      confirmButtonText: '确认回退',
      cancelButtonText: '取消',
      type: 'warning',
      inputType: 'textarea',
      inputPlaceholder: '请输入回退原因',
      inputValidator: (value: string) => {
        if (!value || !value.trim()) return '回退原因不能为空'
        return true
      },
    }).then((reasonResult) => {
      const reason =
        typeof reasonResult === 'string' ? reasonResult : (reasonResult as { value: string }).value
      void handleRollback(targetVersion, version, reason)
    })
  })
}

const handleRollback = async (targetVersion: Standard, version: string, reason: string) => {
  loading.value = true

  try {
    const rollbackDraft = normalizeStandardFromApi(
      await standardApi.rollback(targetVersion.id, {
        version: version.trim(),
        reason: reason.trim(),
      }),
    )
    await loadStandards()
    detailRow.value = rollbackDraft
    versionHistory.value = (await standardApi.versions(rollbackDraft.id)).map(
      normalizeStandardFromApi,
    )

    ElMessage.success(
      '\u5df2\u521b\u5efa\u56de\u9000\u8349\u7a3f\uff0c\u53ef\u7f16\u8f91\u540e\u53d1\u5e03',
    )
  } finally {
    loading.value = false
  }
}

const handleDisable = (row: Standard) => {
  if (!getRowAccessState(row).canEdit || row.status !== 'active') {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u4e0d\u5141\u8bb8\u505c\u7528')
    return
  }

  ElMessageBox.confirm(
    `\u786e\u8ba4\u505c\u7528\u6807\u51c6\u300c${row.title}\u300d(${row.version}) \u5417\uff1f`,
    '\u786e\u8ba4\u505c\u7528',
    {
      type: 'warning',
      confirmButtonText: '\u505c\u7528',
      cancelButtonText: '\u53d6\u6d88',
    },
  ).then(async () => {
    loading.value = true

    try {
      const disabled = normalizeStandardFromApi(await standardApi.disable(row.id))
      await loadStandards()
      detailRow.value = detailRow.value?.id === disabled.id ? disabled : detailRow.value
      if (detailRow.value) {
        versionHistory.value = (await standardApi.versions(detailRow.value.id)).map(
          normalizeStandardFromApi,
        )
      }
      ElMessage.success('\u6807\u51c6\u5df2\u505c\u7528')
    } finally {
      loading.value = false
    }
  })
}

const handleEnable = (row: Standard) => {
  if (!getRowAccessState(row).canEdit || row.status !== 'disabled') {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u4e0d\u5141\u8bb8\u542f\u7528')
    return
  }

  ElMessageBox.confirm(
    `\u786e\u8ba4\u542f\u7528\u6807\u51c6\u300c${row.title}\u300d(${row.version}) \u5417\uff1f`,
    '\u786e\u8ba4\u542f\u7528',
    {
      type: 'warning',
      confirmButtonText: '\u542f\u7528',
      cancelButtonText: '\u53d6\u6d88',
    },
  ).then(async () => {
    loading.value = true

    try {
      const enabled = normalizeStandardFromApi(await standardApi.enable(row.id))
      await loadStandards()
      detailRow.value = detailRow.value?.id === enabled.id ? enabled : detailRow.value
      if (detailRow.value) {
        versionHistory.value = (await standardApi.versions(detailRow.value.id)).map(
          normalizeStandardFromApi,
        )
      }
      ElMessage.success('\u6807\u51c6\u5df2\u542f\u7528')
    } finally {
      loading.value = false
    }
  })
}

const handleDelete = (row: Standard) => {
  if (!getRowAccessState(row).canDelete) {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u4e0d\u5141\u8bb8\u5220\u9664')
    return
  }

  ElMessageBox.confirm(
    `\u786e\u8ba4\u5220\u9664\u6807\u51c6\u300c${row.title}\u300d(${row.version}) \u5417\uff1f`,
    '\u8b66\u544a',
    {
      type: 'warning',
      confirmButtonText: '\u786e\u5b9a',
      cancelButtonText: '\u53d6\u6d88',
    },
  ).then(async () => {
    loading.value = true

    try {
      await standardApi.delete(row.id)
      await loadStandards()

      if (detailRow.value?.id === row.id) {
        detailRow.value = null
        drawerVisible.value = false
      }

      ElMessage.success('\u5220\u9664\u6210\u529f')
    } finally {
      loading.value = false
    }
  })
}

const handleAttachmentFileChange: UploadProps['onChange'] = (file, uploadFiles) => {
  const raw = file.raw
  if (!raw || !validateAttachmentFile(raw)) {
    pendingAttachmentFiles.value = uploadFiles.filter((item) => item.uid !== file.uid)
    return
  }

  pendingAttachmentFiles.value = uploadFiles
}

const handleAttachmentFileRemove: UploadProps['onRemove'] = (_file, uploadFiles) => {
  pendingAttachmentFiles.value = uploadFiles
}

const handleAttachmentFileExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('最多上传 5 个附件')
}

const handleDownloadAttachment = (attachment: Attachment) => {
  if (!attachment.url) {
    ElMessage.warning('当前附件暂无可用下载地址')
    return
  }

  window.open(attachment.url, '_blank', 'noopener,noreferrer')
}

const handleDeleteExistingAttachment = (attachment: Attachment) => {
  if (!editingRow.value) {
    return
  }

  ElMessageBox.confirm(`确认删除附件“${attachment.name}”吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(async () => {
    loading.value = true

    try {
      const currentEditingId = editingRow.value?.id
      if (!currentEditingId) {
        return
      }

      await standardApi.deleteAttachment(currentEditingId, attachment.id)
      await loadStandards()
      editingRow.value = normalizeStandardFromApi(await standardApi.detail(currentEditingId))
      ElMessage.success('附件已删除')
    } finally {
      loading.value = false
    }
  })
}

const handleEditFromDrawer = () => {
  if (detailRow.value && detailAccessState.value?.canEdit) {
    openDialog(detailRow.value)
    drawerVisible.value = false
  }
}

const getRowAccessState = (row: Standard) =>
  buildStandardAccessState(row, currentAccessContext.value)

const scopeLabel = (scopeId: string) =>
  scopeOptions.value.find((scope) => scope.id === scopeId)?.label || scopeId

const uploadDateLabel = (row: Standard) => formatStandardUploadDate(row.createdAt, row.publishDate)

const statusSaveMessage = (status: Standard['status'], isEditing: boolean) => {
  if (status === 'active') {
    return isEditing
      ? '\u6807\u51c6\u4fee\u6539\u5e76\u751f\u6548'
      : '\u6807\u51c6\u5df2\u53d1\u5e03'
  }
  if (status === 'archived') {
    return isEditing
      ? '\u6807\u51c6\u5df2\u4fee\u6539\u5e76\u5f52\u6863'
      : '\u6807\u51c6\u5df2\u5f52\u6863'
  }
  if (status === 'disabled') {
    return isEditing ? '\u6807\u51c6\u5df2\u4fee\u6539\u5e76\u505c\u7528' : '\u6807\u51c6\u5df2\u505c\u7528'
  }
  return isEditing ? '\u4fee\u6539\u5df2\u4fdd\u5b58' : '\u5df2\u4fdd\u5b58\u4e3a\u8349\u7a3f'
}

const hasScopeAction = (scopeId: string, action: 'create' | 'manage') => {
  const scopePermission = currentAccessContext.value.scopePermissions.find(
    (permission) => permission.scopeId === scopeId,
  )

  return (
    currentAccessContext.value.isSuperAdmin ||
    Boolean(
      scopePermission?.actions.includes(action) || scopePermission?.actions.includes('manage'),
    )
  )
}

const validateForm = () => {
  const validationSource = editingRow.value
    ? [...versionHistory.value, ...allStandards.value]
    : allStandards.value
  const errors = validateStandardEditorForm(form, validationSource, editingRow.value, {
    existingAttachmentCount: editingAttachments.value.length,
    pendingAttachmentCount: pendingAttachmentFiles.value.length,
  })

  if (errors.length > 0) {
    ElMessage.warning(errors[0])
    return false
  }

  return true
}

const categoryType = (value: string) =>
  (({ law: 'danger', industry: 'warning', internal: 'primary', system: 'info' }) as any)[value] ||
  'info'
const categoryLabel = (value: string) =>
  (
    ({
      law: '\u6cd5\u5f8b\u6cd5\u89c4',
      industry: '\u884c\u4e1a\u51c6\u5219',
      internal: '\u5185\u90e8\u5236\u5ea6',
      system: '\u901a\u7528\u6807\u51c6',
    }) as any
  )[value] || value
const statusType = (value: string) =>
  (({ active: 'success', draft: 'info', disabled: 'warning', archived: 'warning' }) as any)[
    value
  ] || 'info'
const statusLabel = (value: string) =>
  (
    ({
      active: '\u751f\u6548\u4e2d',
      draft: '\u8349\u7a3f',
      disabled: '\u5df2\u505c\u7528',
      archived: '\u5df2\u5f52\u6863',
    }) as any
  )[value] || value
const visibilityLabel = (value: Standard['visibilityLevel']) =>
  value === 'PUBLIC' ? '全员可见' : '域内可见'

const formatAttachmentSize = (size?: number) => {
  if (!size) {
    return '0 B'
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function syncSelectedRows() {
  if (detailRow.value) {
    detailRow.value =
      versionHistory.value.find((item) => item.id === detailRow.value?.id) ||
      allStandards.value.find((item) => item.id === detailRow.value?.id) ||
      detailRow.value
  }

  if (editingRow.value) {
    editingRow.value =
      versionHistory.value.find((item) => item.id === editingRow.value?.id) ||
      allStandards.value.find((item) => item.id === editingRow.value?.id) ||
      editingRow.value
  }

  if (upgradeSourceRow.value) {
    upgradeSourceRow.value =
      versionHistory.value.find((item) => item.id === upgradeSourceRow.value?.id) ||
      allStandards.value.find((item) => item.id === upgradeSourceRow.value?.id) ||
      upgradeSourceRow.value
  }
}

function updateDetailRow(id: string) {
  detailRow.value =
    versionHistory.value.find((item) => item.id === id) ||
    allStandards.value.find((item) => item.id === id) ||
    null
  if (!detailRow.value) {
    drawerVisible.value = false
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

async function uploadPendingAttachments(standardId: string) {
  const files = pendingAttachmentFiles.value
    .map((file) => file.raw)
    .filter((file): file is UploadRawFile => Boolean(file))

  for (const file of files) {
    await standardApi.uploadAttachment(standardId, file)
  }

  pendingAttachmentFiles.value = []
  return files.length
}

function validateAttachmentFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (!ATTACHMENT_ALLOWED_EXTENSIONS.has(extension)) {
    ElMessage.warning('附件仅支持 PDF、Word、Excel 格式')
    return false
  }

  if (file.size > ATTACHMENT_MAX_SIZE) {
    ElMessage.warning('单个附件不能超过 20MB')
    return false
  }

  return true
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.standards-hero {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(420px, 0.9fr) auto;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 18px;
}

.hero-copy,
.hero-panel,
.standards-toolbar,
.table-shell,
.pagination-wrapper {
  background: oklch(99% 0.005 248);
  border: 1px solid oklch(91% 0.016 248);
  box-shadow: 0 10px 28px oklch(55% 0.035 248 / 8%);
}

.hero-copy {
  min-height: 142px;
  padding: 24px 28px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-kicker,
.editor-kicker {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: oklch(50% 0.1 250);
}

.page-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 760;
  color: oklch(24% 0.035 248);
}

.page-subtitle {
  max-width: 52ch;
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: oklch(48% 0.03 248);
}

.hero-panel {
  border-radius: 18px;
  padding: 16px;
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr;
  gap: 10px;
}

.hero-stat {
  min-width: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: oklch(97.5% 0.01 248);
  border: 1px solid oklch(92% 0.014 248);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.hero-stat-main {
  grid-row: span 2;
  background: oklch(95% 0.035 250);
  border-color: oklch(85% 0.06 250);
}

.stat-label,
.stat-note,
.table-count {
  font-size: 12px;
  color: oklch(50% 0.028 248);
}

.hero-stat strong {
  font-size: 25px;
  line-height: 1;
  font-weight: 760;
  color: oklch(28% 0.05 248);
}

.hero-stat-main strong {
  font-size: 38px;
  color: oklch(41% 0.14 250);
}

.hero-actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.standards-toolbar {
  margin-bottom: 18px;
  padding: 16px 18px 0;
  border-radius: 14px;

  :deep(.el-form) {
    display: flex;
    flex-wrap: wrap;
    gap: 0 10px;
  }
}

.keyword-input {
  width: 260px;
}

.category-select {
  width: 160px;
}

.status-select {
  width: 132px;
}

.table-shell {
  border-radius: 16px;
  overflow: hidden;
}

.table-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px 14px;
  border-bottom: 1px solid oklch(92% 0.014 248);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 720;
    color: oklch(26% 0.035 248);
  }

  p {
    margin-top: 5px;
    font-size: 13px;
    color: oklch(52% 0.028 248);
  }
}

.standard-title-button {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  font: inherit;
  text-align: left;
  cursor: pointer;

  span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    color: oklch(35% 0.1 250);
    font-weight: 680;
    white-space: nowrap;
  }

  small {
    color: oklch(56% 0.026 248);
    font-size: 12px;
  }

  &:hover span {
    color: oklch(42% 0.15 250);
  }

  &:focus-visible {
    border-radius: 6px;
    outline: 2px solid oklch(68% 0.13 250);
    outline-offset: 3px;
  }
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  padding: 14px 18px;
  border-radius: 14px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h3 {
    margin: 0;
    font-size: 18px;
    line-height: 1.25;
    font-weight: 760;
    color: oklch(25% 0.035 248);
  }
}

.standard-editor-form {
  display: flex;
  flex-direction: column;
  gap: 10px;

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

.form-section {
  padding: 14px;
  border: 1px solid oklch(91% 0.014 248);
  border-radius: 12px;
  background: oklch(98.5% 0.006 248);
}

.form-section-heading {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;

  > span {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: oklch(94% 0.035 250);
    color: oklch(41% 0.13 250);
    font-size: 12px;
    font-weight: 760;
  }

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 720;
    color: oklch(26% 0.035 248);
  }
}

.required-section-title::before {
  content: '*';
  margin-right: 4px;
  color: var(--el-color-danger);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.visibility-radio-group {
  width: 100%;

  :deep(.el-radio-button) {
    width: 50%;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
  }
}

:deep(.standard-editor-drawer) {
  background: oklch(98% 0.006 248);
}

:deep(.standard-editor-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 18px 20px 14px;
  border-bottom: 1px solid oklch(91% 0.014 248);
}

:deep(.standard-editor-drawer .el-drawer__body) {
  padding: 14px;
  background: oklch(98% 0.006 248);
  overflow-y: auto;
}

:deep(.standard-editor-drawer .el-drawer__footer) {
  padding: 12px 20px;
  border-top: 1px solid oklch(91% 0.014 248);
  background: oklch(99% 0.005 248);
}

:deep(.table-shell .el-table) {
  border-radius: 0;
  box-shadow: none;
}

:deep(.table-shell .el-table th.el-table__cell) {
  background: oklch(97% 0.01 248);
}

@media (max-width: 1180px) {
  .standards-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .standards-hero {
    gap: 12px;
  }

  .hero-copy,
  .hero-panel,
  .standards-toolbar,
  .table-shell,
  .pagination-wrapper {
    border-radius: 12px;
  }

  .hero-copy {
    min-height: auto;
    padding: 18px;
  }

  .hero-panel,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .hero-stat-main {
    grid-row: auto;
  }

  .page-title {
    font-size: 23px;
  }

  .keyword-input,
  .category-select,
  .status-select {
    width: 100%;
  }

  .table-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

.attachment-editor {
  width: 100%;
}

.attachment-section {
  margin-bottom: 12px;
}

.attachment-section-title {
  margin-bottom: 8px;
  font-size: 13px;
  color: $iris-text-secondary;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-list--detail {
  width: 100%;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid $iris-border-light;
  border-radius: 10px;
  background: oklch(97.5% 0.01 248);
}

.attachment-upload {
  padding: 14px;
  border: 1px dashed oklch(83% 0.035 248);
  border-radius: 12px;
  background: oklch(99% 0.004 248);
}

.attachment-info {
  min-width: 0;
  flex: 1;
}

.attachment-name {
  font-size: 14px;
  font-weight: 600;
  color: $iris-text-primary;
  word-break: break-all;
}

.attachment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: $iris-text-secondary;
}

.attachment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

// 版本列样式
.version-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  .version-label {
    color: #64748b;
    font-weight: 500;
  }
  .version-count {
    font-size: 11px;
  }
}

// 升版弹窗
.upgrade-info {
  :deep(.el-descriptions__label) {
    width: 100px;
    white-space: nowrap;
  }
}

.version-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  .type-label {
    font-weight: 600;
    font-size: 14px;
  }
  .type-preview {
    font-size: 12px;
    color: #94a3b8;
  }
}

// 详情抽屉
.detail-content {
  :deep(.el-descriptions__label) {
    width: 120px;
    white-space: nowrap;
  }

  .version-history {
    margin-top: 28px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
      color: $iris-text-primary;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;

      .version-count-label {
        font-size: 13px;
        font-weight: 400;
        color: #94a3b8;
      }
    }

    .timeline-card {
      padding: 10px 14px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
      cursor: pointer;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }

      &.is-current {
        background: #eff6ff;
        border-color: #bfdbfe;
      }

      &.is-expanded {
        background: #fff;
        border-color: #93c5fd;
      }

      .timeline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
      }

      .expand-icon {
        transition: transform 0.3s;
        color: #94a3b8;
        font-size: 14px;

        &.is-rotated {
          transform: rotate(180deg);
        }
      }

      .current-badge {
        font-size: 12px;
        color: #3b82f6;
        font-weight: 600;
      }

      .timeline-changelog {
        margin: 8px 0 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.5;
      }

      .timeline-operator {
        margin: 8px 0 0;
        font-size: 13px;
        color: #94a3b8;
      }

      // 展开区域
      .version-detail {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed #e2e8f0;

        .version-detail-block + .version-detail-block {
          margin-top: 12px;
        }

        .version-detail-title {
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 600;
          color: $iris-text-primary;
        }

        .version-desc {
          :deep(.el-descriptions__label) {
            width: 80px;
            white-space: nowrap;
          }
        }

        .version-empty-text {
          padding: 10px 12px;
          border: 1px dashed #dbe3ee;
          border-radius: 10px;
          font-size: 13px;
          color: $iris-text-secondary;
          background: #f8fafc;
        }
      }

      // 变更对比
      .version-diff {
        margin-top: 12px;

        .diff-title {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .diff-items {
          background: #f1f5f9;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
        }

        .diff-row {
          padding: 6px 0;

          & + .diff-row {
            border-top: 1px solid #e2e8f0;
          }

          .diff-field {
            font-weight: 600;
            color: #334155;
            display: block;
            margin-bottom: 4px;
          }

          .diff-values {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .diff-old {
            color: #dc2626;
            background: #fef2f2;
            padding: 2px 8px;
            border-radius: 4px;
            display: flex;
            align-items: flex-start;
            gap: 4px;
            line-height: 1.6;
            word-break: break-all;
          }

          .diff-new {
            color: #16a34a;
            background: #f0fdf4;
            padding: 2px 8px;
            border-radius: 4px;
            display: flex;
            align-items: flex-start;
            gap: 4px;
            line-height: 1.6;
            word-break: break-all;
          }
        }

        .diff-empty {
          color: #94a3b8;
          font-size: 13px;
          font-style: italic;
        }
      }
    }
  }

  .drawer-actions {
    margin-top: 24px;
    display: flex;
    gap: 12px;
  }
}

:deep(.el-button.is-link) {
  padding: 4px 8px;
  height: auto;
  margin-left: 0;
  margin-right: 8px;

  &:last-child {
    margin-right: 0;
  }
}
</style>
