
import { and, asc, eq, sql } from 'drizzle-orm'
import { creditToWallet } from './wallet.service.js'
import db from '@backend/database/index.js'
import { playerBonuses, balances, bonuses } from '@backend/database/schema.js'

/**
 * Balance management system for real vs bonus balance handling
 * Implements FIFO logic for multiple bonuses and wagering progress tracking
 */

export interface BonusInfo
{
    id: string
    amount: number
    wageringRequirement: number
    wageredAmount: number
    remainingAmount: number
    expiryDate?: Date
    gameRestrictions?: string[]
}

export interface BalanceDeductionRequest
{
    walletId: string
    amount: number // Amount in cents
    gameId: string
    preferredBalanceType?: 'real' | 'bonus' | 'auto'
}

export interface BalanceDeductionResult
{
    success: boolean
    balanceType: 'real' | 'bonus' | 'mixed'
    deductedFrom: {
        real: number
        bonuses: Array<{
            bonusId: string
            amount: number
            remainingWagering: number
        }>
    }
    wageringProgress: Array<{
        bonusId: string
        progressBefore: number
        progressAfter: number
        completed: boolean
    }>
    error?: string
}

export interface BalanceAdditionRequest
{
    walletId: string
    amount: number // Amount in cents
    balanceType: 'real' | 'bonus'
    reason: string
    gameId?: string
}

/**
 * Deduct from bonus balance using FIFO logic
 */
