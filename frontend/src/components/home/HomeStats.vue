<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { Period, Range, Stat } from '@/types'

const props = defineProps<{
  period: Period
  range: Range
}>()

/**
 * Format currency values for display in the UI.
 */
function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

/**
 * Format large numbers with appropriate suffixes (K, M, B).
 */
function formatNumber(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return formatCurrency(value)
}

/**
 * Calculate percentage variation between current and previous values.
 * For now, we'll use a simple calculation based on the time period.
 */
function calculateVariation(currentValue: number, period: Period): number {
  // This is a simplified calculation - in a real app, you'd compare with previous period
  const baseVariations = {
    daily: { min: -5, max: 15 },
    weekly: { min: -10, max: 25 },
    monthly: { min: -15, max: 35 }
  }

  const range = baseVariations[period]
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
}

const dashboardStore = useDashboardStore()
const stats = ref<Stat[]>([])

/**
 * Map KPI data to stats format for display in the UI.
 * Transforms raw API data into the format expected by the component.
 */
function mapKpiToStats(): void {
  if (!dashboardStore.kpiData) {
    stats.value = []
    return
  }

  const kpi = dashboardStore.kpiData

  stats.value = [
    {
      title: 'Total Revenue',
      icon: 'i-lucide-circle-dollar-sign',
      value: formatNumber(kpi.totalRevenue),
      variation: calculateVariation(kpi.totalRevenue, props.period)
    },
    {
      title: 'Active Players (24h)',
      icon: 'i-lucide-users',
      value: kpi.activePlayers24h.toLocaleString(),
      variation: calculateVariation(kpi.activePlayers24h, props.period)
    },
    {
      title: 'New Users (24h)',
      icon: 'i-lucide-user-plus',
      value: kpi.newUsers24h.toLocaleString(),
      variation: calculateVariation(kpi.newUsers24h, props.period)
    },
    {
      title: 'Operator Balance',
      icon: 'i-lucide-wallet',
      value: formatNumber(kpi.operatorBalance),
      variation: calculateVariation(kpi.operatorBalance, props.period)
    }
  ]
}

/**
 * Watch for changes in props and refetch data when needed.
 * Also watch for changes in KPI data from the store.
 */
watch([() => props.period, () => props.range, () => dashboardStore.kpiData], () => {
  mapKpiToStats()
}, { immediate: true })

/**
 * Fetch KPI data when the component is mounted.
 */
onMounted(async () => {
  await dashboardStore.fetchKpiSummary()
})
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <!-- Loading skeleton -->
    <UPageCard
      v-for="(_, index) in 4"
      v-if="dashboardStore.isLoadingKpi"
      :key="`skeleton-${index}`"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-muted/50',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg"
    >
      <div class="flex items-center gap-2">
        <USkeleton class="h-8 w-24" />
        <USkeleton class="h-5 w-12" />
      </div>
    </UPageCard>

    <!-- Stats cards -->
    <UPageCard
      v-for="(stat, index) in stats"
      v-else-if="stats.length > 0"
      :key="`stat-${index}`"
      :icon="stat.icon"
      :title="stat.title"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge
          :color="stat.variation > 0 ? 'success' : 'error'"
          variant="subtle"
          class="text-xs"
        >
          {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
        </UBadge>
      </div>
    </UPageCard>

    <!-- Error state -->
    <UPageCard
      v-else-if="dashboardStore.kpiError"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-center text-center',
        leading: 'p-2.5 rounded-full bg-error/10 ring ring-inset ring-error/25',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg"
    >
      <UIcon name="i-lucide-alert-circle" class="size-6 text-error" />
      <div class="text-sm text-muted">
        Failed to load KPI data
      </div>
    </UPageCard>

    <!-- Empty state (fallback) -->
    <UPageCard
      v-else
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-center text-center',
        leading: 'p-2.5 rounded-full bg-muted/50',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg"
    >
      <UIcon name="i-lucide-bar-chart-3" class="size-6 text-muted" />
      <div class="text-sm text-muted">
        No data available
      </div>
    </UPageCard>
  </UPageGrid>
</template>
