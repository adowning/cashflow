/** biome-ignore-all lint/suspicious/noExplicitAny: <> */


import { validateBet } from './bet-validation.service'
import { getUserWallets } from './wallet.service'
import { deductBetAmount, addWinnings } from './balance-management.service'
import { logGGRContribution } from './ggr.service'
import { processJackpotContribution } from './jackpot.service'
import
{
    notifyError,
    sendPostBetNotifications,
} from './realtime-notifications.service'
import { logTransaction } from './transaction-logging.service'
import { addXpToUser, calculateXpForWagerAndWins } from './vip.service'
import { updateWageringProgress } from './wagering.service'

/**
 * Bet processing orchestration service
 * Coordinates all systems for complete bet processing following PRD
 */

export interface BetRequest
{
    userId: string
    gameId: string
    wagerAmount: number // Amount in cents
    operatorId?: string
    sessionId?: string
    affiliateId?: string
}

export interface BetOutcome
{
    userId: string
    gameId: string
    wagerAmount: number
    winAmount: number
    balanceType: 'real' | 'bonus' | 'mixed'
    newBalance: number

    // System contributions
    jackpotContribution: number
    vipPointsEarned: number
    ggrContribution: number

    // Status
    success: boolean
    error?: string

    // Metadata
    transactionId?: string
    processingTime: number
}

export interface GameOutcome
{
    winAmount: number
    gameData?: any // Game-specific outcome data
    jackpotWin?: {
        group: string
        amount: number
    }
}

/**
 * Process complete bet flow from wager to outcome
 */
export async function processBet(
    betRequest: BetRequest,
    gameOutcome: GameOutcome
): Promise<BetOutcome>
{
    const startTime = Date.now()

    try {
        console.log(
            `🎰 Processing bet for user ${betRequest.userId}, game ${betRequest.gameId}`
        )

        // 1. Pre-bet validation
        const validation = await validateBet({
            userId: betRequest.userId,
            gameId: betRequest.gameId,
            wagerAmount: betRequest.wagerAmount,
            operatorId: betRequest.operatorId,
        })

        if (!validation.valid) {
            // await notifyError(betRequest.userId, validation.reason || 'Bet validation failed');
            return {
                userId: betRequest.userId,
                gameId: betRequest.gameId,
                wagerAmount: betRequest.wagerAmount,
                winAmount: 0,
                balanceType: 'real',
                newBalance: 0,
                jackpotContribution: 0,
                vipPointsEarned: 0,
                ggrContribution: 0,
                success: false,
                error: validation.reason,
                processingTime: Date.now() - startTime,
            }
        }

        // 2. Get user's active wallet
        const userWallets = await getUserWallets(betRequest.userId)
        const user = userWallets[0]
        if (!user) {
            throw new Error('User wallet not found')
        }

        // 3. Process jackpot contribution
        const jackpotResult = await processJackpotContribution(
            betRequest.gameId,
            betRequest.wagerAmount
        )
        const totalJackpotContribution = Object.values(
            jackpotResult.contributions
        ).reduce((sum, contrib) => sum + contrib, 0)

        // 4. Deduct wager amount from balance
        const balanceDeduction = await deductBetAmount({
            walletId: user.walletId,
            amount: betRequest.wagerAmount,
            gameId: betRequest.gameId,
            preferredBalanceType: 'auto', // Use real first, then bonus
        })

        if (!balanceDeduction.success) {
            // await notifyError(betRequest.userId, balanceDeduction.error || 'Balance deduction failed');
            return {
                userId: betRequest.userId,
                gameId: betRequest.gameId,
                wagerAmount: betRequest.wagerAmount,
                winAmount: 0,
                balanceType: 'real',
                newBalance: 0,
                jackpotContribution: totalJackpotContribution,
                vipPointsEarned: 0,
                ggrContribution: 0,
                success: false,
                error: balanceDeduction.error,
                processingTime: Date.now() - startTime,
            }
        }

        // 5. Add winnings to balance
        const winningsAddition = await addWinnings({
            walletId: user.walletId,
            amount: gameOutcome.winAmount,
            balanceType:
                balanceDeduction.balanceType === 'bonus' ? 'bonus' : 'real',
            reason: `Game win - ${betRequest.gameId}`,
            gameId: betRequest.gameId,
        })

        if (!winningsAddition.success) {
            console.error('Failed to add winnings:', winningsAddition.error)
            // Continue processing but log error
        }

        // 6. Calculate new balance
        const newBalance = winningsAddition.newBalance

        // 7. Calculate VIP points
        const vipCalculation = calculateXpForWagerAndWins(
            betRequest.wagerAmount
        )

        // 8. Update VIP progress
        const vipUpdate = await addXpToUser(
            betRequest.userId,
            vipCalculation.totalPoints
        )

        // 9. Update wagering progress
        const wageringUpdate = await updateWageringProgress({
            userId: betRequest.userId,
            wagerAmount: betRequest.wagerAmount,
            balanceType: balanceDeduction.balanceType,
            gameId: betRequest.gameId,
        })

        // 10. Log GGR contribution
        const ggrResult = await logGGRContribution({
            betId: `bet_${Date.now()}`,
            userId: betRequest.userId,
            affiliateId: betRequest.affiliateId,
            operatorId: betRequest.operatorId || 'default',
            gameId: betRequest.gameId,
            wagerAmount: betRequest.wagerAmount,
            winAmount: gameOutcome.winAmount,
            currency: 'USD',
        })

        // 11. Log comprehensive transaction
        const transactionId = await logTransaction({
            userId: betRequest.userId,
            gameId: betRequest.gameId,
            operatorId: betRequest.operatorId || 'default',
            wagerAmount: betRequest.wagerAmount,
            winAmount: gameOutcome.winAmount,
            betType: balanceDeduction.balanceType,
            preRealBalance: validation.availableBalance || 0, // Would need actual pre-balance
            postRealBalance: newBalance,
            preBonusBalance: 0, // Would need actual pre-bonus balance
            postBonusBalance: 0, // Would need actual post-bonus balance
            ggrContribution: ggrResult.ggrAmount,
            jackpotContribution: totalJackpotContribution,
            vipPointsAdded: vipCalculation.totalPoints,
            affiliateId: betRequest.affiliateId,
            sessionId: betRequest.sessionId,
            currency: 'USD',
        })

        // 12. Send realtime notifications
        await sendPostBetNotifications(betRequest.userId, {
            balanceChange: {
                realBalance:
                    balanceDeduction.balanceType === 'real' ? newBalance : 0,
                bonusBalance:
                    balanceDeduction.balanceType === 'bonus' ? newBalance : 0,
                totalBalance: newBalance,
                changeAmount: gameOutcome.winAmount - betRequest.wagerAmount,
                changeType: gameOutcome.winAmount > 0 ? 'win' : 'bet',
            },
            vipUpdate: vipUpdate.success,
            wageringUpdate: wageringUpdate.success,
            jackpotContribution: totalJackpotContribution,
        })

        const processingTime = Date.now() - startTime

        // Performance check for sub-300ms requirement
        if (processingTime > 300) {
            console.warn(
                `⚠️ Bet processing exceeded 300ms target: ${processingTime}ms`
            )
        }

        return {
            userId: betRequest.userId,
            gameId: betRequest.gameId,
            wagerAmount: betRequest.wagerAmount,
            winAmount: gameOutcome.winAmount,
            balanceType: balanceDeduction.balanceType,
            newBalance,
            jackpotContribution: totalJackpotContribution,
            vipPointsEarned: vipCalculation.totalPoints,
            ggrContribution: ggrResult.ggrAmount,
            success: true,
            transactionId,
            processingTime,
        }
    } catch (error) {
        console.error('Bet processing failed:', error)

        // Send error notification to user
        await notifyError(
            betRequest.userId,
            error instanceof Error ? error.message : 'Bet processing failed'
        )

        return {
            userId: betRequest.userId,
            gameId: betRequest.gameId,
            wagerAmount: betRequest.wagerAmount,
            winAmount: 0,
            balanceType: 'real',
            newBalance: 0,
            jackpotContribution: 0,
            vipPointsEarned: 0,
            ggrContribution: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: Date.now() - startTime,
        }
    }
}