async function deductFromBonusBalance(
    tx: any,
    walletId: string,
    amount: number,
    gameId: string
): Promise<{
    success: boolean
    wageringProgress: BalanceDeductionResult['wageringProgress']
    error?: string
}>
{
    // Get active bonuses ordered by creation date (FIFO)
    const activeBonuses = await tx.query.playerBonuses.findMany({
        where: and(
            eq(playerBonuses.playerId, walletId), // Note: using walletId as userId for now
            eq(playerBonuses.status, 'pending')
        ),
        with: {
            bonus: true,
        },
        orderBy: [asc(playerBonuses.createdAt)],
    })

    let remainingAmount = amount
    const wageringProgress: BalanceDeductionResult['wageringProgress'] = []

    for (const playerBonus of activeBonuses) {
        if (remainingAmount <= 0) break

        const bonusInfo = playerBonus.bonus
        const currentAmount = Number(playerBonus.amount)
        const currentWagered = Number(playerBonus.processAmount)
        const goalAmount = Number(playerBonus.goalAmount)

        // Check if game is allowed for this bonus
        if (bonusInfo.slot === false && gameId) {
            // This is a simplified check - should be more sophisticated
            continue // Skip this bonus if game not allowed
        }

        const amountFromThisBonus = Math.min(remainingAmount, currentAmount)
        const newAmount = currentAmount - amountFromThisBonus
        const newWagered = currentWagered + amountFromThisBonus

        // Update player bonus
        await tx
            .update(playerBonuses)
            .set({
                amount: newAmount,
                processAmount: newWagered,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(playerBonuses.id, playerBonus.id))

        // Calculate progress
        const progressBefore = currentWagered / goalAmount
        const progressAfter = newWagered / goalAmount
        const completed = newWagered >= goalAmount

        wageringProgress.push({
            bonusId: playerBonus.id,
            progressBefore,
            progressAfter,
            completed,
        })

        // Convert bonus to real balance if wagering complete
        if (completed) {
            await convertBonusToReal(tx, walletId, newAmount)
        }

        // Delete bonus task if balance depleted
        if (newAmount <= 0) {
            await tx
                .delete(playerBonuses)
                .where(eq(playerBonuses.id, playerBonus.id))
        }

        remainingAmount -= amountFromThisBonus
    }

    if (remainingAmount > 0) {
        return {
            success: false,
            wageringProgress: [],
            error: 'Insufficient bonus balance across all active bonuses',
        }
    }

    return {
        success: true,
        wageringProgress,
    }
}

/**
 * Deduct from bonus balance using FIFO logic
 */
export async function deductBetAmount(
    request: BalanceDeductionRequest
): Promise<BalanceDeductionResult>
{
    try {
        const result = await db.transaction(async (tx) =>
        {
            // Get current wallet balance
            const walletBalance = await tx.query.balances.findFirst({
                where: eq(balances.id, request.walletId),
            })

            if (!walletBalance) {
                throw new Error('Wallet not found')
            }

            const realBalance = Number(walletBalance.amount)
            const totalBonusBalance = Number(walletBalance.bonus)

            // Determine balance type to use
            let balanceType: 'real' | 'bonus' | 'mixed' = 'real'
            let amountToDeductFromReal = 0
            let amountToDeductFromBonus = 0

            if (
                request.preferredBalanceType === 'real' &&
                realBalance >= request.amount
            ) {
                // Use real balance only
                amountToDeductFromReal = request.amount
                balanceType = 'real'
            } else if (
                request.preferredBalanceType === 'bonus' &&
                totalBonusBalance >= request.amount
            ) {
                // Use bonus balance only
                amountToDeductFromBonus = request.amount
                balanceType = 'bonus'
            } else {
                // Auto mode: use real first, then bonus
                if (realBalance > 0) {
                    amountToDeductFromReal = Math.min(
                        realBalance,
                        request.amount
                    )
                    const remainingAmount =
                        request.amount - amountToDeductFromReal

                    if (
                        remainingAmount > 0 &&
                        totalBonusBalance >= remainingAmount
                    ) {
                        amountToDeductFromBonus = remainingAmount
                        balanceType = 'mixed'
                    } else if (remainingAmount > 0) {
                        throw new Error('Insufficient total balance')
                    }
                } else if (totalBonusBalance >= request.amount) {
                    amountToDeductFromBonus = request.amount
                    balanceType = 'bonus'
                } else {
                    throw new Error('Insufficient total balance')
                }
            }

            const wageringProgress: BalanceDeductionResult['wageringProgress'] =
                []

            // Deduct from real balance if needed
            if (amountToDeductFromReal > 0) {
                await tx
                    .update(balances)
                    .set({
                        amount: sql`${balances.amount} - ${amountToDeductFromReal}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(balances.id, request.walletId))
            }

            // Deduct from bonus balance(s) if needed (FIFO logic)
            if (amountToDeductFromBonus > 0) {
                const bonusDeductionResult = await deductFromBonusBalance(
                    tx,
                    request.walletId,
                    amountToDeductFromBonus,
                    request.gameId
                )

                if (!bonusDeductionResult.success) {
                    throw new Error(
                        bonusDeductionResult.error || 'Bonus deduction failed'
                    )
                }

                wageringProgress.push(...bonusDeductionResult.wageringProgress)
            }

            return {
                success: true,
                balanceType,
                deductedFrom: {
                    real: amountToDeductFromReal,
                    bonuses:
                        amountToDeductFromBonus > 0
                            ? [
                                {
                                    bonusId: 'multiple',
                                    amount: amountToDeductFromBonus,
                                    remainingWagering: 0, // Will be calculated properly
                                },
                            ]
                            : [],
                },
                wageringProgress,
            }
        })

        return result
    } catch (error) {
        console.error('Balance deduction failed:', error)
        return {
            success: false,
            balanceType: 'real',
            deductedFrom: { real: 0, bonuses: [] },
            wageringProgress: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Convert completed bonus to real balance
 */
async function convertBonusToReal(
    tx: any,
    walletId: string,
    bonusAmount: number
): Promise<void>
{
    // Credit to real balance
    await tx
        .update(balances)
        .set({
            amount: sql`${balances.amount} + ${bonusAmount}`,
            bonus: sql`${balances.bonus} - ${bonusAmount}`,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(balances.id, walletId))
}

/**
 * Add winnings to appropriate balance
 */
export async function addWinnings(
    request: BalanceAdditionRequest
): Promise<{ success: boolean; newBalance: number; error?: string }>
{
    try {
        const creditResult = await creditToWallet(
            request.walletId,
            request.amount,
            request.balanceType
            // {
            //   userId: request.walletId, // Using walletId as userId for now
            //   amount: request.amount,
            //   reason: request.reason,
            //   // gameId: request.gameId,
            // }
        )

        return creditResult
    } catch (error) {
        console.error('Add winnings failed:', error)
        return {
            success: false,
            newBalance: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Get detailed balance information including active bonuses
 */
export async function getDetailedBalance(walletId: string): Promise<{
    realBalance: number
    totalBonusBalance: number
    activeBonuses: BonusInfo[]
    totalBalance: number
} | null>
{
    const walletBalance = await db.query.balances.findFirst({
        where: eq(balances.id, walletId),
    })

    if (!walletBalance) {
        return null
    }

    // Get active bonuses with details
          const activeBonuses = await db.query.playerBonuses.findMany({
        where: and(
            eq(playerBonuses.playerId, walletId),
            eq(playerBonuses.status, 'pending')
        ),
        with: {
            bonus: {
                columns: {
                    expireDate: true,
                    slot: true
                }
            }
        },
        orderBy: [asc(playerBonuses.createdAt)],
    })
    const bonusDetails: BonusInfo[] = activeBonuses.map((pb) => ({
        id: pb.id,
        amount: Number(pb.amount),
        wageringRequirement: Number(pb.goalAmount) / Number(pb.amount), // Calculate multiplier
        wageredAmount: Number(pb.processAmount),
        remainingAmount: Number(pb.amount),
        expiryDate: (pb.bonus as any)?.expireDate
            ? new Date((pb.bonus as any).expireDate)
            : undefined,
        gameRestrictions: [], // Should be populated from bonus configuration
    }))

    return {
        realBalance: Number(walletBalance.amount),
        totalBonusBalance: Number(walletBalance.bonus),
        activeBonuses: bonusDetails,
        totalBalance:
            Number(walletBalance.amount) + Number(walletBalance.bonus),
    }
}

/**
 * Check if game is allowed for bonus wagering
 */
export async function isGameAllowedForBonus(
    // gameId: string,
    bonusId: string
): Promise<boolean>
{
    const bonus = await db.query.bonuses.findFirst({
        where: eq(bonuses.id, bonusId),
    })

    if (!bonus) {
        return false
    }

    // This is a simplified check - should be more sophisticated based on game type
    // For now, assuming slot games are generally allowed for bonus wagering
    return bonus.slot === true // Simplified logic
}

/**
 * Calculate total wagering progress across all bonuses
 */
export async function getWageringProgress(walletId: string): Promise<{
    totalRequired: number
    totalWagered: number
    overallProgress: number
    bonuses: Array<{
        id: string
        required: number
        wagered: number
        progress: number
        completed: boolean
    }>
}>
{
    const activeBonuses = await db.query.playerBonuses.findMany({
        where: and(
            eq(playerBonuses.playerId, walletId),
            eq(playerBonuses.status, 'pending')
        ),
    })

    let totalRequired = 0
    let totalWagered = 0

    const bonusProgress = activeBonuses.map((pb) =>
    {
        const required = Number(pb.goalAmount)
        const wagered = Number(pb.processAmount)
        const progress = required > 0 ? wagered / required : 0
        const completed = wagered >= required

        totalRequired += required
        totalWagered += wagered

        return {
            id: pb.id,
            required,
            wagered,
            progress,
            completed,
        }
    })

    return {
        totalRequired,
        totalWagered,
        overallProgress: totalRequired > 0 ? totalWagered / totalRequired : 0,
        bonuses: bonusProgress,
    }
}
