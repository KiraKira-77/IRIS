<template>
  <div class="page-container iris-page dashboard-page">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="content">
        <h2 class="title">早安，管理员</h2>
        <p class="subtitle">今天是 2026年02月12日，星期四。系统运行正常，由您守护企业安全。</p>
        <div class="stats-row">
          <div class="stat-item">
            <span class="label">待处理事项</span>
            <span class="value">12</span>
          </div>
          <div class="stat-item">
            <span class="label">本月整改率</span>
            <span class="value">98%</span>
          </div>
          <div class="stat-item">
            <span class="label">风险指数</span>
            <span class="value safe">低</span>
          </div>
        </div>
      </div>
      <div class="decoration">
        <!-- 简单的 CSS 图形装饰 -->
        <div class="circle c1"></div>
        <div class="circle c2"></div>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="cards-row">
      <el-col :span="6" v-for="(card, index) in cards" :key="index">
        <div class="stat-card" :class="card.type">
          <div class="icon-wrapper">
            <component :is="card.icon" />
          </div>
          <div class="card-info">
            <div class="card-label">{{ card.title }}</div>
            <div class="card-value">
              {{ card.value }}
              <span class="trend" :class="card.trend > 0 ? 'up' : 'down'" v-if="card.trend">
                <el-icon><Top v-if="card.trend > 0" /><Bottom v-else /></el-icon>
                {{ Math.abs(card.trend) }}%
              </span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="main-content">
      <!-- 左侧：图表分析 -->
      <el-col :span="16">
        <div class="iris-card chart-panel">
          <div class="panel-header">
            <h3>缺陷趋势分析</h3>
            <div class="actions">
              <el-radio-group v-model="chartRange" size="small">
                <el-radio-button label="week">近一周</el-radio-button>
                <el-radio-button label="month">近一月</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="chart-container" ref="trendChartRef"></div>
        </div>

        <div class="iris-card task-panel">
          <div class="panel-header">
            <h3>待办任务</h3>
            <el-button link type="primary">查看全部</el-button>
          </div>
          <el-table :data="todoList" :show-header="false" size="large" class="todo-table">
            <el-table-column width="40">
              <template #default>
                <div class="status-dot"></div>
              </template>
            </el-table-column>
            <el-table-column prop="title" min-width="300" />
            <el-table-column prop="date" width="120" align="right" />
            <el-table-column width="100" align="right">
              <template #default>
                <el-button size="small" round>办理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <!-- 右侧：概览与动态 -->
      <el-col :span="8">
        <div class="iris-card distribution-panel">
          <div class="panel-header"><h3>缺陷分布</h3></div>
          <div class="chart-container" ref="pieChartRef" style="height: 250px"></div>
        </div>

        <div class="iris-card activity-panel">
          <div class="panel-header"><h3>最近动态</h3></div>
          <div class="activity-list">
            <div class="activity-item" v-for="(item, i) in activities" :key="i">
              <div class="avatar">{{ item.user.charAt(0) }}</div>
              <div class="info">
                <p class="text">
                  <span class="name">{{ item.user }}</span> {{ item.action }}
                </p>
                <p class="time">{{ item.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import {
  Monitor,
  Document,
  WarnTriangleFilled,
  Finished,
  Top,
  Bottom,
} from '@element-plus/icons-vue'

const chartRange = ref('week')
const trendChartRef = ref()
const pieChartRef = ref()

const cards = [
  { title: '待整改缺陷', value: '24', icon: WarnTriangleFilled, type: 'danger', trend: -5 },
  { title: '进行中项目', value: '8', icon: Monitor, type: 'primary', trend: 12 },
  { title: '本月已归档', value: '156', icon: Document, type: 'info', trend: 8 },
  { title: '整改完成率', value: '92%', icon: Finished, type: 'success', trend: 2 },
]

const todoList = [
  { title: '审批：2026年度信息系统审计计划', date: '今天 10:00' },
  { title: '复核：核心系统账号权限整改报告', date: '今天 14:30' },
  { title: '确认：机房物理安全检查缺陷清单', date: '昨天 16:00' },
  { title: '分配：关于数据备份异常的调查任务', date: '2月10日' },
]

const activities = [
  { user: '张三', action: '提交了整改报告 [REC-2026001]', time: '10分钟前' },
  { user: '李四', action: '完成了项目 [PROJ-002] 的任务分配', time: '1小时前' },
  { user: 'Wang', action: '发布了新通知：关于加强密码强度的规定', time: '2小时前' },
  { user: 'Admin', action: '更新了系统规则库 V2.1', time: '昨天' },
]

onMounted(() => {
  initCharts()
})

const initCharts = () => {
  if (trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value)
    chart.setOption({
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
      },
      series: [
        {
          data: [12, 18, 14, 25, 16, 22, 19],
          type: 'line',
          smooth: true,
          symbolSize: 8,
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ]),
          },
        },
        {
          data: [5, 8, 4, 12, 6, 9, 7],
          type: 'line',
          smooth: true,
          symbolSize: 8,
          itemStyle: { color: '#f59e0b' },
        },
      ],
    })
  }

  if (pieChartRef.value) {
    const chart = echarts.init(pieChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, icon: 'circle', itemGap: 20 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          data: [
            { value: 48, name: '权限管理', itemStyle: { color: '#3b82f6' } },
            { value: 24, name: '数据安全', itemStyle: { color: '#10b981' } },
            { value: 18, name: '系统运维', itemStyle: { color: '#f59e0b' } },
            { value: 10, name: '其他', itemStyle: { color: '#94a3b8' } },
          ],
        },
      ],
    })
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.dashboard-page {
  padding-bottom: 40px;
}

