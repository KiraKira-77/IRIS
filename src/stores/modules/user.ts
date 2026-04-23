import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthCurrentUser, UserAccessContext, UserInfo } from '@/types'
import { authApi, resourceScopeApi, roleApi } from '@/api'
import { buildLocalAccessContext, mapCurrentUserToUserInfo } from '@/features/permissions/user-access'
import { buildMenuCodesFromRoles } from '@/features/permissions/menu-access'
import { resolveCurrentUserAccessContext } from './user-access-context'

const TOKEN_STORAGE_KEY = 'iris_token'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const userInfo = ref<UserInfo | null>(null)
  let userInfoPromise: Promise<void> | null = null

  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.name || '')
  const userAvatar = computed(() => {
    if (!userInfo.value?.avatar) return ''
    try {
      const avatarArr = JSON.parse(userInfo.value.avatar)
      if (Array.isArray(avatarArr) && avatarArr.length > 0) {
        const fileKey = avatarArr[0].fileKey
        if (fileKey) return `http://10.8.25.218:8002/je/document/preview/${fileKey}`
      }
    } catch {
      return userInfo.value.avatar
    }
    return ''
  })
  const permissions = computed(() => userInfo.value?.permissions || [])
  const accessContext = computed(() => userInfo.value?.accessContext)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
  }

  function clearToken() {
    token.value = ''
    userInfo.value = null
    userInfoPromise = null
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  async function login(account: string, password: string) {
    const result = await authApi.login({ account, password })
    setToken(result.token)
    return result
  }

  async function fetchUserInfo() {
    if (!token.value) return

    try {
      const currentUser = await authApi.getUserInfo()
      const [accessContext, menuCodes] = await Promise.all([
        resolveAccessContext(currentUser),
        resolveMenuCodes(currentUser),
      ])
      userInfo.value = mapCurrentUser(currentUser, accessContext, menuCodes)
    } catch (error) {
      clearToken()
      throw error instanceof Error ? error : new Error('获取用户信息失败')
    }
  }

  async function ensureUserInfoLoaded() {
    if (!token.value || userInfo.value) return
    if (userInfoPromise) {
      return userInfoPromise
    }

    userInfoPromise = fetchUserInfo().finally(() => {
      userInfoPromise = null
    })
    return userInfoPromise
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearToken()
    }
  }

  function hasPermission(perm: string): boolean {
    return permissions.value.includes(perm) || permissions.value.includes('*')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    userName,
    userAvatar,
    permissions,
    accessContext,
    login,
    logout,
    fetchUserInfo,
    ensureUserInfoLoaded,
    hasPermission,
    clearToken,
    setToken,
  }
})

async function resolveAccessContext(currentUser: AuthCurrentUser): Promise<UserAccessContext> {
  const localAccessContext = buildLocalAccessContext(currentUser.roles)

  if (localAccessContext.isSuperAdmin) {
    return localAccessContext
  }

  try {
    return resolveCurrentUserAccessContext(
      currentUser,
      await resourceScopeApi.listCurrentUserMemberships(),
    )
  } catch {
    return localAccessContext
  }
}

async function resolveMenuCodes(currentUser: AuthCurrentUser): Promise<string[]> {
  try {
    const roles = await roleApi.list()
    const roleMenus = Object.fromEntries(
      roles.map((role) => [role.roleCode, role.menuCodes || []]),
    )

    return buildMenuCodesFromRoles(currentUser.roles, roleMenus)
  } catch {
    return buildMenuCodesFromRoles(currentUser.roles)
  }
}

function mapCurrentUser(
  currentUser: AuthCurrentUser,
  accessContext = buildLocalAccessContext(currentUser.roles),
  menuCodes = buildMenuCodesFromRoles(currentUser.roles),
): UserInfo {
  return mapCurrentUserToUserInfo(currentUser, accessContext, menuCodes)
}
