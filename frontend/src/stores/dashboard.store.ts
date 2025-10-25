import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
	getApiDashboardKpiSummary,
	getApiDashboardTransactions,
	getApiDashboardGameStats,
	getApiDashboardPlayers,
} from "@/api/gen/sdk.gen";
import type {
	DashboardKpiSummary,
	DashboardTransaction,
	DashboardGameStats,
	DashboardPlayer,
	TransactionFilters,
	GameFilters,
	PlayerFilters,
	DateRange,
	ChartDataPoint,
	PaginatedTransactions,
} from "@/types/dashboard";

/**
 * Centralized store for dashboard data management.
 * Handles fetching, caching, and providing dashboard data to components.
 */
export const useDashboardStore = defineStore("dashboard", () => {
	const toast = useToast();

	// Loading states
	const isLoadingKpi = ref(false);
	const isLoadingTransactions = ref(false);
	const isLoadingGameStats = ref(false);
	const isLoadingPlayers = ref(false);

	// Error states
	const kpiError = ref<string | null>(null);
	const transactionsError = ref<string | null>(null);
	const gameStatsError = ref<string | null>(null);
	const playersError = ref<string | null>(null);

	// Data state
	const kpiData = ref<DashboardKpiSummary | null>(null);
	const transactions = ref<DashboardTransaction[]>([]);
	const gameStats = ref<DashboardGameStats[]>([]);
	const players = ref<DashboardPlayer[]>([]);
	const transactionsPagination = ref<
		PaginatedTransactions["pagination"] | null
	>(null);

	// Filter state
	const transactionFilters = ref<TransactionFilters>({
		page: 1,
		pageSize: 10,
	});
	const gameFilters = ref<GameFilters>({});
	const playerFilters = ref<PlayerFilters>({
		page: 1,
		pageSize: 10,
	});

	// Date range for charts
	const chartDateRange = ref<DateRange>({
		start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
		end: new Date(),
	});

	/**
	 * Computed property to check if any data is currently loading.
	 */
	const isLoading = computed(
		() =>
			isLoadingKpi.value ||
			isLoadingTransactions.value ||
			isLoadingGameStats.value ||
			isLoadingPlayers.value,
	);

	/**
	 * Computed property to check if there are any errors.
	 */
	const hasErrors = computed(() =>
		Boolean(
			kpiError.value ||
				transactionsError.value ||
				gameStatsError.value ||
				playersError.value,
		),
	);

	/**
	 * Fetch KPI summary data from the API.
	 * Updates the kpiData state and handles errors gracefully.
	 */
	const fetchKpiSummary = async (): Promise<void> => {
		isLoadingKpi.value = true;
		kpiError.value = null;

		// try {
		// 	const response = await getApiDashboardKpiSummary();
		// 	kpiData.value = response.data;
		// } catch (error) {
		// 	kpiError.value = "Failed to load KPI summary data";
		// 	toast.add({
		// 		title: "Error",
		// 		description: "Failed to load KPI summary data. Please try again.",
		// 		icon: "i-lucide-alert-circle",
		// 		color: "error",
		// 	});
		// 	console.error("Error fetching KPI summary:", error);
		// } finally {
		// 	isLoadingKpi.value = false;
		// }
	};

	/**
	 * Fetch transactions data with optional filters.
	 * Updates the transactions state and pagination metadata.
	 */
	const fetchTransactions = async (
		filters?: Partial<TransactionFilters>,
	): Promise<void> => {
		if (filters) {
			transactionFilters.value = { ...transactionFilters.value, ...filters };
		}

		isLoadingTransactions.value = true;
		transactionsError.value = null;

		try {
			const response = await getApiDashboardTransactions({
				query: {
					page: transactionFilters.value.page?.toString(),
					pageSize: transactionFilters.value.pageSize?.toString(),
					userId: transactionFilters.value.userId,
					status: transactionFilters.value.status,
					startDate: transactionFilters.value.startDate,
					endDate: transactionFilters.value.endDate,
				},
			});

			transactions.value = response.data.data;
			transactionsPagination.value = response.data.pagination;
		} catch (error) {
			transactionsError.value = "Failed to load transactions data";
			toast.add({
				title: "Error",
				description: "Failed to load transactions data. Please try again.",
				icon: "i-lucide-alert-circle",
				color: "error",
			});
			console.error("Error fetching transactions:", error);
		} finally {
			isLoadingTransactions.value = false;
		}
	};

	/**
	 * Fetch game statistics data.
	 * Updates the gameStats state for the top games leaderboard.
	 */
	const fetchGameStats = async (): Promise<void> => {
		isLoadingGameStats.value = true;
		gameStatsError.value = null;

		// try {
		// 	const response = await getApiDashboardGameStats();
		// 	console.log(response);
		// 	gameStats.value = response.data.data;
		// } catch (error) {
		// 	gameStatsError.value = "Failed to load game statistics";
		// 	toast.add({
		// 		title: "Error",
		// 		description: "Failed to load game statistics. Please try again.",
		// 		icon: "i-lucide-alert-circle",
		// 		color: "error",
		// 	});
		// 	console.error("Error fetching game stats:", error);
		// } finally {
		// 	isLoadingGameStats.value = false;
		// }
	};

	/**
	 * Fetch players data with optional filters.
	 * Updates the players state for the customers page.
	 */
	const fetchPlayers = async (
		filters?: Partial<PlayerFilters>,
	): Promise<void> => {
		if (filters) {
			playerFilters.value = { ...playerFilters.value, ...filters };
		}
		return
		// api.users.$get({
		// 	query:{ 
		// 		page:0,
		// 		perPage: 10
		// 	}})
	// 		body:{
	// 			   title: 'Hello',
    // body: 'Hono is a cool project',
	// 		}
		// })
		isLoadingPlayers.value = true;
		playersError.value = null;

		try {
			const response = await getApiDashboardPlayers({
				query: {
					page: playerFilters.value.page?.toString(),
					pageSize: playerFilters.value.pageSize?.toString(),
				},
			});

			players.value = response.data.data;
			// Note: API response structure may need adjustment based on actual response
		} catch (error) {
			playersError.value = "Failed to load players data";
			toast.add({
				title: "Error",
				description: "Failed to load players data. Please try again.",
				icon: "i-lucide-alert-circle",
				color: "error",
			});
			console.error("Error fetching players:", error);
		} finally {
			isLoadingPlayers.value = false;
		}
	};

	/**
	 * Update transaction filters and refetch data.
	 */
	const updateTransactionFilters = async (
		filters: Partial<TransactionFilters>,
	): Promise<void> => {
		await fetchTransactions(filters);
	};

	/**
	 * Update player filters and refetch data.
	 */
	const updatePlayerFilters = async (
		filters: Partial<PlayerFilters>,
	): Promise<void> => {
		await fetchPlayers(filters);
	};

	/**
	 * Update chart date range and refetch transaction data for charts.
	 */
	const updateChartDateRange = async (range: DateRange): Promise<void> => {
		chartDateRange.value = range;
		// Refetch transactions with new date range for chart data
		await fetchTransactions({
			startDate: range.start.toISOString(),
			endDate: range.end.toISOString(),
		});
	};

	/**
	 * Get chart data formatted for the revenue chart component.
	 * Aggregates transaction data by date for visualization.
	 */
	const getChartData = computed((): ChartDataPoint[] => {
		// Group transactions by date and sum amounts
		const dataMap = new Map<string, number>();

		transactions.value.forEach((transaction) => {
			if (transaction.createdAt) {
				const date = new Date(transaction.createdAt).toDateString();
				const currentAmount = dataMap.get(date) || 0;
				dataMap.set(date, currentAmount + transaction.amount);
			}
		});

		// Convert to array and sort by date
		return Array.from(dataMap.entries())
			.map(([date, amount]) => ({
				date: new Date(date),
				amount,
			}))
			.sort((a, b) => a.date.getTime() - b.date.getTime());
	});

	/**
	 * Get top 5 games by total wagered amount.
	 */
	const getTopGames = computed((): DashboardGameStats[] => {
		return gameStats.value
			.sort((a, b) => b.totalWagered - a.totalWagered)
			.slice(0, 5);
	});

	/**
	 * Initialize the dashboard by fetching all necessary data.
	 * Called when the dashboard is first loaded.
	 */
	const initializeDashboard = async (): Promise<void> => {
		await Promise.allSettled([
			fetchKpiSummary(),
			fetchTransactions(),
			fetchGameStats(),
			fetchPlayers(),
		]);
	};

	/**
	 * Clear all errors and reset error states.
	 */
	const clearErrors = (): void => {
		kpiError.value = null;
		transactionsError.value = null;
		gameStatsError.value = null;
		playersError.value = null;
	};

	/**
	 * Reset all data and filters to initial state.
	 */
	const reset = (): void => {
		kpiData.value = null;
		transactions.value = [];
		gameStats.value = [];
		players.value = [];
		transactionsPagination.value = null;
		clearErrors();
	};

	return {
		// State
		isLoadingKpi,
		isLoadingTransactions,
		isLoadingGameStats,
		isLoadingPlayers,
		isLoading,
		kpiError,
		transactionsError,
		gameStatsError,
		playersError,
		hasErrors,
		kpiData,
		transactions,
		gameStats,
		players,
		transactionsPagination,
		transactionFilters,
		gameFilters,
		playerFilters,
		chartDateRange,

		// Computed
		getChartData,
		getTopGames,

		// Actions
		fetchKpiSummary,
		fetchTransactions,
		fetchGameStats,
		fetchPlayers,
		updateTransactionFilters,
		updatePlayerFilters,
		updateChartDateRange,
		initializeDashboard,
		clearErrors,
		reset,
	};
});
