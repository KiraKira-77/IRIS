interface AuthRouteDecisionInput {
  isPublicRoute: boolean
  isLoginRoute: boolean
  hasToken: boolean
  hasUserInfo: boolean
  toFullPath: string
  loginRedirect?: string | null
}

export type AuthRouteDecision =
  | { type: 'allow' }
  | { type: 'redirect'; target: string }
  | { type: 'bootstrap-user' }

export function resolveAuthRouteDecision(input: AuthRouteDecisionInput): AuthRouteDecision {
  if (!input.hasToken) {
    if (input.isPublicRoute) {
      return { type: 'allow' }
    }

    return { type: 'redirect', target: buildLoginRoute(input.toFullPath) }
  }

  if (input.isLoginRoute) {
    return { type: 'redirect', target: normalizeRedirectTarget(input.loginRedirect) }
  }

  if (!input.isPublicRoute && !input.hasUserInfo) {
    return { type: 'bootstrap-user' }
  }

  return { type: 'allow' }
}

function buildLoginRoute(redirect: string): string {
  return `/login?redirect=${encodeURIComponent(redirect)}`
}

function normalizeRedirectTarget(redirect?: string | null): string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/'
  }

  return redirect
}
