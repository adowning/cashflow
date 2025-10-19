// import type { CreateClientConfig } from '@/api.gen/client';
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// export const createClientConfig: CreateClientConfig = (config: any) => ({
//   ...config,
//   auth: () => useAuthStore().getAccessToken || localStorage.getItem('token') || '',
//   baseUrl: API_BASE_URL,
// });
import type { CreateClientConfig } from '@/api/gen/client.gen'
import { ApiError, clientConfig } from '@/utils/api'

/**
 * Runtime client configuration for the API client after it generated.
 * The output is in /frontend/src/api.gen/
 *
 * @link https://heyapi.dev/openapi-ts/get-started
 */
export const createClientConfig: CreateClientConfig = (baseConfig) => ({
  ...baseConfig,
  baseUrl: 'http://localhost:6001', //appConfig.backendUrl,
  responseStyle: 'data',
  throwOnError: true,
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await clientConfig.fetch(input, init);

    if (response.ok) return response;

    const json = await response.json();
    throw new ApiError(json);
  },
});
