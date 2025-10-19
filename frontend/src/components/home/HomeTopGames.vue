<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { DashboardGameStats } from '@/types/dashboard'

/**
 * Format large numbers with appropriate suffixes for display.
 */
function formatNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

/**
 * Format the win/loss ratio as a percentage.
 */
function formatWinLossRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}

/**
 * Get the appropriate color for the win/loss ratio badge.
 */
function getRatioBadgeColor(ratio: number): string {
  if (ratio >= 0.8) return 'success'
  if (ratio >= 0.6) return 'warning'
  return 'error'
}

const dashboardStore = useDashboardStore()

/**
 * Get the top 5 games sorted by total wagered amount.
 */
const topGames = computed((): DashboardGameStats[] => {
  return dashboardStore.getTopGames
})

/**
 * Check if game stats are currently loading.
 */
const isLoading = computed(() => dashboardStore.isLoadingGameStats)

/**
 * Check if there's an error loading game stats.
 */
const hasError = computed(() => Boolean(dashboardStore.gameStatsError))

/**
 * Fetch game statistics when the component is mounted.
 */
onMounted(async () => {
  await dashboardStore.fetchGameStats()
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">
            Top Games
          </p>
          <p class="text-lg font-semibold text-highlighted">
            Performance Leaderboard
          </p>
        </div>
        <UIcon name="i-lucide-trophy" class="size-6 text-primary" />
      </div>
    </template>

    <!-- Loading state -->
    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="i in 5"
        :key="`skeleton-${i}`"
        class="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
      >
        <USkeleton class="size-10 rounded-full flex-shrink-0" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-3 w-24" />
        </div>
        <div class="text-right space-y-2">
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-3 w-12" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="text-center py-8">
      <UIcon name="i-lucide-alert-circle" class="size-12 text-error mx-auto mb-4" />
      <p class="text-muted">
        Failed to load game statistics
      </p>
    </div>

    <!-- Games list -->
    <div v-else-if="topGames.length > 0" class="space-y-3">
      <div
        v-for="(game, index) in topGames"
        :key="game.gameId"
        class="flex items-center gap-4 p-3 rounded-lg bg-elevated/30 hover:bg-elevated/50 transition-colors"
      >
        <!-- Rank indicator -->
        <div class="flex-shrink-0">
          <div
            :class="[
              'size-10 rounded-full flex items-center justify-center text-sm font-bold',
              index === 0 ? 'bg-primary text-primary-foreground' :
              index === 1 ? 'bg-secondary text-secondary-foreground' :
              index === 2 ? 'bg-warning text-warning-foreground' :
              'bg-muted text-muted-foreground'
            ]"
          >
            {{ index + 1 }}
          </div>
        </div>

        <!-- Game info -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-highlighted truncate">
            {{ game.gameName }}
          </p>
          <p class="text-sm text-muted">
            {{ formatNumber(game.totalSpins) }} spins
          </p>
        </div>

        <!-- Stats -->
        <div class="text-right space-y-1">
          <p class="font-semibold text-highlighted">
            {{ formatNumber(game.totalWagered) }}
          </p>
          <UBadge
            :color="getRatioBadgeColor(game.winLossRatio)"
            variant="subtle"
            class="text-xs"
          >
            {{ formatWinLossRatio(game.winLossRatio) }}
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <UIcon name="i-lucide-gamepad-2" class="size-12 text-muted mx-auto mb-4" />
      <p class="text-muted">
        No game data available
      </p>
    </div>
  </UCard>
</template>