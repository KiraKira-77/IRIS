import type { UserInfo } from '../../types/index.ts'

export interface AppMenuItem {
  code: string
  label: string
  path: string
}

export interface AppMenuGroup {
  code: string
  label: string
  children: AppMenuItem[]
}

export const APP_MENU_GROUPS: AppMenuGroup[] = [
  {
    code: 'workbench',
    label: '工作台',
    children: [
      { code: 'workbench.dashboard', label: '工作台', path: '/workbench/dashboard' },
      { code: 'workbench.alerts', label: '告警中心', path: '/workbench/alerts' },
      { code: 'workbench.logs', label: '日志中心', path: '/workbench/logs' },
    ],
  },
  {
    code: 'resource',
    label: '资源管理',
    children: [
      { code: 'resource.standards', label: '标准管理', path: '/resource/standards' },
      { code: 'resource.checklists', label: '内控清单', path: '/resource/checklists' },
      { code: 'resource.archives', label: '档案管理', path: '/resource/archives' },
      { code: 'resource.personnel', label: '人员管理', path: '/resource/personnel' },
    ],
  },
  {
    code: 'plan',
    label: '计划管控',
    children: [
      { code: 'plan.create', label: '计划编制', path: '/plan/create' },
      { code: 'plan.list', label: '计划管理', path: '/plan/list' },
      { code: 'plan.overview', label: '计划一览', path: '/plan/overview' },
    ],
  },
  {
    code: 'project',
    label: '项目管理',
    children: [
      { code: 'project.list', label: '项目列表', path: '/project/list' },
      { code: 'project.create', label: '项目创建', path: '/project/create' },
    ],
  },
  {
    code: 'rectification',
    label: '整改管理',
    children: [
      { code: 'rectification.list', label: '整改单列表', path: '/rectification/list' },
      { code: 'rectification.create', label: '创建整改单', path: '/rectification/create' },
    ],
  },
  {
    code: 'smart',
    label: '智能内控',
    children: [
      { code: 'smart.analysis', label: '统计分析', path: '/smart/analysis' },
      { code: 'smart.rules', label: '规则库', path: '/smart/rules' },
      { code: 'smart.models', label: '模型库', path: '/smart/models' },
      { code: 'smart.aiLogs', label: 'AI 问答日志', path: '/smart/ai-logs' },
      { code: 'smart.tools', label: '工具库', path: '/smart/tools' },
    ],
  },
  {
    code: 'system',
    label: '系统设置',
    children: [
      { code: 'system.roles', label: '角色菜单', path: '/system/roles' },
      { code: 'resource.scopes', label: '资源域配置', path: '/resource/scopes' },
    ],
  },
]

const ROUTE_MENU_CODE_MATCHERS: Array<{ test: (path: string) => boolean; code: string | null }> = [
  { test: (path) => path.startsWith('/plan/detail/'), code: 'plan.list' },
  { test: (path) => path.startsWith('/project/detail/'), code: 'project.list' },
  { test: (path) => path.startsWith('/project/task/'), code: 'project.list' },
  { test: (path) => path.startsWith('/rectification/detail/'), code: 'rectification.list' },
  { test: (path) => path === '/profile', code: null },
]

export const ALL_MENU_CODES = APP_MENU_GROUPS.flatMap((group) =>
  group.children.map((item) => item.code),
)

export function buildDefaultMenuCodes(roles: string[]): string[] {
  const normalizedRoles = roles.map((role) => role.toUpperCase())

  if (normalizedRoles.includes('PLATFORM_ADMIN') || normalizedRoles.includes('SUPER_ADMIN')) {
    return [...ALL_MENU_CODES]
  }

  if (normalizedRoles.includes('TENANT_ADMIN') || normalizedRoles.includes('ADMIN')) {
    return [
      'workbench.dashboard',
      'resource.standards',
      'resource.scopes',
      'resource.checklists',
      'resource.archives',
      'resource.personnel',
      'plan.create',
      'plan.list',
      'plan.overview',
      'project.list',
      'project.create',
      'rectification.list',
      'rectification.create',
      'smart.analysis',
      'smart.rules',
      'smart.aiLogs',
      'system.roles',
    ]
  }

  if (normalizedRoles.includes('AUDITOR')) {
    return [
      'workbench.dashboard',
      'resource.standards',
      'resource.checklists',
      'resource.archives',
      'plan.list',
      'plan.overview',
      'project.list',
      'rectification.list',
      'smart.analysis',
    ]
  }

  return ['workbench.dashboard']
}

export function buildMenuCodesFromRoles(roleCodes: string[], roleMenus: Record<string, string[]> = {}) {
  const menuCodes = new Set<string>()

  for (const roleCode of roleCodes) {
    for (const menuCode of roleMenus[roleCode] || []) {
      menuCodes.add(menuCode)
    }
  }

  if (!menuCodes.size) {
    for (const menuCode of buildDefaultMenuCodes(roleCodes)) {
      menuCodes.add(menuCode)
    }
  }

  return Array.from(menuCodes)
}

export function filterMenuGroupsByCodes(groups: AppMenuGroup[], menuCodes: string[]): AppMenuGroup[] {
  const allowed = new Set(menuCodes)

  return groups
    .map((group) => ({
      ...group,
      children: group.children.filter((item) => allowed.has(item.code)),
    }))
    .filter((group) => group.children.length > 0)
}

export function resolveRouteMenuCode(path: string): string | null {
  const directMatch = APP_MENU_GROUPS.flatMap((group) => group.children).find((item) => item.path === path)

  if (directMatch) {
    return directMatch.code
  }

  const matcher = ROUTE_MENU_CODE_MATCHERS.find((item) => item.test(path))
  return matcher?.code ?? null
}

export function canAccessPath(path: string, userInfo: UserInfo | null): boolean {
  const menuCode = resolveRouteMenuCode(path)

  if (!menuCode) {
    return true
  }

  return Boolean(userInfo?.menuCodes.includes(menuCode))
}

export function resolveFirstAccessiblePath(menuCodes: string[]): string {
  const allowed = new Set(menuCodes)
  const match = APP_MENU_GROUPS.flatMap((group) => group.children).find((item) => allowed.has(item.code))
  return match?.path || '/404'
}
