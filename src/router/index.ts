import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    redirect: '/workbench/dashboard',
    children: [
      // ========== 内控工作台 ==========
      {
        path: 'workbench/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/workbench/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'Monitor' },
      },
      {
        path: 'workbench/alerts',
        name: 'Alerts',
        component: () => import('@/views/workbench/alerts/index.vue'),
        meta: { title: '告警中心', icon: 'Bell' },
      },
      {
        path: 'workbench/logs',
        name: 'Logs',
        component: () => import('@/views/workbench/logs/index.vue'),
        meta: { title: '日志中心', icon: 'Document' },
      },
      // ========== 资源管理 ==========
      {
        path: 'resource/standards',
        name: 'Standards',
        component: () => import('@/views/resource/standards/index.vue'),
        meta: { title: '标准管理', icon: 'Reading' },
      },
      {
        path: 'resource/checklists',
        name: 'Checklists',
        component: () => import('@/views/resource/checklists/index.vue'),
        meta: { title: '内控清单', icon: 'List' },
      },
      {
        path: 'resource/archives',
        name: 'Archives',
        component: () => import('@/views/resource/archives/index.vue'),
        meta: { title: '档案管理', icon: 'FolderChecked' },
      },
      {
        path: 'resource/personnel',
        name: 'Personnel',
        component: () => import('@/views/resource/personnel/index.vue'),
        meta: { title: '人员管理', icon: 'UserFilled' },
      },
      // ========== 计划管控 ==========
      {
        path: 'plan/create',
        name: 'PlanCreate',
        component: () => import('@/views/plan/create/index.vue'),
        meta: { title: '计划编制', icon: 'EditPen' },
      },
      {
        path: 'plan/list',
        name: 'PlanList',
        component: () => import('@/views/plan/list/index.vue'),
        meta: { title: '计划管理', icon: 'Calendar' },
      },
      {
        path: 'plan/overview',
        name: 'PlanOverview',
        component: () => import('@/views/plan/overview/index.vue'),
        meta: { title: '计划一览', icon: 'DataBoard' },
      },
      {
        path: 'plan/detail/:id',
        name: 'PlanDetail',
        component: () => import('@/views/plan/detail/index.vue'),
        meta: { title: '计划详情', icon: 'Document', hidden: true },
      },
      // ========== 项目管理 ==========
      {
        path: 'project/list',
        name: 'ProjectList',
        component: () => import('@/views/project/list/index.vue'),
        meta: { title: '项目列表', icon: 'OfficeBuilding' },
      },
      {
        path: 'project/create',
        name: 'ProjectCreate',
        component: () => import('@/views/project/create/index.vue'),
        meta: { title: '项目启动', icon: 'Plus' },
      },
      {
        path: 'project/detail/:id',
        name: 'ProjectDetail',
        component: () => import('@/views/project/detail/index.vue'),
        meta: { title: '项目详情', icon: 'Tickets', hidden: true },
      },
      {
        path: 'project/task/:id',
        name: 'TaskDetail',
        component: () => import('@/views/project/task/index.vue'),
        meta: { title: '任务详情', icon: 'Finished', hidden: true },
      },
      // ========== 整改管理 ==========
      {
        path: 'rectification/list',
        name: 'RectificationList',
        component: () => import('@/views/rectification/list/index.vue'),
        meta: { title: '整改单列表', icon: 'SetUp' },
      },
      {
        path: 'rectification/create',
        name: 'RectificationCreate',
        component: () => import('@/views/rectification/create/index.vue'),
        meta: { title: '创建整改单', icon: 'CirclePlus' },
      },
      {
        path: 'rectification/detail/:id',
        name: 'RectificationDetail',
        component: () => import('@/views/rectification/detail/index.vue'),
        meta: { title: '整改详情', icon: 'Document', hidden: true },
      },
      // ========== 智能内控 ==========
      {
        path: 'smart/analysis',
        name: 'Analysis',
        component: () => import('@/views/smart/analysis/index.vue'),
        meta: { title: '统计分析', icon: 'DataAnalysis' },
      },
      {
        path: 'smart/rules',
        name: 'Rules',
        component: () => import('@/views/smart/rules/index.vue'),
        meta: { title: '规则库', icon: 'Operation' },
      },
      {
        path: 'smart/models',
        name: 'Models',
        component: () => import('@/views/smart/models/index.vue'),
        meta: { title: '模型库', icon: 'MagicStick' },
      },
      {
        path: 'smart/tools',
        name: 'Tools',
        component: () => import('@/views/smart/tools/index.vue'),
        meta: { title: '工具库', icon: 'Suitcase' },
      },
      // ========== 个人中心 ==========
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', icon: 'User', hidden: true },
      },
    ],
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  NProgress.start()
  const token = localStorage.getItem('iris_token')
  document.title = `${to.meta.title || 'IRIS'} - IRIS 内控管理平台`

  if (to.meta.public) {
    next()
  } else if (!token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
