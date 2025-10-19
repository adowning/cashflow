<!-- eslint-disable no-console -->
<script setup lang="ts">
import { useHead } from '@frontend/composables'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useStorage } from '@vueuse/core'
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useUserStore } from './stores/user'

const toast = useToast();
const route = useRoute();
useHead({
  title: () => 'title',
  link: [{
    rel: 'preconnect',
    href: new URL(import.meta.env.VITE_API_URL).origin,
    crossorigin: '',
  }],
});

const open = ref( false );
// const hasError = ref( false );

const links = [ [ {
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false;
  }
}, {
  label: 'Inbox',
  icon: 'i-lucide-inbox',
  to: '/inbox',
  badge: '4',
  onSelect: () => {
    open.value = false;
  }
}, {
  label: 'Customers',
  icon: 'i-lucide-users',
  to: '/customers',
  onSelect: () => {
    open.value = false;
  }
}, {
  label: 'Settings',
  to: '/settings',
  icon: 'i-lucide-settings',
  defaultOpen: true,
  type: 'trigger',
  children: [ {
    label: 'General',
    to: '/settings',
    exact: true,
    onSelect: () => {
      open.value = false;
    }
  }, {
    label: 'Members',
    to: '/settings/members',
    onSelect: () => {
      open.value = false;
    }
  }, {
    label: 'Notifications',
    to: '/settings/notifications',
    onSelect: () => {
      open.value = false;
    }
  }, {
    label: 'Security',
    to: '/settings/security',
    onSelect: () => {
      open.value = false;
    }
  } ]
} ], [ {
  label: 'Feedback',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-templates/dashboard-vue',
  target: '_blank'
}, {
  label: 'Help & Support',
  icon: 'i-lucide-info',
  to: 'https://github.com/nuxt/ui',
  target: '_blank'
} ] ] satisfies NavigationMenuItem[][];

const groups = computed( () => [ {
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [ {
    id: 'source',
    label: 'View page source',
    icon: 'simple-icons:github',
    to: `https://github.com/nuxt-ui-templates/dashboard-vue/blob/main/src/pages${ route.path === '/' ? '/index' : route.path }.vue`,
    target: '_blank'
  } ]
} ] );

const cookie = useStorage( 'cookie-consent', 'pending' );
if ( cookie.value !== 'accepted' ) {
  toast.add( {
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [ {
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted';
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    } ]
  } );
}


// const fields: AuthFormField[] = [ {
//   name: 'username',
//   type: 'text',
//   label: 'Username',
//   placeholder: 'Enter your username',
//   required: true
// }, {
//   name: 'password',
//   label: 'Password',
//   type: 'password',
//   placeholder: 'Enter your password',
//   required: true
// }, {
//   name: 'remember',
//   label: 'Remember me',
//   type: 'checkbox'
// } ];

// const providers = [ {
//   label: 'Google',
//   icon: 'i-simple-icons-google',
//   onClick: () => {
//     toast.add( { title: 'Google', description: 'Login with Google' } );
//   }
// }, {
//   label: 'GitHub',
//   icon: 'i-simple-icons-github',
//   onClick: () => {
//     toast.add( { title: 'GitHub', description: 'Login with GitHub' } );
//   }
// } ];



// const schema = z.object( {
//   username: z.string( 'Invalid email' ),
//   password: z.string( 'Password is required' ).min( 8, 'Must be at least 8 characters' )
// } );

// type Schema = z.output<typeof schema>;

const userStore = useUserStore();

// Watch the user from the store reactively
watch( () => userStore.user, ( newUser ) => {
  if ( newUser !== null ) {
    // show.value = true;
    open.value = false;
  } else {
    // show.value = false;
    open.value = true;
  }
}, { immediate: true } );


// async function onSubmit( payload: FormSubmitEvent<Schema> ) {
//   console.log( 'Submitted', payload.data.username );
//   try {
//     const userStore = useUserStore();
//     const response = await fetch( '/api/auth/sign-in/username', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include', // Include cookies
//       body: JSON.stringify( { username: payload.data.username, password: payload.data.password } ),
//     } );

//     if ( !response.ok ) {
//       const errorData = await response.json().catch( () => ( {} ) );
//       throw new Error(
//         errorData.message || `Login failed: ${ response.statusText }`
//       );
//     }

//     const userData = await response.json();
//     console.log(userData.data.user);
//     // userStore.setCurrentUser(userData.user);
//     userStore.user = userData.data.user;
//     userStore.token = userData.data.token;


//     console.log( '🚀 Casino platform initialized with RStore' );
 

//     return userData.user; //|| userData;
//   } catch ( error ) {
//     if ( error instanceof TypeError && error.message.includes( 'fetch' ) ) {
//       throw new Error(
//         'Network error: Please check your connection and try again'
//       );
//     }
//     throw error;
//   }
// }

onBeforeMount(  () => {
  const { user } = useUserStore();
  if ( !user ) {
    console.log( 'User loaded in App:' );
    // show.value = false;
    open.value = true;
    // await useUserStore().fetchCurrentUser().catch((err) =>
    // {
    //   console.error('Failed to load user:', err)
    //   // router.push('/login')      
    //   show.value = false
    //   open.value = true

    // })
    if ( user !== null ) {
      // show.value = true;
      open.value = false;
    } else {
      open.value = false;
      open.value = true;

    }
  }
} );

// const { user, signUp, signIn, signOut } = useAuth();

// const email = ref('');
// const password = ref('');
</script>

<template>
  <!-- <Suspense> -->
  <UApp>
    <!-- <UDashboardGroup
      unit="rem"
      storage="local"
    > -->
    <!-- <UDashboardSidebar
          id="default"
          v-model:open="open"
          collapsible
          resizable
          class="bg-elevated/25"
          :ui=" { footer: 'lg:border-t lg:border-default' } "
        >
          <template #header=" { collapsed } ">
            <TeamsMenu :collapsed=" collapsed " />
          </template>

          <template #default=" { collapsed } ">
            <UDashboardSearchButton
              :collapsed=" collapsed "
              class="bg-transparent ring-default"
            />

            <UNavigationMenu
              :collapsed=" collapsed "
              :items=" links[ 0 ] "
              orientation="vertical"
              tooltip
              popover
            />

            <UNavigationMenu
              :collapsed=" collapsed "
              :items=" links[ 1 ] "
              orientation="vertical"
              tooltip
              class="mt-auto"
            />
          </template>

          <template #footer=" { collapsed } ">
            <UserMenu :collapsed=" collapsed " />
          </template>
        </UDashboardSidebar> -->

    <!-- <UDashboardSearch :groups=" groups " /> -->

    <RouterView />

    <!-- <NotificationsSlideover /> -->
    <!-- </UDashboardGroup> -->
  </UApp>
  <!-- </Suspense> -->
</template>
