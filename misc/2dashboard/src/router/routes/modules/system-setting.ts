import { t } from '/@/hooks/web/useI18n';
import { LAYOUT } from '/@/router/constant';
import type { AppRouteModule } from '/@/router/types';

const systemSetting: AppRouteModule = {
  path: '/system-setting',
  name: 'SystemSetting',
  component: LAYOUT,
  redirect: '/system-setting',
  meta: {
    hideChildrenInMenu: true,
    icon: 'menu-setting|svg',
    iconActive: 'menu-setting-active|svg',
    ignoreAuth: true,
    title: t('routes.system-setting.name'),
    orderNo: 7,
  },
  children: [
    {
      path: '',
      name: 'SystemSettingPage',
      component: () => import('/@/views/pages/setting-system/index.vue'),
      meta: {
    ignoreAuth: true,
        title: t('routes.system-setting.name'),
        hideMenu: true,
      },
    },
  ],
};

export default systemSetting;
