<template>
  <div class="page-container iris-page">
    <section class="archive-header" v-loading="loading">
      <div class="header-top">
        <div class="title-section">
          <el-button link :icon="Back" class="back-btn" @click="router.push('/resource/archives')">
            返回档案列表
          </el-button>
          <div class="title-content">
            <h2 class="project-title">{{ snapshotProject.projectName || archive?.projectName || '项目档案详情' }}</h2>
            <div class="meta" v-if="archive">
              <span class="code">{{ snapshotProject.projectCode || archive.projectCode || archive.projectId }}</span>
              <el-tag :type="projectStatusType(snapshotProject.status || 'archived')" effect="dark" size="small" round>
                {{ projectStatusLabel(snapshotProject.status || 'archived') }}
              </el-tag>
              <el-tag :type="snapshotProject.source === 'plan' ? 'primary' : 'warning'" effect="light" size="small" round>
                {{ projectSourceLabel(snapshotProject.source) }}
              </el-tag>
              <el-tag :type="archive.status === 'active' ? 'success' : 'info'" effect="dark" size="small" round>
                {{ archive.status === 'active' ? '可查阅' : '已封存' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <div class="archive-stats" v-if="archive">
        <div class="stat-item">
          <label>项目负责人</label>
          <div class="value">{{ snapshotProject.leaderName || leaderName }}</div>
        </div>
        <div class="stat-item">
          <label>项目时间</label>
          <div class="value">{{ archiveProjectTimeText || '暂无' }}</div>
        </div>
        <div class="stat-item">
          <label>归档时间</label>
          <div class="value">{{ archive.archiveDate || archiveSnapshot.archivedAt || '暂无' }}</div>
        </div>
        <div class="stat-item">
          <label>归档人</label>
          <div class="value">{{ archive.archivedByName || archiveSnapshot.archivedByName || '暂无' }}</div>
        </div>
        <div class="stat-item">
          <label>项目成员</label>
          <div class="value">{{ snapshotMembers.length }} 人</div>
        </div>
        <div class="stat-item">
          <label>检查项</label>
          <div class="value">{{ snapshotTasks.length }} 项</div>
        </div>
        <div class="stat-item">
          <label>OMS 工单</label>
          <div class="value">{{ snapshotWorkOrders.length }} 个</div>
        </div>
        <div class="stat-item flex-grow">
          <label>完成进度</label>
          <div class="value progress-value">
            <el-progress
              :percentage="archiveProgress"
              :stroke-width="10"
              :status="archiveProgress === 100 ? 'success' : undefined"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="detail-shell" v-if="archive">
      <el-tabs v-model="activeTab" class="archive-tabs">
        <el-tab-pane label="项目概览" name="overview">
          <div class="overview-layout">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="项目名称">{{ snapshotProject.projectName || archive.projectName }}</el-descriptions-item>
              <el-descriptions-item label="项目编号">{{ snapshotProject.projectCode || archive.projectCode || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="项目来源">{{ projectSourceLabel(snapshotProject.source) }}</el-descriptions-item>
              <el-descriptions-item label="关联计划">{{ snapshotProject.planName || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="项目状态">
                <el-tag :type="projectStatusType(snapshotProject.status || 'archived')" size="small" effect="dark" round>
                  {{ projectStatusLabel(snapshotProject.status || 'archived') }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="归档状态">{{ archive.status === 'active' ? '可查阅' : '已封存' }}</el-descriptions-item>
              <el-descriptions-item label="开始日期">{{ snapshotProject.startDate || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="结束日期">{{ snapshotProject.endDate || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ snapshotProject.leaderName || leaderName }}</el-descriptions-item>
              <el-descriptions-item label="检查清单">{{ listText(snapshotProject.checklistIds) }}</el-descriptions-item>
              <el-descriptions-item label="项目标签">{{ listText(snapshotProject.tagNames) }}</el-descriptions-item>
              <el-descriptions-item label="快照版本">{{ archive.snapshotVersion || archiveSnapshot.snapshotVersion || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="项目描述" :span="2">
                {{ snapshotProject.description || '暂无' }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="summary-strip">
              <div v-for="item in summaryItems" :key="item.label" class="summary-item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="检查项" name="tasks">
          <el-table :data="snapshotTasks" row-key="id" size="large">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="checkContent" label="检查项" min-width="260" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="strong-text">{{ row.checkContent || row.taskName || '暂无' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="checkCriterion" label="判断标准" min-width="220" show-overflow-tooltip />
            <el-table-column prop="controlFrequency" label="控制频率" width="130" />
            <el-table-column prop="evaluationType" label="评估类" width="120" />
            <el-table-column prop="assigneeName" label="负责人" width="120" />
            <el-table-column prop="contactName" label="对接人" width="120" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="taskStatusType(row.status)" size="small" effect="dark" round>
                  {{ taskStatusLabel(row.status) || '暂无' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="completedAt" label="完成时间" width="170" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openTaskDetail(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="项目成员" name="members">
          <div class="team-grid">
            <div v-for="(member, index) in snapshotMembers" :key="member.id || member.personnelId || index" class="team-card">
              <el-avatar :size="44" :style="{ background: avatarColors[index % avatarColors.length] }">
                {{ member.personnelName?.charAt(0) || '?' }}
              </el-avatar>
              <div class="team-info">
                <div class="team-name">{{ member.personnelName || '暂无' }}</div>
                <div class="team-meta">{{ member.employeeNo || '暂无' }} · {{ member.department || '暂无' }}</div>
                <el-tag size="small" :type="roleType(member.role)" effect="light" round>
                  {{ roleLabel(member.role) }}
                </el-tag>
              </div>
            </div>
          </div>
          <el-empty v-if="snapshotMembers.length === 0" description="暂无项目成员" :image-size="96" />
        </el-tab-pane>

        <el-tab-pane label="整改单" name="rectifications">
          <el-table :data="snapshotRectifications" row-key="id" size="large">
            <el-table-column prop="rectificationCode" label="整改单号" min-width="150" />
            <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
            <el-table-column prop="checkContent" label="来源检查项" min-width="220" show-overflow-tooltip />
            <el-table-column prop="assigneeName" label="负责人" width="120" />
            <el-table-column prop="contactName" label="对接人" width="120" />
            <el-table-column prop="deadline" label="整改期限" width="170" />
            <el-table-column prop="completedAt" label="完成时间" width="170" />
            <el-table-column prop="reviewResult" label="审核结果" width="120" />
            <el-table-column prop="status" label="状态" width="110" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openRectificationDetail(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="归档附件" name="documents">
          <el-table :data="archive.documents || []" row-key="id" size="large">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="category" label="分类" width="160" />
            <el-table-column prop="name" label="文件名" min-width="280" show-overflow-tooltip />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <div v-if="archiveDocumentDownloadItems(row).length" class="archive-downloads">
                  <el-link
                    v-for="item in archiveDocumentDownloadItems(row)"
                    :key="item.url"
                    :href="item.url"
                    :download="item.name"
                    target="_blank"
                    type="primary"
                    :underline="false"
                  >
                    <el-icon><Download /></el-icon>
                    <span>下载</span>
                  </el-link>
                </div>
                <el-text v-else type="info" size="small">暂无地址</el-text>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-drawer
      v-model="taskDetailVisible"
      title="检查项详情"
      size="760px"
      destroy-on-close
      append-to-body
    >
      <div v-if="selectedTask" class="task-detail">
        <div class="task-detail-header">
          <div>
            <h3>{{ selectedTask.checkContent || selectedTask.taskName || '检查项详情' }}</h3>
            <p>{{ selectedTask.checkCriterion || '暂无判断标准' }}</p>
          </div>
          <el-tag :type="taskStatusType(selectedTask.status)" size="small" effect="dark" round>
            {{ taskStatusLabel(selectedTask.status) || '暂无' }}
          </el-tag>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="检查清单">{{ selectedTask.checklistName || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ selectedTask.taskName || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="控制频率">{{ selectedTask.controlFrequency || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="评估类">{{ selectedTask.evaluationType || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedTask.assigneeName || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="对接人">{{ selectedTask.contactName || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="下发时间">{{ selectedTask.issuedAt || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ selectedTask.completedAt || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="任务说明" :span="2">
            {{ selectedTask.taskDescription || '暂无' }}
          </el-descriptions-item>
        </el-descriptions>

        <section class="task-detail-section">
          <div class="section-title">
            <h4>工单记录</h4>
            <span>{{ taskWorkOrders(selectedTask).length }} 个</span>
          </div>
          <div v-if="taskWorkOrders(selectedTask).length" class="work-order-record-list">
            <div
              v-for="order in taskWorkOrders(selectedTask)"
              :key="order.id || order.omsWorkOrderId"
              class="work-order-card"
            >
              <div class="work-order-card-toolbar">
                <div>
                  <strong>{{ workOrderDisplayTitle(order) }}</strong>
                  <span>{{ workOrderDisplayCode(order) }}</span>
                </div>
                <div class="work-order-card-actions">
                  <el-tag size="small" effect="light" round>
                    {{ workOrderStatusLabel(order) }}
                  </el-tag>
                  <el-button link type="primary" size="small" @click="openWorkOrderDetail(order)">
                    详情/日志
                  </el-button>
                </div>
              </div>
              <div class="work-order-card-summary">
                <div>
                  <label>处理人</label>
                  <span>{{ order.handlerName || '暂无' }}</span>
                </div>
                <div>
                  <label>IRIS 审核</label>
                  <span>{{ order.irisReviewStatus || '暂无' }}</span>
                </div>
                <div>
                  <label>完成时间</label>
                  <span>{{ order.completedAt || '暂无' }}</span>
                </div>
              </div>
              <div class="work-order-card-note">
                <label>工单说明</label>
                <p>{{ order.workOrderDescription || '暂无' }}</p>
              </div>
              <div class="work-order-card-note">
                <label>OMS 结果</label>
                <p>{{ order.omsResultSummary || '暂无' }}</p>
              </div>
              <div class="work-order-card-note">
                <label>审核意见</label>
                <p>{{ order.irisReviewOpinion || '暂无' }}</p>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无关联工单" :image-size="72" />
        </section>

        <section class="task-detail-section">
          <div class="section-title">
            <h4>关联整改单</h4>
            <span>{{ taskRectifications(selectedTask).length }} 个</span>
          </div>
          <el-table
            v-if="taskRectifications(selectedTask).length"
            :data="taskRectifications(selectedTask)"
            row-key="id"
            size="small"
          >
            <el-table-column prop="rectificationCode" label="整改单号" min-width="150" />
            <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
            <el-table-column prop="assigneeName" label="负责人" width="120" />
            <el-table-column prop="deadline" label="整改期限" width="170" />
            <el-table-column prop="reviewResult" label="审核结果" width="120" />
            <el-table-column prop="status" label="状态" width="110" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openRectificationDetail(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无关联整改单" :image-size="72" />
        </section>
      </div>
    </el-drawer>

    <el-drawer
      v-model="workOrderDetailVisible"
      title="工单详情"
      size="560px"
      destroy-on-close
      append-to-body
    >
      <div v-if="selectedWorkOrder" class="work-order-detail">
        <div class="detail-title-row">
          <div>
            <strong>{{ workOrderDisplayTitle(selectedWorkOrder) }}</strong>
            <span>{{ workOrderDisplayCode(selectedWorkOrder) }}</span>
          </div>
          <el-tag size="small" effect="light" round>
            {{ workOrderStatusLabel(selectedWorkOrder) }}
          </el-tag>
        </div>

        <div class="detail-grid">
          <div
            v-for="item in workOrderDetailRows(selectedWorkOrder)"
            :key="item.label"
            class="detail-item"
          >
            <label>{{ item.label }}</label>
            <span>{{ item.value }}</span>
          </div>
        </div>

        <div class="section-title">
          <h4>工单日志</h4>
          <span>{{ selectedWorkOrderLogRows.length }} 条</span>
        </div>
        <el-empty
          v-if="selectedWorkOrderLogRows.length === 0"
          description="暂无工单日志"
          :image-size="72"
        />
        <template v-else>
          <el-timeline class="work-order-timeline">
            <el-timeline-item
              v-for="log in selectedWorkOrderLogRows"
              :key="log.id"
              :timestamp="log.occurredAt || undefined"
              placement="top"
            >
              <div class="work-order-log-item">
            <div class="log-meta">
              <strong>{{ log.action }}</strong>
              <span>{{ log.operator }}</span>
            </div>
            <p>{{ log.content }}</p>
            <div v-if="log.isWorkLog" class="log-extra">
              <span v-if="log.recordDate">日志时间：{{ log.recordDate }}</span>
              <span v-if="log.duration">处理时长：{{ log.duration }}</span>
            </div>
            <div v-if="log.attachments.length" class="log-attachments">
              <span>附件：</span>
              <el-link
                v-for="attachment in log.attachments"
                :key="attachment.id"
                :href="attachment.url || undefined"
                :underline="false"
                :disabled="!attachment.url"
                target="_blank"
                type="primary"
              >
                {{ attachment.name }}
              </el-link>
            </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </template>
      </div>
    </el-drawer>

    <el-drawer
      v-model="rectificationDetailVisible"
      title="归档整改单详情"
      size="860px"
      destroy-on-close
      append-to-body
    >
      <div v-if="selectedRectification" class="task-detail rectification-archive-detail">
        <div class="task-detail-header">
          <div>
            <h3>{{ selectedRectification.title || selectedRectification.taskName || '整改单详情' }}</h3>
            <p>{{ selectedRectification.description || '暂无整改描述' }}</p>
          </div>
          <div class="drawer-header-tags">
            <el-tag type="info" size="small" effect="light">归档快照只读</el-tag>
            <el-tag size="small" effect="dark" round>
              {{ rectificationStatusLabel(selectedRectification.status) }}
            </el-tag>
          </div>
        </div>

        <section class="task-detail-section">
          <div class="section-title">
            <h4>基本信息</h4>
            <span>{{ selectedRectification.rectificationCode || selectedRectification.id }}</span>
          </div>
          <div class="summary-content archive-rectification-summary">
            <div class="summary-row">
              <label>任务名称</label>
              <p>{{ selectedRectification.taskName || selectedRectification.title || '暂无' }}</p>
            </div>
            <div class="summary-row">
              <label>整改描述</label>
              <p>{{ selectedRectification.description || '暂无' }}</p>
            </div>
            <div class="summary-row">
              <label>所属检查项</label>
              <p>{{ selectedRectification.checkContent || selectedRectification.taskDescription || '暂无' }}</p>
            </div>
          </div>
          <div class="detail-grid">
            <div v-for="item in rectificationDetailRows(selectedRectification)" :key="item.label" class="detail-item">
              <label>{{ item.label }}</label>
              <span>{{ item.value }}</span>
            </div>
          </div>
        </section>

        <section class="task-detail-section">
          <div class="section-title">
            <h4>来源 OMS 工单</h4>
          </div>
          <div class="detail-grid">
            <div v-for="item in rectificationSourceRows(selectedRectification)" :key="item.label" class="detail-item">
              <label>{{ item.label }}</label>
              <span>{{ item.value }}</span>
            </div>
          </div>
        </section>

        <section class="task-detail-section">
          <div class="section-title">
            <h4>整改 OMS 工单</h4>
            <span>{{ rectificationOmsStatusLabel(selectedRectification) }}</span>
          </div>
          <el-empty
            v-if="!selectedRectification.rectificationOmsWorkOrderId"
            description="归档时未创建整改 OMS 工单"
            :image-size="72"
          />
          <template v-else>
            <div class="work-order-card">
              <div class="work-order-card-toolbar">
                <div>
                  <strong>整改处理工单</strong>
                  <span>{{ selectedRectification.rectificationOmsWorkOrderId }}</span>
                </div>
                <el-tag size="small" effect="light" round>
                  {{ rectificationOmsStatusLabel(selectedRectification) }}
                </el-tag>
              </div>
              <div class="work-order-card-summary">
                <div v-for="item in rectificationOmsSummaryRows(selectedRectification)" :key="item.label">
                  <label>{{ item.label }}</label>
                  <span>{{ item.value }}</span>
                </div>
              </div>
            </div>

            <el-tabs class="oms-tabs">
              <el-tab-pane label="详情" name="detail">
                <div v-if="rectificationOmsDetailRows(selectedRectification).length" class="payload-grid">
                  <div
                    v-for="item in rectificationOmsDetailRows(selectedRectification)"
                    :key="item.label"
                    class="payload-item"
                  >
                    <label>{{ item.label }}</label>
                    <span>{{ item.value }}</span>
                  </div>
                </div>
                <el-empty v-else description="暂无整改 OMS 详情" :image-size="72" />
              </el-tab-pane>
              <el-tab-pane label="日志" name="logs">
                <el-empty
                  v-if="rectificationOmsLogRows(selectedRectification).length === 0"
                  description="暂无整改 OMS 日志"
                  :image-size="72"
                />
                <div v-else class="work-order-log-list">
                  <div
                    v-for="log in rectificationOmsLogRows(selectedRectification)"
                    :key="log.id"
                    class="work-order-log-item"
                  >
                    <div class="log-meta">
                      <strong>{{ log.action }}</strong>
                      <span>{{ log.occurredAt || '暂无' }}</span>
                    </div>
                    <p>{{ log.content }}</p>
                    <div v-if="log.isWorkLog" class="log-extra">
                      <span v-if="log.recordDate">日志时间：{{ log.recordDate }}</span>
                      <span v-if="log.duration">处理时长：{{ log.duration }}</span>
                    </div>
                    <div v-if="log.attachments.length" class="log-attachments">
                      <span>附件：</span>
                      <el-link
                        v-for="attachment in log.attachments"
                        :key="attachment.id"
                        :href="attachment.url || undefined"
                        :underline="false"
                        :disabled="!attachment.url"
                        target="_blank"
                        type="primary"
                      >
                        {{ attachment.name }}
                      </el-link>
                    </div>
                    <div class="log-footer">
                      <span>{{ log.operator }}</span>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="附件" name="attachments">
                <el-empty
                  v-if="rectificationOmsAttachmentRows(selectedRectification).length === 0"
                  description="暂无整改 OMS 附件"
                  :image-size="72"
                />
                <div v-else class="attachment-list">
                  <el-link
                    v-for="attachment in rectificationOmsAttachmentRows(selectedRectification)"
                    :key="attachment.id"
                    :href="attachment.url || undefined"
                    :underline="false"
                    :disabled="!attachment.url"
                    target="_blank"
                    type="primary"
                  >
                    {{ attachment.name }}
                  </el-link>
                </div>
              </el-tab-pane>
            </el-tabs>
          </template>
        </section>

        <section class="task-detail-section">
          <div class="section-title">
            <h4>整改流程</h4>
          </div>
          <div class="flow-list archive-flow-list">
            <div v-for="item in rectificationFlowRows(selectedRectification)" :key="item.label" class="flow-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </section>
      </div>
    </el-drawer>

    <el-empty v-if="!archive && !loading" description="未找到该项目档案" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back, Download } from '@element-plus/icons-vue'
import { archiveApi } from '@/api'
import {
  projectSourceLabel,
  projectStatusLabel,
  projectStatusType,
  taskStatusLabel,
  taskStatusType,
} from '@/features/projects/project-data'
import type { Archive, ArchiveDocument, Attachment, TeamMember } from '@/types'

type ArchiveSnapshotProject = {
  id?: string
  projectCode?: string
  projectName?: string
  source?: string
  planId?: string
  planName?: string
  description?: string
  startDate?: string
  endDate?: string
  status?: string
  tagIds?: string[]
  tagNames?: string[]
  leaderId?: string
  leaderName?: string
  checklistIds?: string[]
  archiveStatus?: string
}

type ArchiveSnapshotTask = Record<string, string | undefined> & {
  id?: string
  status?: string
}

type ArchiveSnapshotWorkOrder = Record<string, string | undefined> & {
  id?: string
  taskId?: string
  omsWorkOrderId?: string
  workOrderTitle?: string
  workOrderDescription?: string
  omsStatus?: string
  omsStatusName?: string
  omsLogPayload?: string
}

type ArchiveSnapshotRectification = Record<string, string | undefined> & {
  id?: string
  taskId?: string
  sourceWorkOrderRecordId?: string
  rectificationCode?: string
  title?: string
  description?: string
  rectificationOmsWorkOrderId?: string
  rectificationOmsStatus?: string
  rectificationOmsStatusName?: string
  rectificationOmsDetailPayload?: string
  rectificationOmsLogPayload?: string
  rectificationOmsAttachmentPayload?: string
  status?: string
}

type ProjectArchiveSnapshot = {
  snapshotVersion?: string
  archivedAt?: string
  archivedBy?: string
  archivedByName?: string
  project?: ArchiveSnapshotProject
  members?: TeamMember[]
  tasks?: ArchiveSnapshotTask[]
  workOrders?: ArchiveSnapshotWorkOrder[]
  rectifications?: ArchiveSnapshotRectification[]
}

type ArchiveAttachment = Partial<Attachment> & Record<string, unknown>
type ArchiveDownloadItem = {
  name: string
  url: string
}
type WorkOrderLogAttachment = {
  id: string
  name: string
  url: string
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const archive = ref<Archive>()
const activeTab = ref('overview')
const taskDetailVisible = ref(false)
const selectedTask = ref<ArchiveSnapshotTask>()
const workOrderDetailVisible = ref(false)
const selectedWorkOrder = ref<ArchiveSnapshotWorkOrder>()
const rectificationDetailVisible = ref(false)
const selectedRectification = ref<ArchiveSnapshotRectification>()
const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

onMounted(() => {
  loadArchive()
})

const loadArchive = async () => {
  loading.value = true
  try {
    archive.value = await archiveApi.detail(route.params.id as string)
  } finally {
    loading.value = false
  }
}

const archiveSnapshot = computed<ProjectArchiveSnapshot>(() => {
  if (!archive.value?.snapshotJson) return {}
  try {
    return JSON.parse(archive.value.snapshotJson) as ProjectArchiveSnapshot
  } catch {
    return {}
  }
})

const snapshotProject = computed(() => archiveSnapshot.value.project || {})
const snapshotMembers = computed(() => archiveSnapshot.value.members || [])
const snapshotTasks = computed(() => archiveSnapshot.value.tasks || [])
const snapshotWorkOrders = computed(() => archiveSnapshot.value.workOrders || [])
const snapshotRectifications = computed(() => archiveSnapshot.value.rectifications || [])
const archiveProgress = computed(() => {
  const tasks = snapshotTasks.value
  if (tasks.length === 0) return 0
  const done = tasks.filter((task) =>
    ['passed', 'nonconforming', 'approved'].includes(task.status || ''),
  ).length
  return Math.round((done / tasks.length) * 100)
})
const archiveProjectTimeText = computed(() => {
  const project = snapshotProject.value
  if (!project.startDate) return ''
  return project.endDate ? `${project.startDate} ~ ${project.endDate}` : project.startDate
})
const leaderName = computed(() => {
  const leader = snapshotMembers.value.find((member) => member.role === 'leader')
  return leader?.personnelName || '暂无'
})
const summaryItems = computed(() => [
  { label: '检查项', value: snapshotTasks.value.length },
  { label: 'OMS 工单', value: snapshotWorkOrders.value.length },
  { label: '整改单', value: snapshotRectifications.value.length },
  { label: '附件', value: archive.value?.documentCount || archive.value?.documents?.length || 0 },
])

const listText = (values?: string[]) => {
  if (!values?.length) return '暂无'
  return values.join('、')
}

const openTaskDetail = (task: ArchiveSnapshotTask) => {
  selectedTask.value = task
  taskDetailVisible.value = true
}

const openWorkOrderDetail = (order: ArchiveSnapshotWorkOrder) => {
  selectedWorkOrder.value = order
  workOrderDetailVisible.value = true
}

const openRectificationDetail = (rectification: ArchiveSnapshotRectification) => {
  selectedRectification.value = rectification
  rectificationDetailVisible.value = true
}

const taskWorkOrders = (task: ArchiveSnapshotTask) => {
  const taskId = normalizeId(task.id)
  if (!taskId) return []
  return snapshotWorkOrders.value.filter((order) => normalizeId(order.taskId) === taskId)
}

const taskRectifications = (task: ArchiveSnapshotTask) => {
  const taskId = normalizeId(task.id)
  if (!taskId) return []
  return snapshotRectifications.value.filter((rectification) => normalizeId(rectification.taskId) === taskId)
}

const workOrderDisplayTitle = (order: ArchiveSnapshotWorkOrder) =>
  order.workOrderTitle || order.taskName || workOrderDisplayCode(order)

const workOrderDisplayCode = (order: ArchiveSnapshotWorkOrder) =>
  order.omsWorkOrderId || order.externalWorkOrderId || order.id || '暂无工单号'

const workOrderStatusLabel = (order: ArchiveSnapshotWorkOrder) =>
  order.omsStatusName || omsStatusName(order.omsStatus) || '暂无'

const selectedWorkOrderLogRows = computed(() =>
  selectedWorkOrder.value ? workOrderLogRows(selectedWorkOrder.value) : [],
)

const workOrderDetailRows = (order: ArchiveSnapshotWorkOrder) => [
  { label: '工单标题', value: workOrderDisplayTitle(order) },
  { label: '工单编号', value: workOrderDisplayCode(order) },
  { label: '处理人', value: order.handlerName || '暂无' },
  { label: 'OMS 状态', value: workOrderStatusLabel(order) },
  { label: 'IRIS 审核', value: order.irisReviewStatus || '暂无' },
  { label: '发起时间', value: order.issuedAt || '暂无' },
  { label: '完成时间', value: order.completedAt || '暂无' },
  { label: '同步状态', value: order.syncStatus || '暂无' },
  { label: '工单说明', value: order.workOrderDescription || '暂无' },
  { label: 'OMS 结果', value: order.omsResultSummary || '暂无' },
  { label: '审核意见', value: order.irisReviewOpinion || '暂无' },
  { label: '风险承担', value: order.riskAcceptanceReason || '暂无' },
]

const rectificationDetailRows = (rectification: ArchiveSnapshotRectification) => [
  { label: '整改单号', value: rectification.rectificationCode || rectification.id || '暂无' },
  { label: '负责人', value: rectification.assigneeName || '暂无' },
  { label: '对接人', value: rectification.contactName || '暂无' },
  { label: '下发时间', value: rectification.issuedAt || '暂无' },
  { label: '整改期限', value: rectification.deadline || '暂无' },
  { label: '完成时间', value: rectification.completedAt || '暂无' },
  { label: '审核结果', value: rectificationReviewResultLabel(rectification.reviewResult) },
  { label: '状态', value: rectificationStatusLabel(rectification.status) },
]

const rectificationSourceRows = (rectification: ArchiveSnapshotRectification) => [
  { label: '来源检查项', value: rectification.checkContent || rectification.taskDescription || '暂无' },
  { label: '来源任务', value: rectification.taskName || '暂无' },
  { label: '来源 OMS 工单', value: rectification.omsWorkOrderId || rectification.sourceOmsWorkOrderId || '暂无' },
  { label: '来源工单记录', value: rectification.sourceWorkOrderRecordId || '暂无' },
]

const rectificationOmsStatusLabel = (rectification: ArchiveSnapshotRectification) =>
  rectification.rectificationOmsStatusName ||
  omsStatusName(rectification.rectificationOmsStatus) ||
  '暂无'

const rectificationOmsSummaryRows = (rectification: ArchiveSnapshotRectification) => [
  { label: '整改 OMS 工单号', value: rectification.rectificationOmsWorkOrderId || '暂无' },
  { label: 'OMS 状态', value: rectificationOmsStatusLabel(rectification) },
  { label: '创建时间', value: rectification.rectificationWorkOrderCreatedAt || '暂无' },
  { label: '完成时间', value: rectification.rectificationWorkOrderCompletedAt || '暂无' },
]

const rectificationOmsDetailRows = (rectification: ArchiveSnapshotRectification) =>
  payloadRows(rectification.rectificationOmsDetailPayload)

const rectificationOmsLogRows = (rectification: ArchiveSnapshotRectification) =>
  workOrderLogRows({
    id: rectification.id,
    omsWorkOrderId: rectification.rectificationOmsWorkOrderId,
    omsLogPayload: rectification.rectificationOmsLogPayload,
  })

const rectificationOmsAttachmentRows = (rectification: ArchiveSnapshotRectification) =>
  parseWorkOrderLogAttachments(rectification.rectificationOmsAttachmentPayload || '')

const rectificationFlowRows = (rectification: ArchiveSnapshotRectification) => [
  { label: '整改单生成', value: rectification.issuedAt || '暂无' },
  { label: '整改 OMS 创建', value: rectification.rectificationWorkOrderCreatedAt || '暂无' },
  { label: '整改完成', value: rectification.completedAt || rectification.rectificationWorkOrderCompletedAt || '暂无' },
  { label: '内控审核', value: rectificationReviewResultLabel(rectification.reviewResult) },
  { label: '备注', value: rectification.remark || '暂无' },
]

const rectificationStatusLabel = (status?: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    in_progress: '处理中',
    approved: '已完成',
  }
  return map[status || ''] || status || '暂无'
}

const rectificationReviewResultLabel = (result?: string) => {
  const map: Record<string, string> = {
    approve: '通过',
    reject: '不通过',
  }
  return map[result || ''] || result || '暂无'
}

const payloadRows = (payload?: string) => {
  const parsed = parseJsonValue(payload)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
  return Object.entries(parsed as Record<string, unknown>)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([label, value], index) => ({
      label: payloadFieldLabel(label, index),
      value: payloadFieldValue(value),
    }))
}

const payloadFieldLabel = (label: string, index: number) => {
  const map: Record<string, string> = {
    expectedCompletedTime: '期望完成时间',
    startedTime: '开始时间',
    ownerCode: '工单负责人',
    checkOwnerCode: '申请人/需求来源人',
  }
  return map[label] || label || `字段${index + 1}`
}

const payloadFieldValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(payloadFieldValue).filter(Boolean).join('、') || '暂无'
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return firstText(record.name, record.userName, record.label, record.value, JSON.stringify(record))
  }
  return String(value || '暂无')
}

const omsStatusName = (status?: string) => {
  const map: Record<string, string> = {
    '0': '待分配',
    '5': '待领取',
    '10': '处理中',
    '13': '转办中',
    '15': '挂起中',
    '20': '已完成',
    '25': '已关闭',
    '30': '已归档',
    '40': '已退回',
  }
  return map[status || ''] || status || ''
}

const workOrderLogRows = (order: ArchiveSnapshotWorkOrder) => {
  const parsedLogs = parseJsonArray(order.omsLogPayload)
  return parsedLogs.map((log, index) => {
    const row = log as Record<string, unknown>
    const rawAction = String(row.action || row.actionName || row.RECORD_GDCZ || '日志')
    const attachmentsPayload = row.attachmentsPayload || row.RECORD_FJ || ''
    return {
      id: String(row.id || row.logId || `${order.id || order.omsWorkOrderId}-${index}`),
      occurredAt: normalizeDateTimeText(
        String(row.occurredAt || row.SY_CREATETIME || row.time || row.createdAt || ''),
      ),
      operator: String(row.operator || row.SY_CREATEUSERNAME || row.operatorName || row.userName || 'OMS'),
      action: workOrderLogActionLabel(rawAction),
      content: String(row.content || row.RECORD_CZXQ || row.message || row.description || '暂无'),
      isWorkLog: isWorkLogAction(rawAction),
      recordDate: normalizeDateText(String(row.recordDate || row.RECORD_RQ || '')),
      duration: formatDurationText(String(row.duration || row.RECORD_GS || '')),
      attachments: parseWorkOrderLogAttachments(attachmentsPayload),
    }
  })
}

const parseJsonArray = (payload?: string): unknown[] => {
  const parsed = parseJsonValue(payload)
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { logs?: unknown[] }).logs)) {
    return (parsed as { logs: unknown[] }).logs
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { data?: unknown[] }).data)) {
    return (parsed as { data: unknown[] }).data
  }
  return []
}

const parseWorkOrderLogAttachments = (payload: unknown): WorkOrderLogAttachment[] => {
  const parsed = parseJsonValue(payload)
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { data?: unknown[] }).data)
      ? (parsed as { data: unknown[] }).data
      : []

  return rows
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => {
      const name = firstText(
        item.originalFileName,
        item.allFireName,
        item.fileName,
        item.name,
        `附件${index + 1}`,
      )
      return {
        id: firstText(item.id, item.jeFileInfoId, item.fileName, `${name}-${index}`),
        name,
        url: firstText(item.minioUrl, item.url, item.fileUrl, item.downloadUrl),
      }
    })
}

const parseJsonValue = (payload: unknown): unknown => {
  if (!payload) return undefined
  if (typeof payload !== 'string') return payload
  const normalized = payload.trim()
  if (!normalized) return undefined
  try {
    return JSON.parse(normalized) as unknown
  } catch {
    return undefined
  }
}

const workOrderLogActionLabel = (action: string) => {
  const normalized = action.trim().toLowerCase()
  const map: Record<string, string> = {
    create: '创建工单',
    created: '创建工单',
    submit: '提交',
    complete: '完成工单',
    completed: '完成工单',
    close: '关闭工单',
    comment: '工作日志',
    log: '工作日志',
    back: '退回工单',
    return: '退回工单',
    returned: '退回工单',
  }
  return map[normalized] || action || '日志'
}

const isWorkLogAction = (action: string) => {
  const normalized = action.trim().toLowerCase()
  return normalized === '日志' || normalized === 'comment' || normalized === 'log'
}

const formatDurationText = (value: string) => {
  const normalized = value.trim()
  if (!normalized) return ''
  return /小时|分钟|h$/i.test(normalized) ? normalized : `${normalized} 小时`
}

const normalizeDateText = (value?: string | null) => {
  const normalized = String(value || '').replace('T', ' ')
  return normalized ? normalized.slice(0, 10) : ''
}

const normalizeDateTimeText = (value?: string | null) => {
  const normalized = String(value || '')
    .replace('T', ' ')
    .replace(/Z$/, '')
    .trim()
  return normalized ? normalized.split('.')[0] : ''
}

const normalizeId = (value?: string | number | null) => String(value || '').trim()

const archiveDocumentDownloadItems = (document: ArchiveDocument): ArchiveDownloadItem[] => {
  const attachments = (document.attachments || []) as ArchiveAttachment[]
  return attachments
    .map((attachment, index) => {
      const url = firstText(
        attachment.minioUrl,
        attachment.url,
        attachment.fileUrl,
        attachment.attachmentUrl,
        attachment.downloadUrl,
      )
      if (!url) return null
      return {
        url,
        name:
          firstText(
            attachment.originalFileName,
            attachment.name,
            attachment.fileName,
            document.name,
          ) || `附件${index + 1}`,
      }
    })
    .filter((item): item is ArchiveDownloadItem => Boolean(item))
}

const firstText = (...values: unknown[]) => {
  const matched = values.find((value) => typeof value === 'string' && value.trim())
  return typeof matched === 'string' ? matched.trim() : ''
}

const roleType = (role?: string) => {
  const map: Record<string, string> = {
    leader: 'danger',
    auditor: 'warning',
    observer: 'info',
    reviewer: 'info',
    member: 'info',
  }
  return (map[role || ''] || 'info') as 'danger' | 'warning' | 'info'
}

const roleLabel = (role?: string) => {
  const map: Record<string, string> = {
    leader: '项目负责人',
    auditor: '项目审计人员',
    observer: '观察员',
    reviewer: '观察员',
    member: '观察员',
  }
  return map[role || ''] || role || '暂无'
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.archive-header,
.detail-shell {
  padding: 24px;
  margin-bottom: 20px;
  background: var(--el-bg-color);
  border: 1px solid $iris-border-light;
  border-radius: 8px;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-btn {
  align-self: flex-start;
  padding: 0;
}

.project-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  color: $iris-text-primary;
}

.meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.code {
  padding: 2px 8px;
  font-family: monospace;
  color: $iris-text-secondary;
  background: #f1f5f9;
  border-radius: 4px;
}

.archive-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
}

.stat-item {
  label {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
    color: $iris-text-muted;
  }

  .value {
    font-size: 16px;
    font-weight: 600;
    color: $iris-text-primary;
  }
}

.progress-value {
  max-width: 220px;
}

.overview-layout {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  span {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
    color: $iris-text-muted;
  }

  strong {
    font-size: 24px;
    color: $iris-text-primary;
  }
}

.archive-tabs {
  width: 100%;
}

.strong-text {
  font-weight: 600;
  color: $iris-text-primary;
}

.task-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.task-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf2f7;

  h3 {
    margin: 0 0 8px;
    font-size: 20px;
    color: $iris-text-primary;
  }

  p {
    margin: 0;
    color: $iris-text-secondary;
    line-height: 1.6;
  }
}

.drawer-header-tags {
  display: inline-flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.task-detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-content {
  display: grid;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.summary-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: start;

  label {
    font-size: 13px;
    font-weight: 600;
    color: $iris-text-muted;
  }

  p {
    margin: 0;
    color: $iris-text-primary;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;

  h4 {
    margin: 0;
    font-size: 15px;
    color: $iris-text-primary;
  }

  span {
    font-size: 13px;
    color: $iris-text-muted;
  }
}

.section-title--nested {
  margin-top: 14px;
}

.work-order-record-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.work-order-card {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.work-order-card-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;

  strong,
  span {
    display: block;
  }

  strong {
    margin-bottom: 4px;
    color: $iris-text-primary;
  }

  span {
    font-size: 12px;
    color: $iris-text-muted;
  }
}

.work-order-card-actions {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
}

.work-order-card-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;

  > div {
    min-width: 0;
    padding: 10px 12px;
    background: #f8fafc;
    border: 1px solid #edf2f7;
    border-radius: 6px;
  }

  label,
  span {
    display: block;
  }

  label {
    margin-bottom: 4px;
    font-size: 12px;
    color: $iris-text-muted;
  }

  span {
    color: $iris-text-primary;
    word-break: break-word;
  }
}

.work-order-card-note {
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid #edf2f7;

  label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: $iris-text-muted;
  }

  p {
    margin: 0;
    color: $iris-text-secondary;
    line-height: 1.6;
  }
}

.work-order-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf2f7;

  strong,
  span {
    display: block;
  }

  strong {
    margin-bottom: 4px;
    color: $iris-text-primary;
  }

  span {
    font-size: 12px;
    color: $iris-text-muted;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  label,
  span {
    display: block;
  }

  label {
    margin-bottom: 4px;
    font-size: 12px;
    color: $iris-text-muted;
  }

  span {
    color: $iris-text-primary;
    line-height: 1.6;
    word-break: break-word;
  }
}

.payload-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.payload-item {
  min-width: 0;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  label,
  span {
    display: block;
  }

  label {
    margin-bottom: 4px;
    font-size: 12px;
    color: $iris-text-muted;
  }

  span {
    color: $iris-text-primary;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
}

.flow-list {
  display: grid;
  gap: 10px;
}

.flow-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  span {
    color: $iris-text-muted;
  }

  strong {
    color: $iris-text-primary;
    text-align: right;
    overflow-wrap: anywhere;
  }
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.team-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.team-name {
  margin-bottom: 4px;
  font-weight: 600;
  color: $iris-text-primary;
}

.team-meta {
  margin-bottom: 6px;
  font-size: 12px;
  color: $iris-text-muted;
}

.expand-content {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 12px 40px;

  label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: $iris-text-muted;
  }

  p {
    margin: 0;
    color: $iris-text-secondary;
    line-height: 1.6;
  }
}

.work-order-log-list,
.work-order-timeline {
  padding-top: 2px;
}

.work-order-timeline {
  padding-left: 2px;
}

.work-order-timeline :deep(.el-timeline-item__timestamp) {
  color: $iris-text-muted;
}

.work-order-log-item {
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  p {
    margin: 8px 0;
    color: $iris-text-secondary;
    line-height: 1.6;
  }
}

.log-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: $iris-text-muted;
}

.log-meta strong {
  font-size: 13px;
  color: $iris-text-primary;
}

.log-extra,
.log-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: $iris-text-secondary;
}

.log-attachments {
  align-items: center;
}

.archive-downloads {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;

  .el-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    line-height: 1;
  }
}

@media (max-width: 960px) {
  .header-top,
  .meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .archive-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .expand-content {
    grid-template-columns: 1fr;
    padding: 12px;
  }
}
</style>
