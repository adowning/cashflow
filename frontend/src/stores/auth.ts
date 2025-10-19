import
  {
    postApiAuthLogin,
  } from '@/api/gen/sdk.gen'
export const useAuthStore = defineModule('auth', ({
  store,
  defineState,
  onResolve,
}) => {
  const state = defineState({
    currentUserKey: null as string | null,
  });

  const currentUser = store.query(q => q.first({ /* ... */ }));

  //   const requestFetch = postApiAuthLogin

  async function initCurrentUser() {
    try {
      const user = await postApiAuthLogin('/api/auth/me');
      if (user) {
        state.currentUserKey = user.id;
        store.User.writeItem({
          ...user,
          createdAt: new Date(user.createdAt),
        });
      }
      else {
        state.currentUserKey = null;
      }
    }
    catch (e) {
      console.error('Failed to init current user', e);
    }
  }

  onResolve(async () => {
    // Wait for async code to run before
    // the module is considered resolved
    await initCurrentUser();
  });

  return {
    currentUser,
  };
});