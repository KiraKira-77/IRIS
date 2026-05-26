import axios from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'
import { buildAuthorizationHeader, buildLoginRedirectPath, parseApiResult } from './auth-transport'
import { resolveApiErrorMessage } from './error-message'

const TOKEN_STORAGE_KEY = 'iris_token'

type IrisRequestConfig = AxiosRequestConfig & {
  silentErrorCodes?: string[]
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authHeader = buildAuthorizationHeader(localStorage.getItem(TOKEN_STORAGE_KEY))
    if (authHeader) config.headers.Authorization = authHeader
    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const result = parseApiResult(response.data)
    if (!result.ok) {
      const message = resolveApiErrorMessage(result.code, result.message)
      logApiError(message, {
        ...requestContext(response.config),
        status: response.status,
        code: result.code,
        response: response.data,
      })
      if (shouldShowErrorMessage(response.config, result.code)) {
        ElMessage.error(message)
      }
      if (result.unauthorized) {
        handleUnauthorized()
      }
      return Promise.reject(new Error(message))
    }
    return result.data as unknown as AxiosResponse
  },
  (error) => {
    const result = parseApiResult(error.response?.data)
    if (error.response?.status === 401 || result.unauthorized) {
      handleUnauthorized()
    }

    const message = resolveApiErrorMessage(
      result.code,
      (!result.ok && result.message) || error.response?.data?.message || error.message,
    )
    logApiError(message, {
      ...requestContext(error.config),
      status: error.response?.status,
      code: result.code,
      response: error.response?.data,
      error,
    })
    if (shouldShowErrorMessage(error.config, result.code)) {
      ElMessage.error(message)
    }
    return Promise.reject(new Error(message))
  },
)

const request = {
  get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: IrisRequestConfig,
  ): Promise<T> {
    return service.get(url, { params, ...config }) as Promise<T>
  },
  post<T = unknown>(url: string, data?: unknown, config?: IrisRequestConfig): Promise<T> {
    return service.post(url, data, config) as Promise<T>
  },
  put<T = unknown>(url: string, data?: unknown, config?: IrisRequestConfig): Promise<T> {
    return service.put(url, data, config) as Promise<T>
  },
  delete<T = unknown>(url: string, config?: IrisRequestConfig): Promise<T> {
    return service.delete(url, config) as Promise<T>
  },
  upload<T = unknown>(url: string, file: File, fieldName = 'file'): Promise<T> {
    const formData = new FormData()
    formData.append(fieldName, file)
    return service.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<T>
  },
}

export default request

function handleUnauthorized() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  const loginRedirectPath = buildLoginRedirectPath(window.location)
  if (`${window.location.pathname}${window.location.search}` !== loginRedirectPath) {
    window.location.href = loginRedirectPath
  }
}

function logApiError(message: string, context: Record<string, unknown>) {
  console.error('[IRIS API ERROR]', message, context)
}

function shouldShowErrorMessage(config: AxiosRequestConfig | undefined, code?: string) {
  const silentErrorCodes = (config as IrisRequestConfig | undefined)?.silentErrorCodes || []
  return !silentErrorCodes.includes(code || '')
}

function requestContext(config?: AxiosRequestConfig) {
  return {
    method: config?.method,
    url: config?.url,
    params: config?.params,
    data: config?.data,
  }
}
