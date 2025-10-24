import './assets/css/main.css'

import ui from '@nuxt/ui/vue-plugin'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { ViteSSG } from 'vite-ssg/single-page'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import LoginPage from './pages/login.vue'


export const createApp = ViteSSG(App, async ({ app }) => {
  const store = createPinia();
  app.use(store);
  app.use(
    createRouter({
      routes: [
        { path: '/', component: () => import('./pages/index.vue') },
        { path: '/login', component: () => LoginPage },
        {
          path: '/rstore-example',
          component: () => import('./pages/rstore-example.vue'),
        },
        { path: '/inbox', component: () => import('./pages/inbox.vue') },
        { path: '/customers', component: () => import('./pages/customers.vue') },
        {
          path: '/settings',
          component: () => import('./pages/settings.vue'),
          children: [
            { path: '', component: () => import('./pages/settings/index.vue') },
            {
              path: 'members',
              component: () => import('./pages/settings/members.vue'),
            },
            {
              path: 'notifications',
              component: () => import('./pages/settings/notifications.vue'),
            },
            {
              path: 'security',
              component: () => import('./pages/settings/security.vue'),
            },
          ],
        },
      ],
      history: createWebHistory(),
    }),
  );

  app.use(ui);

  // app.mount('#app');



  app.use(VueQueryPlugin, {
    enableDevtoolsV6Plugin: true,
  });
});
