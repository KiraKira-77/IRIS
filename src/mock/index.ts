import type {
  UserInfo,
  Standard,
  ControlChecklist,
  ChecklistItem,
  Archive,
  ArchiveDocument,
  Personnel,
  ControlPlan,
  Project,
  CheckTask,
  RectificationOrder,
  DashboardStats,
  AlertEvent,
  LogEntry,
} from '@/types'

// ===========================
// 用户 & 权限 Mock
// ===========================
export const mockUser: UserInfo = {
  id: 'u-001',
  username: 'admin',
  name: '超级管理员',
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  department: '内控合规部',
  roles: ['admin'],
  permissions: ['*'],
}

// ===========================
// 资源管理 Mock
// ===========================
const standardTitles = [
  '企业内部控制基本规范',
  '信息系统安全等级保护基本要求',
  '商业银行内部控制指引',
  '企业内部控制应用指引第1号——组织架构',
  '企业内部控制应用指引第5号——资金活动',
  '信息安全技术 网络安全等级保护测评要求',
  '金融机构反洗钱和反恐怖融资管理办法',
  '企业内部控制评价指引',
  '企业内部控制审计指引',
  '商业银行信息科技风险管理指引',
  '关于加强内部审计工作的若干意见',
  '企业内部控制应用指引第14号——财务报告',
  '个人信息保护法合规检查要求',
  '数据安全管理办法（试行稿）',
  '信息技术服务 运行维护 第1部分：通用要求',
]

const categories: Array<'law' | 'industry' | 'internal' | 'system'> = [
  'law',
  'industry',
  'internal',
  'system',
]

// 生成基础标准（每条 versionNumber=1, standardGroupId=自身id）
const baseStandards: Standard[] = standardTitles.map((title, i) => ({
  id: `std-${String(i + 1).padStart(3, '0')}`,
  title,
  category: categories[i % 4] as Standard['category'],
  version: `V${1 + Math.floor(i / 5)}.${i % 3}`,
  publishDate: `2025-${String(1 + (i % 12)).padStart(2, '0')}-15`,
  status: (i < 12 ? 'active' : i < 14 ? 'draft' : 'archived') as Standard['status'],
  attachments: [],
  tags: i % 2 === 0 ? ['内控', '合规'] : ['IT审计', '信息安全'],
  description: `${title}的详细描述信息，规定了相关领域的控制要求和检查标准。`,
  createdAt: '2025-01-01',
  updatedAt: `2025-${String(1 + (i % 12)).padStart(2, '0')}-20`,
  standardGroupId: `std-${String(i + 1).padStart(3, '0')}`,
  versionNumber: 1,
}))

// 为前3个标准添加版本历史（旧版 archived，当前版 active）
const versionHistoryExtras: Standard[] = [
  // std-001 的旧版本 V1.0 (archived)
  {
    id: 'std-001-v1',
    title: '企业内部控制基本规范',
    category: 'law',
    version: 'V1.0',
    publishDate: '2023-06-01',
    status: 'archived',
    attachments: [],
    tags: ['内控', '合规'],
    description: '企业内部控制基本规范初版，建立了内控管理的基本框架。',
    createdAt: '2023-05-01',
    updatedAt: '2023-06-01',
    standardGroupId: 'std-001',
    versionNumber: 1,
    changeLog: '初始发布',
  },
  {
    id: 'std-001-v2',
    title: '企业内部控制基本规范',
    category: 'law',
    version: 'V1.1',
    publishDate: '2024-03-15',
    status: 'archived',
    attachments: [],
    tags: ['内控', '合规'],
    description: '企业内部控制基本规范修订版，完善了风险评估和监督机制。',
    createdAt: '2024-02-01',
    updatedAt: '2024-03-15',
    standardGroupId: 'std-001',
    versionNumber: 2,
    previousVersionId: 'std-001-v1',
    changeLog: '完善风险评估章节，增加监督机制描述',
  },
  // std-001 当前版 V2.0 (active) — 替换 baseStandards 中的 std-001
  // std-002 的旧版本 V1.0 (archived)
  {
    id: 'std-002-v1',
    title: '信息系统安全等级保护基本要求',
    category: 'industry',
    version: 'V1.0',
    publishDate: '2024-01-10',
    status: 'archived',
    attachments: [],
    tags: ['IT审计', '信息安全'],
    description: '信息系统安全等级保护基本要求初版。',
    createdAt: '2023-12-01',
    updatedAt: '2024-01-10',
    standardGroupId: 'std-002',
    versionNumber: 1,
    changeLog: '初始发布',
  },
  // std-003 的旧版本 V1.0 (archived)
  {
    id: 'std-003-v1',
    title: '商业银行内部控制指引',
    category: 'internal',
    version: 'V1.0',
    publishDate: '2023-09-01',
    status: 'archived',
    attachments: [],
    tags: ['内控', '合规'],
    description: '商业银行内部控制指引初版，规定了银行内控基本要求。',
    createdAt: '2023-08-01',
    updatedAt: '2023-09-01',
    standardGroupId: 'std-003',
    versionNumber: 1,
    changeLog: '初始发布',
  },
  {
    id: 'std-003-v2',
    title: '商业银行内部控制指引',
    category: 'internal',
    version: 'V1.1',
    publishDate: '2024-06-20',
    status: 'archived',
    attachments: [],
    tags: ['内控', '合规'],
    description: '商业银行内部控制指引修订版，增加了数字化转型相关要求。',
    createdAt: '2024-05-01',
    updatedAt: '2024-06-20',
    standardGroupId: 'std-003',
    versionNumber: 2,
    previousVersionId: 'std-003-v1',
    changeLog: '增加数字化转型和科技风险管理章节',
  },
]

