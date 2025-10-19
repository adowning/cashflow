// Real-time Update Composables for Casino Platform
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRStore } from '@/stores/rstore-config'
import type {
  BalanceNotification,
  VIPNotification,
  WageringNotification,
  JackpotNotification
} from '@/types/casino'

/**
 * Composable for real-time balance updates
 */
export function useRealtimeBalance(userId: string, walletId: string) {
  const { store } = useRStore()

  const balance = ref({
    realBalance: 0,
    bonusBalance: 0,
    totalBalance: 0,
    lastUpdated: null as Date | null
  })

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Subscribe to wallet updates
  const subscribeToBalance = () => {
    const { data } = store.wallets.query(q => q.first({
      filter: item => item.id === walletId
    }))

    watch(data, (newBalance) => {
      if (newBalance) {
        balance.value = {
          realBalance: newBalance.realBalance,
          bonusBalance: newBalance.bonusBalance,
          totalBalance: newBalance.realBalance + newBalance.bonusBalance,
          lastUpdated: new Date()
        }
      }
    }, { immediate: true })
  }

  // Optimistic balance update for immediate UI feedback
  const updateBalanceOptimistically = (change: {
    realBalance?: number
    bonusBalance?: number
    changeType: 'bet' | 'win' | 'bonus' | 'adjustment'
  }) => {
    const currentBalance = balance.value

    if (change.changeType === 'bet') {
      // Deduct from appropriate balance
      if (currentBalance.realBalance > 0) {
        balance.value.realBalance = Math.max(0, currentBalance.realBalance - Math.abs(change.realBalance || 0))
      } else {
        balance.value.bonusBalance = Math.max(0, currentBalance.bonusBalance - Math.abs(change.bonusBalance || 0))
      }
    } else if (change.changeType === 'win') {
      // Add to real balance for wins
      balance.value.realBalance += change.realBalance || 0
    }

    balance.value.totalBalance = balance.value.realBalance + balance.value.bonusBalance
    balance.value.lastUpdated = new Date()
  }

  // Rollback optimistic update
  const rollbackBalance = () => {
    // This would restore the previous balance state
    console.log('Rolling back balance update')
  }

  onMounted(() => {
    subscribeToBalance()
  })

  return {
    balance: computed(() => balance.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    updateBalanceOptimistically,
    rollbackBalance
  }
}

/**
 * Composable for real-time VIP updates
 */
export function useRealtimeVIP(userId: string) {
  const { store } = useRStore()

  const vipInfo = ref({
    level: 1,
    levelName: 'Bronze',
    totalPoints: 0,
    pointsToNextLevel: 1000,
    progressToNextLevel: 0,
    benefits: [],
    lastUpdated: null as Date | null
  })

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Subscribe to VIP updates
  const subscribeToVIP = () => {
    const { data } = store.vipInfo.query(q => q.first({
      filter: item => item.userId === userId
    }))

    watch(data, (newVIP) => {
      if (newVIP) {
        vipInfo.value = {
          level: newVIP.level,
          levelName: newVIP.rankName,
          totalPoints: newVIP.betExp + newVIP.depositExp,
          pointsToNextLevel: calculatePointsToNextLevel(newVIP),
          progressToNextLevel: calculateProgressToNextLevel(newVIP),
          benefits: getActiveBenefits(newVIP),
          lastUpdated: new Date()
        }
      }
    }, { immediate: true })
  }

  // Calculate points needed for next level
  const calculatePointsToNextLevel = (vipData: any): number => {
    const levelThresholds = [0, 1000, 5000, 20000, 100000]
    const currentLevel = vipData.level || 1
    const nextLevelIndex = Math.min(currentLevel, levelThresholds.length - 1)
    const nextLevelThreshold = levelThresholds[nextLevelIndex] || Infinity
    const currentPoints = (vipData.betExp || 0) + (vipData.depositExp || 0)
    return Math.max(0, nextLevelThreshold - currentPoints)
  }

  // Calculate progress percentage to next level
  const calculateProgressToNextLevel = (vipData: any): number => {
    const pointsToNext = calculatePointsToNextLevel(vipData)
    const currentLevel = vipData.level || 1
    const levelThresholds = [0, 1000, 5000, 20000, 100000]
    const currentLevelThreshold = levelThresholds[currentLevel - 1] || 0
    const nextLevelThreshold = levelThresholds[currentLevel] || Infinity
    const levelRange = nextLevelThreshold - currentLevelThreshold
    const currentPoints = (vipData.betExp || 0) + (vipData.depositExp || 0)
    const progressInLevel = currentPoints - currentLevelThreshold

    return levelRange > 0 ? (progressInLevel / levelRange) * 100 : 100
  }

  // Get active benefits
  const getActiveBenefits = (vipData: any): string[] => {
    const benefits = []

    if (vipData.cashback > 0) benefits.push(`Cashback: ${vipData.cashback}%`)
    if (vipData.freeSpins > 0) benefits.push(`Free Spins: ${vipData.freeSpins}`)
    if (vipData.higherLimits) benefits.push('Higher Limits')
    if (vipData.prioritySupport) benefits.push('Priority Support')

    return benefits
  }

  onMounted(() => {
    subscribeToVIP()
  })

  return {
    vipInfo: computed(() => vipInfo.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value)
  }
}

/**
 * Composable for real-time transaction updates
 */
export function useRealtimeTransactions(userId: string, limit = 20) {
  const { store } = useRStore()

  const transactions = ref<any[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Subscribe to transaction updates
  const subscribeToTransactions = () => {
    const { data } = store.transactions.query(q => q.many({
      filter: item => item.profileId === userId,
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit
    }))

    watch(data, (newTransactions) => {
      if (newTransactions) {
        transactions.value = newTransactions
      }
    }, { immediate: true })
  }

  // Get only WIN transactions for user display
  const winTransactions = computed(() => {
    return transactions.value.filter(t => t.type === 'WIN')
  })

  // Get recent transactions (last 24 hours)
  const recentTransactions = computed(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return transactions.value.filter(t => new Date(t.createdAt) > oneDayAgo)
  })

  onMounted(() => {
    subscribeToTransactions()
  })

  return {
    transactions: computed(() => transactions.value),
    winTransactions,
    recentTransactions,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value)
  }
}

