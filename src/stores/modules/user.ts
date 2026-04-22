import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthCurrentUser, UserInfo } from '@/types'
import { authApi } from '@/api'

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
      userInfo.value = mapCurrentUser(currentUser)
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
    login,
    logout,
    fetchUserInfo,
    ensureUserInfoLoaded,
    hasPermission,
    clearToken,
    setToken,
  }
})

function mapCurrentUser(currentUser: AuthCurrentUser): UserInfo {
  const permissions = currentUser.roles.includes('PLATFORM_ADMIN') ? ['*'] : []

  return {
    id: String(currentUser.userId),
    username: currentUser.username,
    name: currentUser.displayName || currentUser.username,
    avatar: '',
    department: currentUser.tenantName || '',
    email: '',
    phone: '',
    roles: currentUser.roles,
    permissions,
  }
}
