<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { DashboardGameStats, GameFilters } from '@/types/dashboard'

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

/**
 * Get the appropriate icon for sorting direction.
 */
function getSortIcon(column: string, sortBy: string | undefined, sortOrder: 'asc' | 'desc' | undefined): string {
  if (sortBy !== column) return 'i-lucide-arrow-up-down'
  return sortOrder === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow'
}

const dashboardStore = useDashboardStore()

// Local state for filters and sorting
const searchQuery = ref('')
const sortBy = ref<keyof DashboardGameStats>('totalWagered')
const sortOrder = ref<'asc' | 'desc'>('desc')

/**
 * Computed property for filtered and sorted games.
 */
const filteredAndSortedGames = computed((): DashboardGameStats[] => {
  let filtered = dashboardStore.gameStats

  // Apply search filter
  if (searchQuery.value) {
    filtered = filtered.filter(game =>
      game.gameName.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const aValue = a[sortBy.value]
    const bValue = b[sortBy.value]

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder.value === 'asc' ? aValue - bValue : bValue - aValue
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder.value === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return 0
  })

  return filtered
})

/**
 * Handle sorting when a column header is clicked.
 */
function handleSort(column: keyof DashboardGameStats): void {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'desc'
  }
}

/**
 * Clear search filter.
 */
function clearSearch(): void {
  searchQuery.value = ''
}

/**
 * Initialize the page by fetching game statistics data.
 */
onMounted(async () => {
  await dashboardStore.fetchGameStats()
})
</script>

<template>
  <UDashboardPanel id="games">
    <template #header>
      <UDashboardNavbar title="Game Performance">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Search and Filters Section -->
      <div class="space-y-4 mb-6">
        <div class="flex flex-wrap gap-4 items-end">
          <!-- Search Input -->
          <UFormField label="Search Games" class="flex-1 min-w-64">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Search by game name..."
            >
              <template v-if="searchQuery" #trailing>
                <UButton
                  icon="i-lucide-x"
                  size="xs"
                  color="neutral"
                  variant="link"
                  @click="clearSearch"
                />
              </template>
            </UInput>
          </UFormField>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="dashboardStore.isLoadingGameStats" class="space-y-4">
        <div v-for="i in 6" :key="`loading-${i}`" class="flex items-center gap-4 p-4">
          <USkeleton class="h-4 w-48" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-24" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-16" />
        </div>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="dashboardStore.gameStatsError"
        icon="i-lucide-alert-circle"
        color="error"
        variant="soft"
        title="Error Loading Games"
        :description="dashboardStore.gameStatsError"
        class="mb-6"
      />

      <!-- Games Table -->
      <div v-else-if="filteredAndSortedGames.length > 0" class="space-y-4">
        <div class="bg-elevated/50 rounded-lg overflow-hidden">
          <UTable
            :data="filteredAndSortedGames"
            :loading="dashboardStore.isLoadingGameStats"
            class="table-fixed"
          >
            <template #thead>
              <UThead>
                <UTh class="w-48">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    label="Game Name"
                    :icon="getSortIcon('gameName', sortBy, sortOrder)"
                    class="-mx-2.5"
                    @click="handleSort('gameName')"
                  />
                </UTh>
                <UTh class="w-24">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    label="Spins"
                    :icon="getSortIcon('totalSpins', sortBy, sortOrder)"
                    class="-mx-2.5"
                    @click="handleSort('totalSpins')"
                  />
                </UTh>
                <UTh class="w-28">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    label="Wagered"
                    :icon="getSortIcon('totalWagered', sortBy, sortOrder)"
                    class="-mx-2.5"
                    @click="handleSort('totalWagered')"
                  />
                </UTh>
                <UTh class="w-24">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    label="Won"
                    :icon="getSortIcon('totalWon', sortBy, sortOrder)"
                    class="-mx-2.5"
                    @click="handleSort('totalWon')"
                  />
                </UTh>
                <UTh class="w-20">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    label="Win/Loss Ratio"
                    :icon="getSortIcon('winLossRatio', sortBy, sortOrder)"
                    class="-mx-2.5"
                    @click="handleSort('winLossRatio')"
                  />
                </UTh>
              </UThead>
            </template>

            <template #tbody>
              <UTr v-for="game in filteredAndSortedGames" :key="game.gameId">
                <UTd class="font-medium text-highlighted">
                  {{ game.gameName }}
                </UTd>
                <UTd class="text-muted">
                  {{ formatNumber(game.totalSpins) }}
                </UTd>
                <UTd class="font-semibold text-highlighted">
                  {{ formatNumber(game.totalWagered) }}
                </UTd>
                <UTd class="font-semibold text-success">
                  {{ formatNumber(game.totalWon) }}
                </UTd>
                <UTd>
                  <UBadge
                    :color="getRatioBadgeColor(game.winLossRatio)"
                    variant="subtle"
                  >
                    {{ formatWinLossRatio(game.winLossRatio) }}
                  </UBadge>
                </UTd>
              </UTr>
            </template>
          </UTable>
        </div>

        <!-- Results Summary -->
        <div class="text-sm text-muted">
          Showing {{ filteredAndSortedGames.length }} of {{ dashboardStore.gameStats.length }} games
          {{ searchQuery ? ` matching "${searchQuery}"` : '' }}
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-gamepad-2" class="size-16 text-muted mx-auto mb-4" />
        <p class="text-lg font-medium text-highlighted mb-2">
          {{ searchQuery ? 'No games found' : 'No game data available' }}
        </p>
        <p class="text-muted mb-4">
          {{ searchQuery
             ? 'Try adjusting your search terms to find more games.'
             : 'No game statistics have been recorded yet.' }}
        </p>
        <UButton
          v-if="searchQuery"
          label="Clear Search"
          color="neutral"
          variant="outline"
          @click="clearSearch"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>