// 更新 baseStandards 中有版本历史的条目
Object.assign(baseStandards[0]!, {
  version: 'V2.0',
  versionNumber: 3,
  previousVersionId: 'std-001-v2',
  changeLog: '全面修订：新增数据安全和个人信息保护相关条款',
  publishDate: '2025-01-15',
})
Object.assign(baseStandards[1]!, {
  version: 'V2.0',
  versionNumber: 2,
  previousVersionId: 'std-002-v1',
  changeLog: '更新等级保护 2.0 标准要求',
  publishDate: '2025-02-15',
})
Object.assign(baseStandards[2]!, {
  version: 'V2.0',
  versionNumber: 3,
  previousVersionId: 'std-003-v2',
  changeLog: '全面修订反洗钱和数据治理要求',
  publishDate: '2025-03-15',
})

export const mockStandards: Standard[] = [...baseStandards, ...versionHistoryExtras]

// 检查清单 - 丰富mock数据
const checklistNames = [
  '资金活动内控检查清单',
  '采购业务内控检查清单',
  '资产管理内控检查清单',
  '合同管理内控检查清单',
  '信息系统运维检查清单',
  '人力资源管理检查清单',
  '财务报告编制检查清单',
  '销售业务内控检查清单',
]

const checklistItemsMap: Record<string, ChecklistItem[]> = {
  'chk-001': [
    {
      id: 'ci-001',
      checklistId: 'chk-001',
      sequence: 1,
      content: '大额资金支付是否经过集体审批',
      criterion: '超过50万的支付需经过总经理或董事长审批',
      method: '查阅审批记录',
      riskLevel: 'high',
    },
    {
      id: 'ci-002',
      checklistId: 'chk-001',
      sequence: 2,
      content: '资金调拨是否符合授权审批制度',
      criterion: '跨账户资金调拨需双人操作',
      method: '查阅银行流水',
      riskLevel: 'high',
    },
    {
      id: 'ci-003',
      checklistId: 'chk-001',
      sequence: 3,
      content: '银行对账是否及时完成',
      criterion: '每月5日前完成上月银行余额调节表',
      method: '查阅调节表',
      riskLevel: 'medium',
    },
    {
      id: 'ci-004',
      checklistId: 'chk-001',
      sequence: 4,
      content: '备用金管理是否规范',
      criterion: '备用金额度不超过5000元',
      method: '盘点备用金',
      riskLevel: 'low',
    },
  ],
  'chk-002': [
    {
      id: 'ci-005',
      checklistId: 'chk-002',
      sequence: 1,
      content: '采购需求是否经过审批',
      criterion: '所有采购需求表经部门负责人审批',
      method: '查阅采购申请',
      riskLevel: 'medium',
    },
    {
      id: 'ci-006',
      checklistId: 'chk-002',
      sequence: 2,
      content: '供应商是否经过资质审核',
      criterion: '新供应商入库需提供营业执照等资质文件',
      method: '查阅供应商档案',
      riskLevel: 'high',
    },
    {
      id: 'ci-007',
      checklistId: 'chk-002',
      sequence: 3,
      content: '招标流程是否合规',
      criterion: '超过10万的采购需公开招标或邀请招标',
      method: '查阅招标文件',
      riskLevel: 'high',
    },
  ],
  'chk-003': [
    {
      id: 'ci-008',
      checklistId: 'chk-003',
      sequence: 1,
      content: '固定资产台账是否完整',
      criterion: '资产台账与实物一致',
      method: '资产盘点',
      riskLevel: 'medium',
    },
    {
      id: 'ci-009',
      checklistId: 'chk-003',
      sequence: 2,
      content: '资产处置是否经过审批',
      criterion: '资产报废需经主管领导审批',
      method: '查阅审批记录',
      riskLevel: 'medium',
    },
  ],
  'chk-004': [
    {
      id: 'ci-010',
      checklistId: 'chk-004',
      sequence: 1,
      content: '合同签署前是否经过法务审核',
      criterion: '金额超过5万的合同需法务审核',
      method: '查阅审核记录',
      riskLevel: 'high',
    },
    {
      id: 'ci-011',
      checklistId: 'chk-004',
      sequence: 2,
      content: '合同档案是否妥善保管',
      criterion: '合同原件需归档，电子版同步OA系统',
      method: '查阅档案',
      riskLevel: 'low',
    },
  ],
  'chk-005': [
    {
      id: 'ci-012',
      checklistId: 'chk-005',
      sequence: 1,
      content: '系统账号权限是否定期复核',
      criterion: '每季度进行一次账号权限梳理',
      method: '查阅复核报告',
      riskLevel: 'high',
    },
    {
      id: 'ci-013',
      checklistId: 'chk-005',
      sequence: 2,
      content: '系统变更是否遵循变更管理流程',
      criterion: '所有变更需提交变更申请并经过测试环境验证',
      method: '查阅变更记录',
      riskLevel: 'high',
    },
    {
      id: 'ci-014',
      checklistId: 'chk-005',
      sequence: 3,
      content: '数据备份策略是否有效执行',
      criterion: '关键系统每日全量备份，每周离场备份',
      method: '查阅备份日志',
      riskLevel: 'high',
    },
    {
      id: 'ci-015',
      checklistId: 'chk-005',
      sequence: 4,
      content: '安全补丁是否及时更新',
      criterion: '高危漏洞补丁在72小时内完成部署',
      method: '查阅补丁报告',
      riskLevel: 'medium',
    },
    {
      id: 'ci-016',
      checklistId: 'chk-005',
      sequence: 5,
      content: '日志审计是否正常运行',
      criterion: '系统日志保留不少于6个月',
      method: '检查日志系统',
      riskLevel: 'medium',
    },
  ],
}