/**
 * Process bet outcome (called after game provider returns result)
 */
export async function processBetOutcome(
    betRequest: BetRequest,
    gameOutcome: GameOutcome
): Promise<BetOutcome>
{
    return processBet(betRequest, gameOutcome)
}

/**
 * Get user with wallet information
 */
// async function getUserWithWallet(userId: string): Promise<{
//     walletId: string
//     realBalance: number
//     bonusBalance: number
// } | null> {
//     // This would query the actual user and wallet data
//     // For now, returning a placeholder structure
//     return {
//         walletId: `wallet_${userId}`,
//         realBalance: 100000, // $1,000
//         bonusBalance: 50000, // $500
//     }
// }

/**
 * Validate bet before processing (quick pre-check)
 */
export async function preValidateBet(
    userId: string,
    gameId: string,
    wagerAmount: number
): Promise<{ valid: boolean; reason?: string }>
{
    try {
        const validation = await validateBet({
            userId,
            gameId,
            wagerAmount,
        })

        return {
            valid: validation.valid,
            reason: validation.valid ? undefined : validation.reason,
        }
    } catch (e) {
        console.error(e)
        return {
            valid: false,
            reason: 'Validation system error',
        }
    }
}

/**
 * Get bet processing statistics
 */
export async function getBetProcessingStats(): Promise<{
    totalBets: number
    averageProcessingTime: number
    successRate: number
    totalWagered: number
    totalGGR: number
}>
{
    // In production, this would query actual bet processing data
    // For now, returning placeholder statistics
    return {
        totalBets: 0,
        averageProcessingTime: 0,
        successRate: 100,
        totalWagered: 0,
        totalGGR: 0,
    }
}

/**
 * Health check for bet processing system
 */
export async function healthCheck(): Promise<{
    healthy: boolean
    checks: Record<string, boolean>
    responseTime: number
}>
{
    const startTime = Date.now()

    const checks = {
        database: await checkDatabaseConnection(),
        walletService: await checkWalletService(),
        jackpotService: await checkJackpotService(),
        vipService: await checkVIPService(),
    }

    const allHealthy = Object.values(checks).every((check) => check)

    return {
        healthy: allHealthy,
        checks,
        responseTime: Date.now() - startTime,
    }
}

/**
 * Individual health checks
 */
async function checkDatabaseConnection(): Promise<boolean>
{
    try {
        // Simple database query to check connectivity
        return true // Placeholder
    } catch {
        return false
    }
}

async function checkWalletService(): Promise<boolean>
{
    try {
        // Check if wallet service is responsive
        return true // Placeholder
    } catch {
        return false
    }
}

async function checkJackpotService(): Promise<boolean>
{
    try {
        // Check if jackpot service is responsive
        return true // Placeholder
    } catch {
        return false
    }
}

async function checkVIPService(): Promise<boolean>
{
    try {
        // Check if VIP service is responsive
        return true // Placeholder
    } catch {
        return false
    }
}
