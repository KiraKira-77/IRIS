import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('iris_token') || '')
  const userInfo = ref<UserInfo | null>(null)

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
      // avatar 不是 JSON，直接当 URL 使用
      return userInfo.value.avatar
    }
    return ''
  })
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

  async function login(account: string, password: string) {
    const res = await authApi.login({ account, password })
    const respData = res.data
    if (
      respData &&
      (respData.code === 0 || respData.code === 200 || respData.success || respData.code === '1000')
    ) {
      const newToken = respData.data
      setToken(newToken)
      return respData
    } else {
      throw new Error(respData?.message || respData?.msg || '登录失败')
    }
  }

  async function fetchUserInfo() {
    if (!token.value) return
    try {
      const res = await authApi.getUserInfo()
      const respData = res.data
      if (respData && respData.data) {
        const d = respData.data
        userInfo.value = {
          id: d.id || '',
          username: d.code || '',
          name: d.name || '',
          avatar: d.avatar || '',
          department: d.realUser?.organization?.name || '',
          email: d.email || '',
          phone: d.phone || '',
          roles: d.roleNames || [],
          permissions: d.permissions || [],
        }
      }
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
    userAvatar,
    permissions,
    login,
    logout,
    fetchUserInfo,
    hasPermission,
    clearToken,
    setToken,
  }
})
