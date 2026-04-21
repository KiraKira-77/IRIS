<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">统计分析</h2>
        <p class="page-subtitle">汇总规则命中、整改推进和智能能力运行趋势</p>
      </div>
      <el-date-picker
        v-model="selectedYear"
        type="year"
        value-format="YYYY"
        placeholder="选择年份"
        style="width: 140px"
      />
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <span>规则总数</span>
        <strong>{{ ruleCount }}</strong>
      </div>
      <div class="kpi-card">
        <span>模型在线率</span>
        <strong>{{ modelOnlineRate }}%</strong>
      </div>
      <div class="kpi-card">
        <span>工具可用率</span>
        <strong>{{ toolAvailableRate }}%</strong>
      </div>
      <div class="kpi-card">
        <span>整改闭环率</span>
        <strong>{{ rectificationRate }}%</strong>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="iris-card chart-card">
          <div class="card-head">
            <h3>规则分类分布</h3>
            <span>{{ selectedYear }} 年</span>
          </div>
          <div ref="categoryChartRef" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="iris-card chart-card">
          <div class="card-head">
            <h3>整改完成率趋势</h3>
            <span>近 6 个月</span>
          </div>
          <div ref="trendChartRef" class="chart-box"></div>
        </div>
      </el-col>
    </el-row>

    <div class="iris-card chart-card" style="margin-top: 20px">
      <div class="card-head">
        <h3>智能能力运行看板</h3>
        <span>规则 / 模型 / 工具 综合指标</span>
      </div>
      <div ref="capabilityChartRef" class="chart-box chart-box-wide"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { mockModels, mockRules, mockTools } from '@/mock/advanced'
import { mockRectifications } from '@/mock'

const selectedYear = ref('2026')
const categoryChartRef = ref<HTMLDivElement>()
const trendChartRef = ref<HTMLDivElement>()
const capabilityChartRef = ref<HTMLDivElement>()
const charts: echarts.ECharts[] = []

const ruleCount = computed(() => mockRules.length)
const modelOnlineRate = computed(() =>
  Math.round((mockModels.filter((item) => item.status === 'online').length / mockModels.length) * 100),
)
const toolAvailableRate = computed(() =>
  Math.round(
    (mockTools.filter((item) => item.status === 'available').length / mockTools.length) * 100,
  ),
)
const rectificationRate = computed(() => {
  if (mockRectifications.length === 0) return 0
  return Math.round(
    (mockRectifications.filter((item) => item.status === 'approved').length /
      mockRectifications.length) *
      100,
  )
})

const categoryData = computed(() => {
  const categoryMap = new Map<string, number>()
  mockRules.forEach((rule) => {
    categoryMap.set(rule.category, (categoryMap.get(rule.category) || 0) + 1)
  })
  return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
})

const completionTrend = [
  { month: '11月', value: 72 },
  { month: '12月', value: 76 },
  { month: '01月', value: 78 },
  { month: '02月', value: 83 },
  { month: '03月', value: 87 },
  { month: '04月', value: 91 },
]

const capabilitySeries = computed(() => [
  {
    name: '规则执行成功率',
    type: 'bar',
    data: [
      Math.round(
        (mockRules
          .flatMap((rule) => rule.executionLogs)
          .filter((log) => log.status === 'success').length /
          mockRules.flatMap((rule) => rule.executionLogs).length) *
          100,
      ) || 0,
      modelOnlineRate.value,
      toolAvailableRate.value,
    ],
  },
  {
    name: '目标线',
    type: 'line',
    smooth: true,
    data: [90, 95, 95],
  },
])

const resizeCharts = () => {
  charts.forEach((chart) => chart.resize())
}

const mountChart = (element: HTMLDivElement | undefined) => {
  if (!element) return null
  const chart = echarts.init(element)
  charts.push(chart)
  return chart
}

const initCharts = () => {
  charts.splice(0).forEach((chart) => chart.dispose())

  const categoryChart = mountChart(categoryChartRef.value)
  const trendChart = mountChart(trendChartRef.value)
  const capabilityChart = mountChart(capabilityChartRef.value)

  categoryChart?.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '42%'],
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 3,
          borderRadius: 10,
        },
        label: { formatter: '{b}\n{d}%' },
        data: categoryData.value,
      },
    ],
  })

  trendChart?.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: completionTrend.map((item) => item.month),
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbolSize: 10,
        data: completionTrend.map((item) => item.value),
        itemStyle: { color: '#2563eb' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(37, 99, 235, 0.28)' },
            { offset: 1, color: 'rgba(37, 99, 235, 0.02)' },
          ]),
        },
      },
    ],
  })

  capabilityChart?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 40, right: 20, top: 50, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['规则引擎', '模型服务', '工具库'],
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
    },
    series: capabilitySeries.value.map((series, index) => ({
      ...series,
      itemStyle: { color: index === 0 ? '#10b981' : '#f59e0b' },
      lineStyle: { color: '#f59e0b' },
      barWidth: 42,
    })),
  })
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', resizeCharts)
})

watch(selectedYear, () => {
  initCharts()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  charts.splice(0).forEach((chart) => chart.dispose())
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .page-title {
    font-size: 26px;
    font-weight: 700;
    color: $iris-text-primary;
  }

  .page-subtitle {
    margin-top: 8px;
    color: $iris-text-secondary;
  }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  padding: 18px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff 0%, #dbeafe 100%);
  box-shadow: $iris-shadow-card;

  span {
    display: block;
    margin-bottom: 8px;
    color: $iris-text-secondary;
  }

  strong {
    font-size: 28px;
    color: $iris-text-primary;
  }
}

.chart-card {
  padding: 24px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    font-size: 18px;
    color: $iris-text-primary;
  }

  span {
    color: $iris-text-muted;
  }
}

.chart-box {
  height: 360px;
}

.chart-box-wide {
  height: 320px;
}
</style>
