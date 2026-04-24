import { describe, expect, it, vi } from 'vitest'
import { refreshStandardDialogContext } from './standard-dialog-context'

describe('standard dialog context', () => {
  it('refreshes user access and scope options before opening dialog', async () => {
    const callOrder: string[] = []
    const refreshUserInfo = vi.fn(async () => {
      callOrder.push('user')
    })
    const refreshScopeOptions = vi.fn(async () => {
      callOrder.push('scope')
    })

    await refreshStandardDialogContext(refreshUserInfo, refreshScopeOptions)

    expect(refreshUserInfo).toHaveBeenCalledTimes(1)
    expect(refreshScopeOptions).toHaveBeenCalledTimes(1)
    expect(callOrder).toEqual(['user', 'scope'])
  })
})
