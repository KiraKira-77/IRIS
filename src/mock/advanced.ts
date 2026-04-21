import type { AIModel, Rule, Tool } from '@/types'

export interface RoleProfile {
  id: string
  name: string
  scope: 'platform' | 'business' | 'audit'
  description: string
  status: 'active' | 'inactive'
  memberIds: string[]
  permissionGroups: string[]
  updatedAt: string
}

export const mockRules: Rule[] = [
  {
    id: 'rule-001',
    name: '高危权限超配识别',
    description: '识别核心业务系统中同时具备配置、审批、执行权限的高风险账号',
    category: '权限治理',
    expression: 'role in ["超级管理员","系统管理员"] && permission_count > 20',
    triggerType: 'scheduled',
    schedule: '每日 02:00',
    status: 'active',
    lastRunAt: '2026-04-10 02:00',
    executionLogs: [
      {
        id: 'rule-log-001',
        ruleId: 'rule-001',
        status: 'success',
        result: '扫描 1243 个账号，命中 3 个高风险账号',
        executedAt: '2026-04-10 02:00',
        duration: 18,
      },
      {
        id: 'rule-log-002',
        ruleId: 'rule-001',
        status: 'success',
        result: '扫描 1241 个账号，命中 2 个高风险账号',
        executedAt: '2026-04-09 02:00',
        duration: 17,
      },
    ],
    createdAt: '2026-03-01',
    updatedAt: '2026-04-09',
  },
  {
    id: 'rule-002',
    name: '整改超期预警',
    description: '针对即将到期和已逾期的整改单自动生成告警事件',
    category: '整改跟踪',
    expression: 'deadline <= now()+3d && status in ["pending","in_progress","submitted"]',
    triggerType: 'scheduled',
    schedule: '每小时',
    status: 'active',
    lastRunAt: '2026-04-10 09:00',
    executionLogs: [
      {
        id: 'rule-log-003',
        ruleId: 'rule-002',
        status: 'success',
        result: '生成 5 条即将到期提醒，1 条逾期提醒',
        executedAt: '2026-04-10 09:00',
        duration: 6,
      },
    ],
    createdAt: '2026-03-12',
    updatedAt: '2026-04-08',
  },
  {
    id: 'rule-003',
    name: '关键配置变更复核缺失',
    description: '发现关键系统变更单缺少双人复核记录时触发告警',
    category: '变更管理',
    expression: 'change_level == "critical" && reviewer == null',
    triggerType: 'event',
    status: 'disabled',
    lastRunAt: '2026-04-06 16:30',
    executionLogs: [
      {
        id: 'rule-log-004',
        ruleId: 'rule-003',
        status: 'failure',
        result: '外部变更接口返回超时，未完成本次校验',
        executedAt: '2026-04-06 16:30',
        duration: 31,
      },
    ],
    createdAt: '2026-02-20',
    updatedAt: '2026-04-06',
  },
]

export const mockModels: AIModel[] = [
  {
    id: 'model-001',
    name: '整改建议生成模型',
    type: 'llm',
    provider: 'OpenAI Compatible Gateway',
    endpoint: 'https://ai.iris.local/llm/rectification-advisor',
    description: '根据缺陷描述、控制标准和历史整改方案生成整改建议',
    status: 'online',
    config: {
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      maxTokens: 3000,
      businessDomain: 'rectification',
    },
  },
  {
    id: 'model-002',
    name: '日志异常聚类模型',
    type: 'ml',
    provider: 'RiskLab',
    endpoint: 'https://ml.iris.local/anomaly/log-cluster',
    description: '对系统日志进行异常聚类和相似问题归并',
    status: 'online',
    config: {
      algorithm: 'IsolationForest',
      refreshCycle: 'daily',
      featureCount: 42,
    },
  },
  {
    id: 'model-003',
    name: '制度条款匹配模型',
    type: 'llm',
    provider: 'OpenAI Compatible Gateway',
    endpoint: 'https://ai.iris.local/llm/standard-matcher',
    description: '将项目发现和整改描述自动匹配到制度条款与控制要求',
    status: 'offline',
    config: {
      model: 'gpt-4.1',
      temperature: 0,
      embeddingIndex: 'std-knowledge-v2',
    },
  },
]

export const mockTools: Tool[] = [
  {
    id: 'tool-001',
    name: '整改报告草拟器',
    type: 'reporting',
    description: '汇总整改措施、证据附件和审核意见，生成整改报告草稿',
    endpoint: '/smart/tools/report-draft',
    status: 'available',
    config: {
      avgDuration: '18s',
      monthlyCalls: 86,
      owner: '审计部',
    },
  },
  {
    id: 'tool-002',
    name: '权限矩阵比对',
    type: 'analysis',
    description: '比对岗位职责、账号权限和系统角色配置，识别超配账号',
    endpoint: '/smart/tools/permission-diff',
    status: 'available',
    config: {
      avgDuration: '42s',
      monthlyCalls: 29,
      owner: '信息安全组',
    },
  },
  {
    id: 'tool-003',
    name: '制度引用检查',
    type: 'compliance',
    description: '检查项目任务、整改单和报告是否引用了正确的制度版本',
    endpoint: '/smart/tools/policy-check',
    status: 'unavailable',
    config: {
      avgDuration: '11s',
      monthlyCalls: 11,
      owner: '内控合规部',
    },
  },
]

export const mockRoles: RoleProfile[] = [
  {
    id: 'role-001',
    name: '平台管理员',
    scope: 'platform',
    description: '负责平台配置、用户权限、规则发布与系统运营参数维护',
    status: 'active',
    memberIds: ['u-001'],
    permissionGroups: ['用户管理', '角色权限', '规则发布', '模型配置', '日志审计'],
    updatedAt: '2026-04-08',
  },
  {
    id: 'role-002',
    name: '审计经理',
    scope: 'audit',
    description: '负责计划审批、项目统筹、整改复核与项目收尾确认',
    status: 'active',
    memberIds: ['p-002', 'p-008'],
    permissionGroups: ['计划审批', '项目统筹', '整改复核', '档案封存'],
    updatedAt: '2026-04-07',
  },
  {
    id: 'role-003',
    name: '检查执行人',
    scope: 'business',
    description: '负责项目任务办理、材料上传、问题记录与整改跟踪',
    status: 'active',
    memberIds: ['p-001', 'p-003', 'p-005', 'p-006'],
    permissionGroups: ['任务办理', '材料上传', '整改提交'],
    updatedAt: '2026-04-05',
  },
  {
    id: 'role-004',
    name: '整改责任人',
    scope: 'business',
    description: '接收整改单、反馈整改措施、提交整改附件并跟踪关闭',
    status: 'inactive',
    memberIds: ['p-004', 'p-007'],
    permissionGroups: ['整改受理', '整改反馈', '证据上传'],
    updatedAt: '2026-03-29',
  },
]
