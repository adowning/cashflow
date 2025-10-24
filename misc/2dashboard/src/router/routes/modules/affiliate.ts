import { t } from '/@/hooks/web/useI18n';
import { LAYOUT } from '/@/router/constant';
import type { AppRouteModule } from '/@/router/types';

const affiliate: AppRouteModule = {
  path: '/affiliate',
  name: 'Affiliate',
  component: LAYOUT,
  redirect: '/affiliate',
  meta: {
    hideChildrenInMenu: true,
    icon: 'menu-affiliate|svg',
    iconActive: 'menu-affiliate-active|svg',
    title: t('routes.affiliate.name'),
    orderNo: 6,
    hideMenu: true,
    ignoreAuth: true
  },
  children: [
    {
      path: '',
      name: 'AffiliatePage',
      component: () => import('/@/views/pages/affiliate/index.vue'),
      meta: {
    ignoreAuth: true,
        title: t('routes.affiliate.name'),
        hideMenu: true,
      },
    },
  ],
};

export default affiliate;
