import { describe, expect, it } from 'vitest'
import { resolveAuthRouteDecision } from './auth-session'

describe('resolveAuthRouteDecision', () => {
  it('redirects anonymous users who visit protected pages to login with redirect', () => {
    expect(
      resolveAuthRouteDecision({
        isPublicRoute: false,
        isLoginRoute: false,
        hasToken: false,
        hasUserInfo: false,
        toFullPath: '/project/list?page=2',
      }),
    ).toEqual({
      type: 'redirect',
      target: '/login?redirect=%2Fproject%2Flist%3Fpage%3D2',
    })
  })

  it('bootstraps current user info for authenticated protected navigation', () => {
    expect(
      resolveAuthRouteDecision({
        isPublicRoute: false,
        isLoginRoute: false,
        hasToken: true,
        hasUserInfo: false,
        toFullPath: '/workbench/dashboard',
      }),
    ).toEqual({
      type: 'bootstrap-user',
    })
  })

  it('redirects authenticated users away from the login page', () => {
    expect(
      resolveAuthRouteDecision({
        isPublicRoute: true,
        isLoginRoute: true,
        hasToken: true,
        hasUserInfo: true,
        toFullPath: '/login',
        loginRedirect: '/profile',
      }),
    ).toEqual({
      type: 'redirect',
      target: '/profile',
    })
  })

  it('ignores unsafe login redirect targets', () => {
    expect(
      resolveAuthRouteDecision({
        isPublicRoute: true,
        isLoginRoute: true,
        hasToken: true,
        hasUserInfo: true,
        toFullPath: '/login',
        loginRedirect: 'https://example.com',
      }),
    ).toEqual({
      type: 'redirect',
      target: '/',
    })
  })
})
