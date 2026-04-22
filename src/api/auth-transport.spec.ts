import { describe, expect, it } from 'vitest'
import {
  buildAuthorizationHeader,
  buildLoginRedirectPath,
  parseApiResult,
} from './auth-transport'

describe('auth transport helpers', () => {
  it('adds Bearer prefix for stored tokens', () => {
    expect(buildAuthorizationHeader('plain-token')).toBe('Bearer plain-token')
  })

  it('keeps an existing Bearer prefix unchanged', () => {
    expect(buildAuthorizationHeader('Bearer plain-token')).toBe('Bearer plain-token')
  })

  it('treats IRIS backend success envelopes as successful', () => {
    expect(
      parseApiResult({
        success: true,
        code: 'OK',
        message: 'success',
        data: { token: 'abc' },
      }),
    ).toEqual({
      ok: true,
      unauthorized: false,
      data: { token: 'abc' },
      message: 'success',
    })
  })

  it('treats IRIS backend unauthorized envelopes as failures', () => {
    expect(
      parseApiResult({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'authentication required',
        data: null,
      }),
    ).toEqual({
      ok: false,
      unauthorized: true,
      data: null,
      message: 'authentication required',
    })
  })

  it('keeps compatibility with legacy numeric envelopes', () => {
    expect(
      parseApiResult({
        code: 200,
        message: 'ok',
        data: { id: 1 },
      }),
    ).toEqual({
      ok: true,
      unauthorized: false,
      data: { id: 1 },
      message: 'ok',
    })
  })

  it('builds a login redirect that preserves the current path and query', () => {
    expect(
      buildLoginRedirectPath({
        pathname: '/project/list',
        search: '?status=active&page=2',
      }),
    ).toBe('/login?redirect=%2Fproject%2Flist%3Fstatus%3Dactive%26page%3D2')
  })

  it('does not add a redirect query when already on the login page', () => {
    expect(
      buildLoginRedirectPath({
        pathname: '/login',
        search: '?redirect=%2Fworkbench%2Fdashboard',
      }),
    ).toBe('/login')
  })
})
