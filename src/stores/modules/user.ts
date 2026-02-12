import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('iris_token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.name || '')
  const permissions = computed(() => userInfo.value?.permissions || [])

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('iris_token', newToken)
  }

  function clearToken() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('iris_token')
  }

  async function login(username: string, password: string) {
    const res = await authApi.login({ username, password })
    setToken(res.token)
    userInfo.value = res.user
    return res
  }

  async function fetchUserInfo() {
    if (!token.value) return
    try {
      userInfo.value = await authApi.getUserInfo()
    } catch {
      clearToken()
      throw new Error('获取用户信息失败')
    }
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
    permissions,
    login,
    logout,
    fetchUserInfo,
    hasPermission,
    clearToken,
  }
})