export const mockChecklists: ControlChecklist[] = checklistNames.map((name, i) => {
  const id = `chk-${String(i + 1).padStart(3, '0')}`
  return {
    id,
    code: `CL-2026-${String(i + 1).padStart(3, '0')}`,
    name,
    description: `${name}的详细描述，涵盖该业务领域的主要控制点。`,
    items: checklistItemsMap[id] || [],
    status: i < 6 ? 'active' : ('draft' as any),
    createdAt: `2026-01-${String(10 + i).padStart(2, '0')}`,
    updatedAt: `2026-02-${String(1 + i).padStart(2, '0')}`,
  }
})

export const mockPersonnel: Personnel[] = [
  {
    id: 'p-001',
    name: '张三',
    department: '财务部',
    position: '经理',
    phone: '138****1001',
    email: 'zhangsan@iris.com',
    roles: ['auditor'],
    skills: ['资金管理', '税务'],
    status: 'active',
  },
  {
    id: 'p-002',
    name: '李四',
    department: '审计部',
    position: '高级审计师',
    phone: '138****1002',
    email: 'lisi@iris.com',
    roles: ['reviewer', 'leader'],
    skills: ['IT审计', '工程审计'],
    status: 'active',
  },
  {
    id: 'p-003',
    name: '王五',
    department: 'IT部',
    position: '架构师',
    phone: '138****1003',
    email: 'wangwu@iris.com',
    roles: ['expert'],
    skills: ['网络安全', '系统运维'],
    status: 'active',
  },
  {
    id: 'p-004',
    name: '赵六',
    department: '法务部',
    position: '法律顾问',
    phone: '138****1004',
    email: 'zhaoliu@iris.com',
    roles: ['reviewer'],
    skills: ['合同管理', '法规解读'],
    status: 'active',
  },
  {
    id: 'p-005',
    name: '孙七',
    department: '采购部',
    position: '采购主管',
    phone: '138****1005',
    email: 'sunqi@iris.com',
    roles: ['member'],
    skills: ['采购管理', '供应商管理'],
    status: 'active',
  },
  {
    id: 'p-006',
    name: '周八',
    department: '人力资源部',
    position: '培训专员',
    phone: '138****1006',
    email: 'zhouba@iris.com',
    roles: ['member'],
    skills: ['培训', '绩效考核'],
    status: 'active',
  },
  {
    id: 'p-007',
    name: '吴九',
    department: '风控部',
    position: '风险分析师',
    phone: '138****1007',
    email: 'wujiu@iris.com',
    roles: ['auditor', 'expert'],
    skills: ['风险评估', '数据分析'],
    status: 'active',
  },
  {
    id: 'p-008',
    name: '陈十',
    department: '审计部',
    position: '审计经理',
    phone: '138****1008',
    email: 'chenshi@iris.com',
    roles: ['leader'],
    skills: ['内控审计', '流程优化'],
    status: 'inactive',
  },
]

