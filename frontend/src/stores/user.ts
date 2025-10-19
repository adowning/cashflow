/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
// import type { AgentStats, User } from "@affiliate/schemas";

import * as api from "@/api/gen/sdk.gen";
import type { User } from "@/types/casino";
import { defineStore } from "pinia";
import { ref } from "vue";
/**
 * try {
   // Setup RStore with casino platform configuration
   await setupRstore(app, {
     enableRealtime: true,
     enableCaching: true,
     enableOptimisticUpdates: true,
     apiBaseUrl: '/api',
     websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:9999/ws/rstore",
   });
 
   console.log('🚀 Casino platform initialized with RStore');
   app.mount("#app");
 } catch (error) {
   console.error('❌ Failed to initialize casino platform:', error);
   // Mount app anyway for graceful degradation
   app.mount("#app");
 }
 */
export const useUserStore = defineStore("user", () => {
	const user = ref<User | null>(null);
	const token = ref<string | null>(null);
	// const stats = ref<AgentStats | null>(null);
	const loading = ref(false);
	const error = ref<string | null>(null);

	async function setToken(_token: string) {
		token.value = _token;
	}
	async function setCurrentUser(_user: User) {
		loading.value = true;
		error.value = null;

		try {
			// const response = await api.get<User>("/user/me");
			user.value = _user;
			// return response.data;
		} catch (err: any) {
			error.value = err.response?.data?.error || "Failed to fetch user";
			throw err;
		} finally {
			loading.value = false;
		}
	}

	async function fetchCurrentUser() {
		loading.value = true;
		error.value = null;

		try {
			const response = await api.getCurrentUser(); //get<User>("/user/me");
			user.value = response.user;
			return response;
		} catch (err: any) {
			error.value = err.response?.data?.error || "Failed to fetch user";
			throw err;
		} finally {
			loading.value = false;
		}
	}

	async function fetchStats() {
		loading.value = true;
		error.value = null;

		// try {
		// 	// const response = await api.get<AgentStats>("/user/stats");
		// 	// stats.value = response.data;
		// 	// return response.data;
		// } catch (err: any) {
		// 	error.value = err.response?.data?.error || "Failed to fetch stats";
		// 	throw err;
		// } finally {
		// 	loading.value = false;
		// }
	}

	return {
		user,
		// stats,
		setCurrentUser,
		loading,
		error,
		fetchCurrentUser,
		fetchStats,
		token,
		setToken,
	};
});
