/* eslint-disable prettier/prettier */
import { defineStore } from 'pinia';
import { h } from 'vue';
import { RouteRecordRaw } from 'vue-router';
import { masterDataStore } from './masterData';
import type { ErrorMessageMode } from '/#/axios';
import type { UserInfo } from '/#/store';
import { GetUserInfoModel, LoginParams } from '/@/api/sys/model/userModel';
import { authClient, getCurrentUser } from '/@/client/auth';
import { ROLES_KEY, TOKEN_KEY, USER_INFO_KEY } from '/@/enums/cacheEnum';
import { PageEnum } from '/@/enums/pageEnum';
import { RoleEnum } from '/@/enums/roleEnum';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { PAGE_NOT_FOUND_ROUTE } from '/@/router/routes/basic';
import { store } from '/@/store';
import { usePermissionStore } from '/@/store/modules/permission';
import { getAuthCache, setAuthCache } from '/@/utils/auth';
interface UserState
{
  userInfo: Nullable<UserInfo>;
  token?: string;
  roleList: RoleEnum[];
  sessionTimeout?: boolean;
  lastUpdateTime: number;
}

export const useUserStore = defineStore({
  id: 'app-user',
  state: (): UserState => ({
    // user info
    userInfo: null,
    // token
    token: undefined,
    // roleList
    roleList: [],
    // Whether the login expired
    sessionTimeout: false,
    // Last fetch time
    lastUpdateTime: 0,
  }),
  getters: {
    getUserInfo(): any
    {
      return this.userInfo || getAuthCache<UserInfo>(USER_INFO_KEY) || {};
    },
    getToken(): string
    {
      return this.token || getAuthCache<string>(TOKEN_KEY);
    },
    getRoleList(): RoleEnum[]
    {
      return this.roleList.length > 0 ? this.roleList : getAuthCache<RoleEnum[]>(ROLES_KEY);
    },
    getSessionTimeout(): boolean
    {
      return !!this.sessionTimeout;
    },
    getLastUpdateTime(): number
    {
      return this.lastUpdateTime;
    },
  },
  actions: {
    setToken(info: string | undefined)
    {
      this.token = info ? info : ''; // for null or undefined value
      setAuthCache(TOKEN_KEY, info);
    },
    setRoleList(roleList: RoleEnum[])
    {
      this.roleList = roleList;
      setAuthCache(ROLES_KEY, roleList);
    },
    setUserInfo(info: any | null)
    {
      this.userInfo = info;
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(USER_INFO_KEY, info);
    },
    setSessionTimeout(flag: boolean)
    {
      this.sessionTimeout = flag;
    },
    resetState()
    {
      this.userInfo = null;
      this.token = '';
      this.roleList = [];
      this.sessionTimeout = false;
    },
    /**
     * @description: login
     */
    async login(
      params: LoginParams & {
        goHome?: boolean;
        mode?: ErrorMessageMode;
      },
    ): Promise<GetUserInfoModel | null>
    {
      try {
        const { goHome = true, mode, ...loginParams } = params;
        // const data = await loginApi(loginParams, mode);
        console.log(mode);
        // const { data } = await authClient.signIn.username(loginParams);
        const { data } = await authClient.signIn.username(loginParams, {
          onSuccess: async (ctx) =>
          {
            const authToken = ctx.response.headers.get("set-auth-token") // get the token from the response headers
            // Store the token securely (e.g., in localStorage)
            if (authToken) {
              localStorage.setItem("bearer_token", authToken);
            } else {
              const authToken = await ctx.response.body.json()
              if (authToken) {
                localStorage.setItem("bearer_token", authToken);
              }
            }
            console.log(authToken);
            if (data == null) return null;
            const { token } = data;
            this.setToken(token);
            return this.afterLoginAction(goHome);
          }
        });

      } catch (error) {
        return Promise.reject(error);
      }
    },
    async afterLoginAction(goHome?: boolean): Promise<GetUserInfoModel | null>
    {
      if (!this.getToken) return null;
      const userInfo = await this.getUserInfoAction();
      const sessionTimeout = this.sessionTimeout;
      if (sessionTimeout) {
        this.setSessionTimeout(false);
      } else {
        const permissionStore = usePermissionStore();
        if (!permissionStore.isDynamicAddedRoute) {
          const routes = await permissionStore.buildRoutesAction();
          routes.forEach((route) =>
          {
            router.addRoute(route as unknown as RouteRecordRaw);
          });
          router.addRoute(PAGE_NOT_FOUND_ROUTE as unknown as RouteRecordRaw);
          permissionStore.setDynamicAddedRoute(true);
        }
        goHome && (await router.replace(userInfo?.homePath || PageEnum.BASE_HOME));
      }
      return userInfo;
    },
    async getUserInfoAction(): Promise<UserInfo | null | any>
    {
      if (!this.getToken) return null;
      // const { data } = await getUserInfo();
      const { value } = getCurrentUser();
      console.log(value);
      this.setRoleList([]);
      this.setUserInfo(value);
      masterDataStore().setListToken();
      masterDataStore().setListAdmin();
      masterDataStore().setListGame();
      masterDataStore().setListRank();
      return value;
    },
    /**
     * @description: logout
     */
    async logout(goLogin = false)
    {
      this.setToken(undefined);
      this.setSessionTimeout(false);
      this.setUserInfo(null);
      goLogin && router.push(PageEnum.BASE_LOGIN);
    },

    /**
     * @description: Confirm before logging out
     */
    confirmLoginOut()
    {
      const { createConfirm } = useMessage();
      const { t } = useI18n();
      createConfirm({
        iconType: 'warning',
        title: () => h('span', t('sys.app.logoutTip')),
        content: () => h('span', t('sys.app.logoutMessage')),
        onOk: async () =>
        {
          await this.logout(true);
        },
      });
    },
  },
});

// Need to be used outside the setup
export function useUserStoreWithOut()
{
  return useUserStore(store);
}
