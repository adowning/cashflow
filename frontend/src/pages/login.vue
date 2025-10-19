<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import { useUserStore } from '../stores/user'

// const toast = useToast();
const hasError = ref(false);

const fields: AuthFormField[] = [{
  name: 'username',
  type: 'text',
  label: 'username',
  placeholder: 'Enter your username',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password',
  required: true
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox'
}];

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () =>
  {
    // toast.add({ title: 'Google', description: 'Login with Google' });
  }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: () =>
  {
    // toast.add({ title: 'GitHub', description: 'Login with GitHub' });
  }
}];

const schema = z.object({
  username: z.string('Invalid username'),
  password: z.string('Password is required').min(8, 'Must be at least 8 characters')
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>)
{
  console.log('Submitted', payload.data.username);
  try {
    const userStore = useUserStore();
    const response = await fetch('http://localhost:9999/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ username: payload.data.username, password: payload.data.password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Login failed: ${response.statusText}`
      );
    }

    const userData = await response.json();
    console.log(userData);
    // userStore.setCurrentUser(userData.user);
    userStore.user = userData.user;
    userStore.token = userData.accessToken;
  

    console.log('🚀 Casino platform initialized with RStore');


    return userData.user; //|| userData;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Network error: Please check your connection and try again'
      );
    }
    throw error;
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        :providers="providers"
        title="Welcome back!"
        icon="i-lucide-lock"
        @submit="onSubmit"
      >
        <template #description>
          Don't have an account? <ULink
            to="#"
            class="text-primary font-medium"
          >
            Sign up
          </ULink>.
        </template>
        <template #password-hint>
          <ULink
            to="#"
            class="text-primary font-medium"
            tabindex="-1"
          >
            Forgot password?
          </ULink>
        </template>
        <template #validation>
          <UAlert
            v-if="hasError"
            color="error"
            icon="i-lucide-info"
            title="Error signing in"
          />
        </template>
        <template #footer>
          By signing in, you agree to our <ULink
            to="#"
            class="text-primary font-medium"
          >
            Terms of Service
          </ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
