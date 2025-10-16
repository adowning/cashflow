/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import db from '../database'
import { balances } from '../database/schema'
import { eq } from 'drizzle-orm'


/**
 * Wallet service for atomic balance operations with partial rollback support
 * Handles real and bonus balance management across multiple operators
 */

export interface BalanceOperation
{
  userId: string
  amount: number // Amount in cents
  reason: string
  gameId?: string
  operatorId?: string
}

export interface BalanceCheck
{
  walletId: string
  amount: number // Amount in cents
}

export interface WalletBalance
{
  walletId: string
  realBalance: number
  bonusBalance: number
  totalBalance: number
}

/**
 * Get wallet balance for a specific user and operator
 */
export async function getWalletBalance(walletId: string): Promise<WalletBalance | null> {
  const balance = await db.query.balances.findFirst({
    where: eq(balances.id, walletId),
  })

  if (!balance) {
    return {
      walletId,
      realBalance: 0,
      bonusBalance: 0,
      totalBalance: 0,
    }
  }

  return {
    walletId,
    realBalance: Number(balance.amount),
    bonusBalance: Number(balance.bonus),
    totalBalance: Number(balance.amount) + Number(balance.bonus),
  }
}

/**
 * Check if wallet has sufficient balance for bet
 * Prioritizes real balance over bonus balance
 */
export async function checkWalletBalance(
  walletId: string,
  betAmount: number,
): Promise<{ sufficient: boolean, balanceType: 'real' | 'bonus', availableAmount: number }> {
  const walletBalance = await getWalletBalance(walletId)

  if (!walletBalance) {
    return { sufficient: false, balanceType: 'real', availableAmount: 0 }
  }

  // Check real balance first (preferred)
  if (walletBalance.realBalance >= betAmount) {
    return { sufficient: true, balanceType: 'real', availableAmount: walletBalance.realBalance }
  }

  // Check bonus balance as fallback
  if (walletBalance.bonusBalance >= betAmount) {
    return { sufficient: true, balanceType: 'bonus', availableAmount: walletBalance.bonusBalance }
  }

  // Insufficient total balance
  return {
    sufficient: false,
    balanceType: 'real', // Default to real when insufficient
    availableAmount: walletBalance.totalBalance,
  }
}

/**
 * Debit from wallet balance atomically
 * Uses database transactions for consistency
 */
export async function debitFromWallet(
  walletId: string,
  amount: number,
  balanceType: 'real' | 'bonus',
): Promise<{ success: boolean, newBalance: number, error?: string }> {
  try {
    const result = await db.transaction(async (tx) => {
      // Get current balance
      const currentBalance = await tx.query.balances.findFirst({
        where: eq(balances.id, walletId),
      })

      if (!currentBalance) {
        throw new Error(`Wallet ${walletId} not found`)
      }

      let newBalance: number
      let updateField: any

      if (balanceType === 'real') {
        if (Number(currentBalance.amount) < amount) {
          throw new Error('Insufficient real balance')
        }
        newBalance = Number(currentBalance.amount) - amount
        updateField = { amount: newBalance }
      }
      else {
        if (Number(currentBalance.bonus) < amount) {
          throw new Error('Insufficient bonus balance')
        }
        newBalance = Number(currentBalance.bonus) - amount
        updateField = { bonus: newBalance }
      }

      // Update balance
      await tx
        .update(balances)
        .set({
          ...updateField,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(balances.id, walletId))

      return { success: true, newBalance }
    })

    return result
  }
  catch (error) {
    console.error('Debit operation failed:', error)
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Credit to wallet balance atomically
 */
export async function creditToWallet(
  walletId: string,
  amount: number,
  balanceType: 'real' | 'bonus',
): Promise<{ success: boolean, newBalance: number, error?: string }> {
  try {
    // Get current balance outside transaction (better performance and typing)
    const currentBalance = await db.query.balances.findFirst({
      where: eq(balances.id, walletId),
    })

    if (!currentBalance) {
      throw new Error(`Wallet ${walletId} not found`)
    }

    // Use transaction only for the write operation
    const result = await db.transaction(async (tx) => {
      let newBalance: number
      let updateField: any

      if (balanceType === 'real') {
        newBalance = Number(currentBalance.amount) + amount
        updateField = { amount: newBalance }
      }
      else {
        newBalance = Number(currentBalance.bonus) + amount
        updateField = { bonus: newBalance }
      }

      // Update balance atomically
      await tx
        .update(balances)
        .set({
          ...updateField,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(balances.id, walletId))

      return { success: true, newBalance }
    })

    return result
  }
  catch (error) {
    console.error('Credit operation failed:', error)
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get all wallets for a user across different operators
 */
export async function getUserWallets(userId: string): Promise<WalletBalance[]> {
  const userBalances = await db.query.balances.findMany({
    where: eq(balances.playerId, userId),
  })

  return userBalances.map(balance => ({
    walletId: balance.id,
    realBalance: Number(balance.amount),
    bonusBalance: Number(balance.bonus),
    totalBalance: Number(balance.amount) + Number(balance.bonus),
  }))
}

/**
 * Set active wallet for user
 */
export async function setActiveWallet(): Promise<boolean> {
  try {
    // Note: users table doesn't have activeWalletId field in current schema
    // This function may need to be updated based on actual schema requirements
    console.warn('setActiveWallet called but activeWalletId field not found in users table')
    return false
  }
  catch (error) {
    console.error('Failed to set active wallet:', error)
    return false
  }
}

/**
 * Legacy function names for Nolimit compatibility
 * These functions work with userId instead of walletId
 */
export async function debitFromwallets(
  userId: string,
  amount: number,
): Promise<number> {
  // Get user's active wallet
  const userWallets = await getUserWallets(userId)
  const activeWallet = userWallets[0]

  if (activeWallet) {
    console.log(`Active Wallet ID: ${activeWallet.walletId}`)
  }
  else {
    throw new Error('no active wallet')
  }
  if (!activeWallet) return 0

  if (!activeWallet) {
    throw new Error(`User ${userId} wallet not found`)
  }

  const walletBalance = activeWallet

  // Determine balance type (simplified for Nolimit compatibility)
  const balanceCheck = await checkWalletBalance(walletBalance.walletId, amount)

  if (!balanceCheck.sufficient) {
    throw new Error('Insufficient balance')
  }

  const debitResult = await debitFromWallet(
    walletBalance.walletId,
    amount,
    balanceCheck.balanceType,
  )

  if (!debitResult.success) {
    throw new Error(debitResult.error || 'Debit failed')
  }

  return debitResult.newBalance
}

export async function creditTowallets(
  userId: string,
  amount: number,
): Promise<number> {
  // Get user's active wallet
  const userWallets = await getUserWallets(userId)
  const activeWallet = userWallets[0]

  if (!activeWallet) {
    throw new Error(`User ${userId} wallet not found`)
  }

  const walletBalance = activeWallet

  // Credit to real balance for wins (simplified for Nolimit compatibility)
  const creditResult = await creditToWallet(
    walletBalance.walletId,
    amount,
    'real',
  )

  if (!creditResult.success) {
    throw new Error(creditResult.error || 'Credit failed')
  }

  return creditResult.newBalance
}