// 档案 Mock
export const mockArchives: Archive[] = [
  {
    id: 'arc-001',
    projectId: 'proj-002',
    projectName: '信息系统权限管理审计',
    archiveDate: '2026-02-01',
    status: 'active',
    documents: [
      {
        id: 'ad-001',
        archiveId: 'arc-001',
        category: '工作底稿',
        name: '权限检查工作底稿.xlsx',
        attachments: [],
      },
      {
        id: 'ad-002',
        archiveId: 'arc-001',
        category: '审计报告',
        name: '信息系统权限管理审计报告.pdf',
        attachments: [],
      },
      {
        id: 'ad-003',
        archiveId: 'arc-001',
        category: '整改跟踪',
        name: '整改跟踪表.xlsx',
        attachments: [],
      },
    ],
  },
  {
    id: 'arc-002',
    projectId: 'proj-003',
    projectName: '2025年度财务报表审计',
    archiveDate: '2025-12-20',
    status: 'sealed',
    documents: [
      {
        id: 'ad-004',
        archiveId: 'arc-002',
        category: '审计报告',
        name: '2025年度财务审计报告.pdf',
        attachments: [],
      },
      {
        id: 'ad-005',
        archiveId: 'arc-002',
        category: '工作底稿',
        name: '财务报表分析底稿.xlsx',
        attachments: [],
      },
    ],
  },
  {
    id: 'arc-003',
    projectId: 'proj-004',
    projectName: '采购流程专项检查',
    archiveDate: '2025-11-15',
    status: 'sealed',
    documents: [
      {
        id: 'ad-006',
        archiveId: 'arc-003',
        category: '审计报告',
        name: '采购流程检查报告.pdf',
        attachments: [],
      },
    ],
  },
]

// ===========================
// 计划 Mock
// ===========================
export const mockPlans: ControlPlan[] = [
  {
    id: 'pl-2026-001',
    code: 'PL-2026-Q1',
    name: '2026年第一季度内控检查计划',
    cycle: 'quarterly',
    year: 2026,
    period: 'Q1',
    status: 'in_progress',
    description:
      '对财务、采购及信息系统三大领域进行季度性内控检查，重点关注资金支付流程和系统权限管理。',
    items: [
      {
        id: 'pi-001',
        planId: 'pl-2026-001',
        sequence: 1,
        targetScope: '财务部 - 资金支付流程',
        checklistIds: ['chk-001'],
        plannedStartDate: '2026-01-15',
        plannedEndDate: '2026-02-15',
        assignee: 'p-001',
        remark: '重点关注大额支付审批',
      },
      {
        id: 'pi-002',
        planId: 'pl-2026-001',
        sequence: 2,
        targetScope: '采购部 - 招标与供应商管理',
        checklistIds: ['chk-002'],
        plannedStartDate: '2026-02-01',
        plannedEndDate: '2026-02-28',
        assignee: 'p-005',
      },
      {
        id: 'pi-003',
        planId: 'pl-2026-001',
        sequence: 3,
        targetScope: 'IT部 - 系统运维与权限',
        checklistIds: ['chk-005'],
        plannedStartDate: '2026-02-15',
        plannedEndDate: '2026-03-15',
        assignee: 'p-003',
        remark: '配合信息安全等级保护复评',
      },
    ],
    createdBy: 'admin',
    createdAt: '2025-12-25',
    updatedAt: '2026-01-05',
  },
  {
    id: 'pl-2026-002',
    code: 'PL-2026-Q2',
    name: '2026年第二季度内控检查计划',
    cycle: 'quarterly',
    year: 2026,
    period: 'Q2',
    status: 'draft',
    description: '针对固定资产管理和合同管理两个领域开展检查。',
    items: [
      {
        id: 'pi-004',
        planId: 'pl-2026-002',
        sequence: 1,
        targetScope: '行政部 - 固定资产盘点',
        checklistIds: ['chk-003'],
        plannedStartDate: '2026-04-01',
        plannedEndDate: '2026-04-30',
        assignee: 'p-007',
      },
      {
        id: 'pi-005',
        planId: 'pl-2026-002',
        sequence: 2,
        targetScope: '法务部 - 合同签署与归档',
        checklistIds: ['chk-004'],
        plannedStartDate: '2026-04-15',
        plannedEndDate: '2026-05-15',
        assignee: 'p-004',
      },
    ],
    createdBy: 'admin',
    createdAt: '2026-02-01',
    updatedAt: '2026-02-01',
  },
]

