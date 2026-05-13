import request from './request'
import type {
  ResourceScope,
  ResourceScopeMember,
  ResourceScopeMemberReplacePayload,
  ResourceScopeUpsertPayload,
  SystemUser,
  SystemUserUpsertPayload,
  UserResourceScopeMembershipReplacePayload,
} from '@/types'

export const resourceScopeApi = {
  list: () => request.get<ResourceScope[]>('/v1/system/resource-scopes'),
  detail: (id: string | number) => request.get<ResourceScope>(`/v1/system/resource-scopes/${id}`),
  create: (data: ResourceScopeUpsertPayload) =>
    request.post<ResourceScope>('/v1/system/resource-scopes', data),
  update: (id: string | number, data: ResourceScopeUpsertPayload) =>
    request.put<ResourceScope>(`/v1/system/resource-scopes/${id}`, data),
  delete: (id: string | number) => request.delete<void>(`/v1/system/resource-scopes/${id}`),
  listMembers: (id: string | number) =>
    request.get<ResourceScopeMember[]>(`/v1/system/resource-scopes/${id}/members`),
  listCurrentUserMemberships: () =>
    request.get<ResourceScopeMember[]>('/v1/system/resource-scopes/my-memberships'),
  replaceMembers: (id: string | number, data: ResourceScopeMemberReplacePayload) =>
    request.put<void>(`/v1/system/resource-scopes/${id}/members`, data),
}

export const systemUserApi = {
  list: () => request.get<SystemUser[]>('/v1/system/users'),
  detail: (id: string | number) => request.get<SystemUser>(`/v1/system/users/${id}`),
  create: (data: SystemUserUpsertPayload) => request.post<SystemUser>('/v1/system/users', data),
  update: (id: string | number, data: SystemUserUpsertPayload) =>
    request.put<SystemUser>(`/v1/system/users/${id}`, data),
  delete: (id: string | number) => request.delete<void>(`/v1/system/users/${id}`),
  resetPassword: (id: string | number) => request.post<void>(`/v1/system/users/${id}/reset-password`),
  listResourceScopeMemberships: (id: string | number) =>
    request.get<ResourceScopeMember[]>(`/v1/system/users/${id}/resource-scope-memberships`),
  replaceResourceScopeMemberships: (
    id: string | number,
    data: UserResourceScopeMembershipReplacePayload,
  ) => request.put<void>(`/v1/system/users/${id}/resource-scope-memberships`, data),
}
