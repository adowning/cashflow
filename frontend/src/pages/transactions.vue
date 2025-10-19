<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { DashboardTransaction, TransactionFilters } from '@/types/dashboard'

/**
 * Format currency values for display in the table.
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Format date values for display in the table.
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

/**
 * Get the appropriate color for transaction status badges.
 */
function getStatusBadgeColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'success'
    case 'pending':
      return 'warning'
    case 'failed':
    case 'cancelled':
      return 'error'
    default:
      return 'neutral'
  }
}

const dashboardStore = useDashboardStore()

// Local state for filters
const searchUserId = ref('')
const searchStatus = ref('')
const searchStartDate = ref('')
const searchEndDate = ref('')

/**
 * Computed property for filtered transactions.
 * Note: In a real implementation, this would be handled by the API.
 */
const filteredTransactions = computed((): DashboardTransaction[] => {
  let filtered = dashboardStore.transactions

  if (searchUserId.value) {
    filtered = filtered.filter(t => t.userId.includes(searchUserId.value))
  }

  if (searchStatus.value) {
    filtered = filtered.filter(t => t.status.toLowerCase().includes(searchStatus.value.toLowerCase()))
  }

  return filtered
})

/**
 * Computed property for pagination info.
 */
const paginationInfo = computed(() => {
  const total = filteredTransactions.value.length
  const currentPage = dashboardStore.transactionFilters.page || 1
  const pageSize = dashboardStore.transactionFilters.pageSize || 10
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, total)

  return {
    total,
    currentPage,
    totalPages,
    startItem,
    endItem,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }
})

/**
 * Handle filter changes and update the store.
 */
function handleFilterChange(): void {
  const filters: Partial<TransactionFilters> = {}

  if (searchUserId.value) filters.userId = searchUserId.value
  if (searchStatus.value) filters.status = searchStatus.value
  if (searchStartDate.value) filters.startDate = searchStartDate.value
  if (searchEndDate.value) filters.endDate = searchEndDate.value

  dashboardStore.updateTransactionFilters(filters)
}

/**
 * Handle pagination changes.
 */
function handlePageChange(page: number): void {
  dashboardStore.updateTransactionFilters({ page })
}

/**
 * Clear all filters.
 */
function clearFilters(): void {
  searchUserId.value = ''
  searchStatus.value = ''
  searchStartDate.value = ''
  searchEndDate.value = ''
  dashboardStore.updateTransactionFilters({})
}

/**
 * Initialize the page by fetching transactions data.
 */
onMounted(async () => {
  await dashboardStore.fetchTransactions()
})
</script>

<template>
  <UDashboardPanel id="transactions">
    <template #header>
      <UDashboardNavbar title="Transactions">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Filters Section -->
      <div class="space-y-4 mb-6">
        <div class="flex flex-wrap gap-4 items-end">
          <!-- User ID Filter -->
          <UFormField label="User ID" class="flex-1 min-w-48">
            <UInput
              v-model="searchUserId"
              icon="i-lucide-user"
              placeholder="Search by user ID..."
              @input="handleFilterChange"
            />
          </UFormField>

          <!-- Status Filter -->
          <UFormField label="Status" class="flex-1 min-w-48">
            <USelect
              v-model="searchStatus"
              :items="[
                { label: 'All Statuses', value: '' },
                { label: 'Completed', value: 'completed' },
                { label: 'Pending', value: 'pending' },
                { label: 'Failed', value: 'failed' },
                { label: 'Cancelled', value: 'cancelled' }
              ]"
              placeholder="Filter by status"
              @update:model-value="handleFilterChange"
            />
          </UFormField>

          <!-- Date Range Filters -->
          <UFormField label="Start Date" class="flex-1 min-w-48">
            <UInput
              v-model="searchStartDate"
              type="date"
              @change="handleFilterChange"
            />
          </UFormField>

          <UFormField label="End Date" class="flex-1 min-w-48">
            <UInput
              v-model="searchEndDate"
              type="date"
              @change="handleFilterChange"
            />
          </UFormField>

          <!-- Clear Filters Button -->
          <UButton
            label="Clear"
            color="neutral"
            variant="outline"
            icon="i-lucide-x"
            @click="clearFilters"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="dashboardStore.isLoadingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="`loading-${i}`" class="flex items-center gap-4 p-4">
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-24" />
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-12" />
        </div>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="dashboardStore.transactionsError"
        icon="i-lucide-alert-circle"
        color="error"
        variant="soft"
        title="Error Loading Transactions"
        :description="dashboardStore.transactionsError"
        class="mb-6"
      />

      <!-- Transactions Table -->
      <div v-else-if="filteredTransactions.length > 0" class="space-y-4">
        <div class="bg-elevated/50 rounded-lg overflow-hidden">
          <UTable
            :data="filteredTransactions"
            :loading="dashboardStore.isLoadingTransactions"
            class="table-fixed"
          >
            <template #thead>
              <UThead>
                <UTh class="w-32">ID</UTh>
                <UTh class="w-32">User ID</UTh>
                <UTh class="w-24">Amount</UTh>
                <UTh class="w-20">Status</UTh>
                <UTh class="w-32">Date</UTh>
                <UTh class="w-24">Type</UTh>
              </UThead>
            </template>

            <template #tbody>
              <UTr v-for="transaction in filteredTransactions" :key="transaction.id">
                <UTd class="font-mono text-xs">
                  {{ transaction.id.slice(0, 8) }}...
                </UTd>
                <UTd class="font-mono text-xs">
                  {{ transaction.userId.slice(0, 8) }}...
                </UTd>
                <UTd class="font-semibold text-highlighted">
                  {{ formatCurrency(transaction.amount) }}
                </UTd>
                <UTd>
                  <UBadge
                    :color="getStatusBadgeColor(transaction.status)"
                    variant="subtle"
                    class="capitalize"
                  >
                    {{ transaction.status }}
                  </UBadge>
                </UTd>
                <UTd class="text-muted">
                  {{ formatDate(transaction.createdAt) }}
                </UTd>
                <UTd>
                  <span class="capitalize text-muted">
                    {{ transaction.type || 'N/A' }}
                  </span>
                </UTd>
              </UTr>
            </template>
          </UTable>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between">
          <div class="text-sm text-muted">
            Showing {{ paginationInfo.startItem }} to {{ paginationInfo.endItem }} of {{ paginationInfo.total }} transactions
          </div>

          <UPagination
            :default-page="paginationInfo.currentPage"
            :items-per-page="dashboardStore.transactionFilters.pageSize || 10"
            :total="paginationInfo.total"
            @update:page="handlePageChange"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-receipt" class="size-16 text-muted mx-auto mb-4" />
        <p class="text-lg font-medium text-highlighted mb-2">
          No transactions found
        </p>
        <p class="text-muted mb-4">
          {{ searchUserId || searchStatus || searchStartDate || searchEndDate
             ? 'Try adjusting your filters to see more results.'
             : 'No transactions have been recorded yet.' }}
        </p>
        <UButton
          v-if="searchUserId || searchStatus || searchStartDate || searchEndDate"
          label="Clear Filters"
          color="neutral"
          variant="outline"
          @click="clearFilters"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>