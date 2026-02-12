import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

export { useUserStore } from './modules/user'
export { useAppStore } from './modules/app'