/**
 * Composable for real-time jackpot updates
 */
export function useRealtimeJackpots() {
  const { store } = useRStore()

  const jackpots = ref({
    minor: { currentAmount: 0, lastWinAt: null, lastWinAmount: 0 },
    major: { currentAmount: 0, lastWinAt: null, lastWinAmount: 0 },
    mega: { currentAmount: 0, lastWinAt: null, lastWinAmount: 0 }
  })

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Subscribe to jackpot updates
  const subscribeToJackpots = () => {
    const { data } = store.jackpots.query(q => q.many())

    watch(data, (newJackpots) => {
      if (newJackpots) {
        // Group jackpots by type
        const grouped = { minor: [], major: [], mega: [] } as any

        newJackpots.forEach((jackpot: any) => {
          if (grouped[jackpot.group]) {
            grouped[jackpot.group] = jackpot
          }
        })

        jackpots.value = {
          minor: grouped.minor || jackpots.value.minor,
          major: grouped.major || jackpots.value.major,
          mega: grouped.mega || jackpots.value.mega
        }
      }
    }, { immediate: true })
  }

  onMounted(() => {
    subscribeToJackpots()
  })

  return {
    jackpots: computed(() => jackpots.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value)
  }
}

/**
 * Composable for real-time wagering progress
 */
export function useRealtimeWagering(userId: string) {
  const { store } = useRStore()

  const wageringProgress = ref({
    overallProgress: 0,
    totalRequired: 0,
    totalWagered: 0,
    activeBonuses: 0,
    completedBonuses: 0,
    withdrawalEligible: false
  })

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Subscribe to player bonus updates
  const subscribeToWagering = () => {
    const { data } = store.playerBonuses.query(q => q.many({
      filter: item => item.userId === userId && item.status === 'pending'
    }))

    watch(data, (newBonuses) => {
      if (newBonuses) {
        const totalRequired = newBonuses.reduce((sum, bonus) => sum + bonus.goalAmount, 0)
        const totalWagered = newBonuses.reduce((sum, bonus) => sum + bonus.processAmount, 0)
        const overallProgress = totalRequired > 0 ? (totalWagered / totalRequired) * 100 : 0

        wageringProgress.value = {
          overallProgress: Math.min(overallProgress, 100),
          totalRequired,
          totalWagered,
          activeBonuses: newBonuses.length,
          completedBonuses: 0, // Would need to track completed bonuses
          withdrawalEligible: overallProgress >= 100
        }
      }
    }, { immediate: true })
  }

  onMounted(() => {
    subscribeToWagering()
  })

  return {
    wageringProgress: computed(() => wageringProgress.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value)
  }
}

/**
 * Master composable that combines all real-time updates
 */
export function useRealtimeCasino(userId: string, walletId: string) {
  // Initialize all real-time subscriptions
  const balance = useRealtimeBalance(userId, walletId)
  const vip = useRealtimeVIP(userId)
  const transactions = useRealtimeTransactions(userId)
  const jackpots = useRealtimeJackpots()
  const wagering = useRealtimeWagering(userId)

  // Combined loading state
  const isLoading = computed(() =>
    balance.isLoading.value ||
    vip.isLoading.value ||
    transactions.isLoading.value ||
    jackpots.isLoading.value ||
    wagering.isLoading.value
  )

  // Combined error state
  const error = computed(() =>
    balance.error.value ||
    vip.error.value ||
    transactions.error.value ||
    jackpots.error.value ||
    wagering.error.value
  )

  // Last update timestamp
  const lastUpdate = ref(new Date())

  // Update last update timestamp when any data changes
  watch([balance.balance, vip.vipInfo, transactions.transactions, jackpots.jackpots], () => {
    lastUpdate.value = new Date()
  }, { deep: true })

  return {
    // Individual data streams
    balance: balance.balance,
    vip: vip.vipInfo,
    transactions: transactions.transactions,
    winTransactions: transactions.winTransactions,
    jackpots: jackpots.jackpots,
    wagering: wagering.wageringProgress,

    // Combined states
    isLoading,
    error,
    lastUpdate: computed(() => lastUpdate.value),

    // Utility functions
    updateBalanceOptimistically: balance.updateBalanceOptimistically,
    rollbackBalance: balance.rollbackBalance
  }
}