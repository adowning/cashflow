import { t } from '/@/hooks/web/useI18n';
import { LAYOUT } from '/@/router/constant';
import type { AppRouteModule } from '/@/router/types';
const userManager: AppRouteModule = {
  path: '/user-manager',
  name: 'UserManger',
  component: LAYOUT,
  redirect: '/user-manager',
  meta: {
    hideChildrenInMenu: true,
    icon: 'menu-user-manager|svg',
    ignoreAuth: true,
    iconActive: 'menu-user-manager-active|svg',
    title: t('routes.user-manager.name'),
    orderNo: 2,
  },
  children: [
    {
      path: '',
      name: 'UserManagerPage',
      component: () => import('/@/views/pages/user-manager/index.vue'),
      meta: {
        ignoreAuth: true,
        title: t('routes.user-manager.name'),
        hideMenu: true,
      },
    },
    {
      path: 'details/:id',
      name: 'UserManagerDetailsPage',
      component: () => import('/@/views/pages/user-manager-details/index.vue'),
      meta: {
        title: 'Details User',
        ignoreAuth: true,
        hideMenu: false,
      },
    },
  ],
};

export default userManager;