// ===========================
// 项目 Mock
// ===========================
export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    code: 'PRJ-2026-001',
    name: '2026年度资金安全专项检查',
    source: 'plan',
    planId: 'pl-2026-001',
    status: 'in_progress',
    startDate: '2026-01-15',
    endDate: '2026-02-28',
    team: [],
    tasks: [],
    createdBy: 'admin',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'proj-002',
    code: 'PRJ-2026-002',
    name: '信息系统权限管理审计',
    source: 'manual',
    status: 'completed',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    team: [],
    tasks: [],
    createdBy: 'admin',
    createdAt: '2025-12-30',
    updatedAt: '2026-01-31',
  },
]

// ===========================
// 整改 Mock
// ===========================
export const mockRectifications: RectificationOrder[] = [
  {
    id: 'rect-001',
    code: 'REC-2026-001',
    source: 'task',
    title: '关于资金支付流程不规范的整改',
    description: '发现部分支付单据缺乏必要的审批签字。',
    assigneeId: 'p-001',
    assigneeName: '张三',
    reviewerId: 'p-002',
    reviewerName: '李四',
    status: 'in_progress',
    deadline: '2026-02-28',
    attachments: [],
    logs: [],
    createdAt: '2026-02-10',
    updatedAt: '2026-02-10',
  },
]

// ===========================
// 工作台 Dashboard Mock
// ===========================
export const mockDashboardStats: DashboardStats = {
  projectOverview: { total: 42, inProgress: 12, completed: 28, overdue: 2 },
  taskOverview: { total: 156, pending: 45, inProgress: 30, completed: 78, rejected: 3 },
  rectificationOverview: { total: 24, open: 8, closed: 16, overdueRate: 5.5 },
  recentProjects: mockProjects,
  todoList: [
    {
      id: '1',
      type: 'task',
      title: '审核用户权限管理检查任务',
      priority: 'high',
      sourceId: 't-1',
      deadline: '02-15',
    },
    {
      id: '2',
      type: 'rectification',
      title: '评审数据备份整改单',
      priority: 'medium',
      sourceId: 'r-1',
      deadline: '02-18',
    },
  ],
}

export const mockAlerts: AlertEvent[] = [
  {
    id: '1',
    source: 'OA系统',
    level: 'critical',
    title: '响应延迟超过阈值',
    content: '平均响应时间 > 500ms',
    timestamp: '2026-02-12 10:30',
    acknowledged: false,
  },
  {
    id: '2',
    source: '邮件服务器',
    level: 'warning',
    title: '存储空间不足',
    content: '剩余空间 < 10%',
    timestamp: '2026-02-12 09:15',
    acknowledged: false,
  },
  {
    id: '3',
    source: '防火墙',
    level: 'info',
    title: '策略变更',
    content: '策略 ID-8872 已生效',
    timestamp: '2026-02-12 08:00',
    acknowledged: true,
  },
]

export const mockLogs: LogEntry[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `log-${i}`,
  source: i % 2 === 0 ? '业务系统' : '基础平台',
  level: i % 10 === 0 ? 'error' : i % 5 === 0 ? 'warn' : 'info',
  message: `系统执行了操作 #${i + 1000}`,
  timestamp: `2026-02-12 ${String(10 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
}))
