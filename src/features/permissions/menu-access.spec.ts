import assert from 'node:assert/strict'
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

{
  assert.equal(buildDefaultMenuCodes(['SUPER_ADMIN']).length, ALL_MENU_CODES.length)
}

{
  assert.deepEqual(
    buildMenuCodesFromRoles(['AUDITOR'], {
      AUDITOR: ['resource.standards', 'project.list'],
    }),
    ['resource.standards', 'project.list'],
  )
}

{
  assert.deepEqual(
    filterMenuGroupsByCodes(APP_MENU_GROUPS, ['workbench.dashboard', 'resource.standards']),
    [
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
    ],
  )
}

{
  assert.equal(resolveRouteMenuCode('/project/detail/1001'), 'project.list')
  assert.equal(resolveRouteMenuCode('/system/roles'), 'system.roles')
}

{
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

  assert.equal(canAccessPath('/resource/standards', userInfo), true)
  assert.equal(canAccessPath('/project/create', userInfo), false)
}

{
  assert.equal(resolveFirstAccessiblePath(['resource.standards']), '/resource/standards')
}
