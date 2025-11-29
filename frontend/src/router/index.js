import { createRouter, createWebHistory } from 'vue-router'
import EntryView from '../views/EntryView.vue'
import StageView from '../views/StageView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'entry',
      component: EntryView
    },
    {
      path: '/stage',
      name: 'stage',
      component: StageView
    }
  ]
})

export default router