// 欢迎横幅
.welcome-banner {
  margin-bottom: 24px;
  background: $iris-gradient-primary;
  border-radius: 16px;
  padding: 32px 40px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: $iris-shadow-lg;

  .content {
    position: relative;
    z-index: 2;
    .title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 24px;
    }
    .stats-row {
      display: flex;
      gap: 40px;
      .stat-item {
        display: flex;
        flex-direction: column;
        .label {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 4px;
        }
        .value {
          font-size: 24px;
          font-weight: 600;
        }
        .value.safe {
          color: #86efac;
        }
      }
    }
  }

  .decoration {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    .circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
    }
    .c1 {
      width: 300px;
      height: 300px;
      top: -100px;
      right: -50px;
    }
    .c2 {
      width: 200px;
      height: 200px;
      bottom: -50px;
      right: 180px;
    }
  }
}

// 统计卡片
.cards-row {
  margin-bottom: 24px;
  .stat-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: $iris-shadow-card;
    transition: all 0.3s ease;
    border: 1px solid transparent;

    &:hover {
      transform: translateY(-4px);
      box-shadow: $iris-shadow-card-hover;
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .card-info {
      .card-label {
        font-size: 14px;
        color: $iris-text-secondary;
        margin-bottom: 4px;
      }
      .card-value {
        font-size: 26px;
        font-weight: 700;
        color: $iris-text-primary;
        display: flex;
        align-items: flex-end;
        gap: 8px;
        .trend {
          font-size: 13px;
          font-weight: 600;
          padding-bottom: 4px;
          display: flex;
          align-items: center;
          &.up {
            color: $iris-success;
          }
          &.down {
            color: $iris-danger;
          }
        }
      }
    }

    // Variants
    &.primary {
      .icon-wrapper {
        background: rgba(59, 130, 246, 0.1);
        color: $iris-primary;
      }
    }
    &.success {
      .icon-wrapper {
        background: rgba(16, 185, 129, 0.1);
        color: $iris-success;
      }
    }
    &.danger {
      .icon-wrapper {
        background: rgba(239, 68, 68, 0.1);
        color: $iris-danger;
      }
    }
    &.info {
      .icon-wrapper {
        background: #f1f5f9;
        color: $iris-text-secondary;
      }
    }
  }
}

.chart-panel,
.task-panel,
.distribution-panel,
.activity-panel {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: $iris-shadow-card;
  margin-bottom: 24px;
  border: none; // Removal typical border
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $iris-text-primary;
  }
}

.chart-container {
  height: 320px;
  width: 100%;
}

.todo-table {
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $iris-primary;
  }
  ::v-deep(.el-table__cell) {
    border-bottom: 1px solid #f1f5f9;
  }
}

.activity-list {
  .activity-item {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    &:last-child {
      margin-bottom: 0;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #eff6ff;
      color: $iris-primary;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .info {
      .text {
        font-size: 14px;
        color: $iris-text-secondary;
        margin-bottom: 4px;
        .name {
          color: $iris-text-primary;
          font-weight: 500;
        }
      }
      .time {
        font-size: 12px;
        color: $iris-text-muted;
      }
    }
  }
}
</style>
