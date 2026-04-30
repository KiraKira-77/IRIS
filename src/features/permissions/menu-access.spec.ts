import { describe, expect, it } from 'vitest'
import {
  ALL_MENU_CODES,
  APP_MENU_GROUPS,
  buildDefaultMenuCodes,
  buildMenuCodesFromRoles,
  canAccessPath,
  filterMenuGroupsByCodes,
  resolveFirstAccessiblePath,
  resolveRouteMenuCode,
} from './menu-access.ts'
import type { UserInfo } from '../../types/index.ts'

describe('menu access', () => {
  it('grants every menu to super administrators', () => {
    expect(buildDefaultMenuCodes(['SUPER_ADMIN'])).toHaveLength(ALL_MENU_CODES.length)
  })

  it('builds menu codes from role menu bindings', () => {
    expect(
      buildMenuCodesFromRoles(['AUDITOR'], {
        AUDITOR: ['resource.standards', 'project.list'],
      }),
    ).toEqual(['resource.standards', 'project.list'])
  })

  it('filters menu groups by allowed codes', () => {
    expect(filterMenuGroupsByCodes(APP_MENU_GROUPS, ['workbench.dashboard', 'resource.standards'])).toEqual([
      {
        code: 'workbench',
        label: '工作台',
        children: [{ code: 'workbench.dashboard', label: '工作台', path: '/workbench/dashboard' }],
      },
      {
        code: 'resource',
        label: '资源管理',
        children: [{ code: 'resource.standards', label: '标准管理', path: '/resource/standards' }],
      },
    ])
  })

  it('resolves nested routes to menu codes', () => {
    expect(resolveRouteMenuCode('/project/detail/1001')).toBe('project.list')
    expect(resolveRouteMenuCode('/system/roles')).toBe('system.roles')
  })

  it('checks path access by user menu codes', () => {
    const userInfo: UserInfo = {
      id: '2004',
      tenantId: 1001,
      username: 'auditor',
      name: '审计员',
      roles: ['AUDITOR'],
      menuCodes: ['workbench.dashboard', 'resource.standards'],
      permissions: [],
      accessContext: {
        isSuperAdmin: false,
        scopePermissions: [],
      },
    }

    expect(canAccessPath('/resource/standards', userInfo)).toBe(true)
    expect(canAccessPath('/project/create', userInfo)).toBe(false)
  })

  it('uses the first accessible menu path', () => {
    expect(resolveFirstAccessiblePath(['resource.standards'])).toBe('/resource/standards')
  })

  it('labels project creation as project creation instead of project start', () => {
    const projectGroup = APP_MENU_GROUPS.find((group) => group.code === 'project')
    const createMenu = projectGroup?.children.find((item) => item.code === 'project.create')

    expect(createMenu?.label).toBe('项目创建')
  })
})
