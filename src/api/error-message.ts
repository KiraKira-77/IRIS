const BUSINESS_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '登录已过期，请重新登录',
  FORBIDDEN: '当前用户无权执行该操作',

  PROJECT_FORBIDDEN: '当前用户无权查看该项目',
  PROJECT_NOT_FOUND: '项目不存在或已被删除',
  PROJECT_START_STATUS_INVALID: '当前项目状态不允许启动',
  PROJECT_COMPLETE_STATUS_INVALID: '当前项目状态不允许完成',
  PROJECT_TASKS_NOT_HANDLED: '仍有检查项未处理，不能完成项目',
  PROJECT_ARCHIVE_STATUS_INVALID: '当前项目状态不允许归档',
  PROJECT_ARCHIVED_EDIT_FORBIDDEN: '已归档项目不允许编辑',
  PROJECT_DELETE_STATUS_INVALID: '当前项目状态不允许删除',
  PROJECT_CHECKLIST_ITEMS_REQUIRED: '请选择包含检查项的检查清单',
  PROJECT_CHECKLIST_ITEM_ID_INVALID: '选择的检查项不属于当前清单或已被删除',
  PROJECT_CHECKLIST_GENERATION_MODE_INVALID: '检查项生成方式不正确',
  PROJECT_CHECKLIST_RANDOM_COUNT_INVALID: '请输入有效的随机抽取数量',
  PROJECT_LEADER_REQUIRED: '仅项目负责人可执行该操作',
  PROJECT_NOT_STARTED: '项目尚未启动，不能执行该操作',
  PROJECT_TASK_NOT_FOUND: '检查项不存在或已被删除',
  PROJECT_TASK_ASSIGNEE_REQUIRED: '仅检查项负责人或项目负责人可执行该操作',
  PROJECT_TASK_ASSIGNEE_ROLE_INVALID: '检查项负责人必须是项目负责人或项目审计人员',
  PROJECT_MEMBER_ROLE_INVALID: '项目成员角色不正确',
  PROJECT_WORK_ORDER_NOT_FOUND: '工单记录不存在或已被删除',
  PROJECT_WORK_ORDER_NOT_REVIEWABLE: '当前工单状态不允许审核',
  PROJECT_WORK_ORDER_REVIEW_LOCKED: '该工单审核结果已锁定',
  PROJECT_WORK_ORDER_NOT_COMPLETED: '工单尚未完成，不能执行该操作',
  PROJECT_WORK_ORDER_NOT_NONCONFORMING: '该工单不是不符合项',
  PROJECT_WORK_ORDER_REVIEW_INCOMPLETE: '请先完成工单审核',
  PROJECT_WORK_ORDER_REVIEW_STATUS_INVALID: '工单审核状态不正确',
  PROJECT_OMS_HTTP_FAILED: '调用 OMS 服务失败，请稍后重试',
  PROJECT_OMS_HTTP_INTERRUPTED: '调用 OMS 服务被中断，请稍后重试',
  PROJECT_OMS_RESPONSE_FAILED: 'OMS 服务返回失败',
  PROJECT_OMS_PAYLOAD_SERIALIZE_FAILED: 'OMS 请求数据处理失败',

  PLAN_NOT_FOUND: '计划不存在或已被删除',
  PLAN_FORBIDDEN: '当前用户无权操作该计划',
  PLAN_YEAR_REQUIRED: '请选择计划年度',
  PLAN_CYCLE_REQUIRED: '请选择计划频次',
  PLAN_PERIOD_REQUIRED: '请选择计划属期',
  PLAN_LINKED_PROJECT_DELETE_FORBIDDEN: '计划已关联项目，不能删除',
  PLAN_ID_INVALID: '计划 ID 不正确',

  CHECKLIST_NOT_FOUND: '内控清单不存在或已被删除',
  CHECKLIST_ID_INVALID: '内控清单 ID 不正确',
  CHECKLIST_UPLOAD_DATE_INVALID: '清单上传日期不正确',
  CHECKLIST_CODE_REQUIRED: '请输入清单编号',
  CHECKLIST_NAME_REQUIRED: '请输入清单名称',
  CHECKLIST_VERSION_REQUIRED: '请输入清单版本',
  CHECKLIST_OWNER_SCOPE_REQUIRED: '请选择维护域',
  CHECKLIST_ITEM_CONTENT_REQUIRED: '请输入检查内容',
  CHECKLIST_ITEM_CRITERION_REQUIRED: '请输入判断标准',
  CHECKLIST_ITEM_CONTROL_FREQUENCY_REQUIRED: '请选择控制频率',
  CHECKLIST_ITEM_EVALUATION_TYPE_REQUIRED: '请选择评估类',

  STANDARD_NOT_FOUND: '标准不存在或已被删除',
  STANDARD_FORBIDDEN: '当前用户无权操作该标准',
  STANDARD_DATE_INVALID: '标准日期不正确',
  RESOURCE_SCOPE_NOT_FOUND: '资源域不存在或已被删除',
  RESOURCE_SCOPE_IN_USE: '资源域仍被使用，不能删除',
  RESOURCE_SCOPE_TENANT_MISMATCH: '资源域不属于当前租户',

  RECTIFICATION_NOT_FOUND: '整改单不存在或已被删除',
  RECTIFICATION_FORBIDDEN: '当前用户无权操作该整改单',
  RECTIFICATION_OPERATOR_REQUIRED: '当前用户不是整改单处理人',
  RECTIFICATION_ASSIGNEE_REQUIRED: '请选择整改单处理人',
  RECTIFICATION_DEADLINE_INVALID: '整改期限不正确',
  RECTIFICATION_WORK_ORDER_EXISTS: '该工单已生成整改单',
  RECTIFICATION_WORK_ORDER_NOT_COMPLETED: '工单尚未完成，不能生成整改单',
  RECTIFICATION_WORK_ORDER_STATUS_INVALID: '当前工单状态不能生成整改单',
  RECTIFICATION_SUBMIT_STATUS_INVALID: '当前整改单状态不允许提交',
  RECTIFICATION_RETURN_STATUS_INVALID: '当前整改单状态不允许退回',
  RECTIFICATION_REVIEW_STATUS_INVALID: '当前整改单状态不允许审核',
  RECTIFICATION_REVIEW_ACTION_INVALID: '整改单审核操作不正确',
  RECTIFICATION_DELETE_STATUS_INVALID: '当前整改单状态不允许删除',
  RECTIFICATION_OMS_CREATE_FAILED: 'OMS 整改工单创建失败',

  USER_NOT_FOUND: '用户不存在或已被删除',
  USER_PROTECTED: '系统内置用户不允许删除',
  ROLE_NOT_FOUND: '角色不存在或已被删除',
  ROLE_PROTECTED: '系统内置角色不允许删除',
  ROLE_IN_USE: '角色仍被用户使用，不能删除',
  ROLE_TENANT_MISMATCH: '角色不属于当前租户',

  FILE_EMPTY: '上传文件不能为空',
  FILE_TOO_LARGE: '上传文件超过大小限制',
  FILE_UPLOAD_READ_FAILED: '读取上传文件失败',
  FILE_UPLOAD_FAILED: '文件上传失败，请稍后重试',
  FILE_DELETE_FAILED: '文件删除失败，请稍后重试',
  FILE_REF_NOT_FOUND: '文件不存在或已被删除',
  FILE_STORAGE_DISABLED: '文件存储服务未启用',
  FILE_URL_GENERATE_FAILED: '生成文件下载地址失败',

  AI_MODEL_NOT_FOUND: 'AI 模型配置不存在或已被删除',
  AI_MODEL_API_KEY_REQUIRED: '请填写 API Key',
  AI_MODEL_STATUS_INVALID: 'AI 模型状态不正确',
  AI_CHAT_TRACE_NOT_FOUND: 'AI 对话记录不存在或已被删除',
  AI_CHAT_PROVIDER_UNSUPPORTED: '暂不支持该 AI 服务商',
  AI_CHAT_MODEL_FAILED: 'AI 模型调用失败，请稍后重试',
  AI_CHAT_MODEL_INTERRUPTED: 'AI 模型调用被中断，请稍后重试',
}

