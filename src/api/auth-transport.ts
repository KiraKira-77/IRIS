export interface ParsedApiResult<T> {
  ok: boolean
  unauthorized: boolean
  code?: string
  data: T | null
  message: string
}

interface LocationLike {
  pathname?: string
  search?: string
  hash?: string
}

export function buildAuthorizationHeader(token?: string | null): string | undefined {
  if (!token) return undefined
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`
}

export function buildLoginRedirectPath(location: LocationLike): string {
  const pathname = location.pathname || '/'
  if (pathname === '/login') {
    return '/login'
  }

  const redirectTarget = `${pathname}${location.search || ''}${location.hash || ''}`
  return `/login?redirect=${encodeURIComponent(redirectTarget)}`
}

export function parseApiResult<T>(payload: unknown): ParsedApiResult<T> {
  if (isObjectPayload(payload) && 'success' in payload) {
    const result = payload as {
      success: boolean
      code?: string
      message?: string
      data?: T | null
    }

    return {
      ok: result.success,
      unauthorized: !result.success && result.code === 'UNAUTHORIZED',
      code: result.code,
      data: (result.data ?? null) as T | null,
      message: result.message || '',
    }
  }

  if (isObjectPayload(payload) && 'code' in payload && 'data' in payload) {
    const result = payload as {
      code: number | string
      message?: string
      data?: T | null
    }
    const numericCode = Number(result.code)

    return {
      ok: numericCode === 0 || numericCode === 200,
      unauthorized: numericCode === 401,
      code: String(result.code),
      data: (result.data ?? null) as T | null,
      message: result.message || '',
    }
  }

  return {
    ok: true,
    unauthorized: false,
    code: undefined,
    data: (payload as T) ?? null,
    message: '',
  }
}

function isObjectPayload(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null
}
