import { describe, expect, it } from 'vitest'
import { resolveApiErrorMessage } from './error-message'

describe('api error messages', () => {
  it('translates backend business error codes into Chinese messages', () => {
    expect(resolveApiErrorMessage('PROJECT_FORBIDDEN', 'PROJECT_FORBIDDEN')).toBe(
      '当前用户无权查看该项目',
    )
    expect(resolveApiErrorMessage('PROJECT_LEADER_REQUIRED', 'PROJECT_LEADER_REQUIRED')).toBe(
      '仅项目负责人可执行该操作',
    )
    expect(resolveApiErrorMessage('PROJECT_CHECKLIST_ITEMS_REQUIRED', 'project requires checklist items')).toBe(
      '请选择包含检查项的检查清单',
    )
    expect(resolveApiErrorMessage('PROJECT_PLAN_ALREADY_GENERATED', 'PROJECT_PLAN_ALREADY_GENERATED')).toBe(
      '该计划已生成项目，不能重复生成',
    )
    expect(resolveApiErrorMessage('CHECKLIST_CODE_DUPLICATED', 'CHECKLIST_CODE_DUPLICATED')).toBe(
      '清单编号已存在，请更换后再保存',
    )
  })

  it('keeps readable Chinese backend messages and hides raw error codes', () => {
    expect(resolveApiErrorMessage('CUSTOM_ERROR', '维护域不能为空')).toBe('维护域不能为空')
    expect(resolveApiErrorMessage('UNMAPPED_ERROR', 'UNMAPPED_ERROR')).toBe('操作失败，请稍后重试')
  })

  it('uses a Chinese fallback for network and unknown errors', () => {
    expect(resolveApiErrorMessage(undefined, 'timeout of 120000ms exceeded')).toBe('请求超时，请稍后重试')
    expect(resolveApiErrorMessage(undefined, 'Network Error')).toBe('网络异常，请稍后重试')
    expect(resolveApiErrorMessage(undefined, '')).toBe('操作失败，请稍后重试')
  })
})