const RAW_CODE_PATTERN = /^[A-Z][A-Z0-9_]+$/
const NETWORK_ERROR_MESSAGES = new Set(['Network Error', 'timeout of 30000ms exceeded'])

export function resolveApiErrorMessage(code?: string, message?: string): string {
  const normalizedCode = normalizeText(code)
  if (normalizedCode && BUSINESS_ERROR_MESSAGES[normalizedCode]) {
    return BUSINESS_ERROR_MESSAGES[normalizedCode]
  }

  const normalizedMessage = normalizeText(message)
  if (normalizedMessage && BUSINESS_ERROR_MESSAGES[normalizedMessage]) {
    return BUSINESS_ERROR_MESSAGES[normalizedMessage]
  }

  if (!normalizedMessage) {
    return '操作失败，请稍后重试'
  }
  if (NETWORK_ERROR_MESSAGES.has(normalizedMessage)) {
    return '网络异常，请稍后重试'
  }
  if (RAW_CODE_PATTERN.test(normalizedMessage)) {
    return '操作失败，请稍后重试'
  }
  if (/^[A-Za-z][\w\s:.,-]+$/.test(normalizedMessage)) {
    return '操作失败，请稍后重试'
  }
  return normalizedMessage
}

function normalizeText(value?: string | null): string {
  return value?.trim() || ''
}
