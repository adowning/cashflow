import db from '../database'
import { affiliates, affiliateLogs } from '../database/schema'
import { and, eq, gte, lte } from "drizzle-orm";

/**
 * GGR and affiliate logging system for weekly commission calculations
 * Tracks Gross Gaming Revenue and calculates affiliate commissions
 */

export interface GGRContribution
{
  betId: string;
  userId: string;
  affiliateId?: string;
  operatorId: string;
  gameId: string;
  wagerAmount: number; // Amount in cents
  winAmount: number;   // Amount in cents
  ggrAmount: number;   // Wager - Win (can be negative)
  timestamp: Date;
  currency: string;
}

export interface WeeklyGGR
{
  affiliateId: string;
  weekStart: Date;
  weekEnd: Date;
  totalGGR: number;
  totalWagers: number;
  totalWins: number;
  commissionRate: number;
  commissionAmount: number;
  paidOut: boolean;
  payoutDate?: Date;
}

export interface AffiliateEarnings
{
  affiliateId: string;
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  lastPayoutDate?: Date;
  nextPayoutDate?: Date;
}

/**
 * Log GGR contribution from a bet
 */
export async function logGGRContribution(contribution: Omit<GGRContribution, 'ggrAmount' | 'timestamp'>): Promise<{
  success: boolean;
  ggrAmount: number;
  error?: string;
}>
{
  try {
    const ggrAmount = contribution.wagerAmount - contribution.winAmount;

    const ggrLog: GGRContribution = {
      ...contribution,
      ggrAmount,
      timestamp: new Date(),
    };

    // In production, this would be stored in a ggr_contributions table
    // For now, logging to console and storing in affiliate logs if applicable
    console.log('GGR Contribution:', ggrLog);

    // If user has an affiliate, log to affiliate logs for commission calculation
    if (contribution.affiliateId) {
      await logAffiliateContribution(contribution.affiliateId, contribution, ggrAmount);
    }

    return {
      success: true,
      ggrAmount,
    };
  } catch (error) {
    console.error('GGR logging failed:', error);
    return {
      success: false,
      ggrAmount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log contribution to affiliate for commission tracking
 */
async function logAffiliateContribution(
  affiliateId: string,
  contribution: Omit<GGRContribution, 'ggrAmount' | 'timestamp'>,
  ggrAmount: number
): Promise<void>
{
  // Get affiliate info
  const affiliate = await db.query.affiliates.findFirst({
    where: eq(affiliates.id, affiliateId),
  });

  if (!affiliate) {
    console.error(`Affiliate ${affiliateId} not found`);
    return;
  }

  // Create affiliate log entry for commission calculation
  // This would typically go into an affiliate_earnings or similar table
  console.log(`Affiliate contribution logged: Affiliate ${affiliate.playername}, GGR: ${ggrAmount}`);

  // In production, you'd insert into affiliate_logs or a dedicated earnings table
  // await db.insert(affiliateLogs).values({
  //   invitorId: affiliateId,
  //   childId: contribution.userId,
  //   referralCode: affiliate.referralCode,
  //   currency: contribution.currency,
  //   betAmount: contribution.wagerAmount,
  //   commissionAmount: Math.floor(ggrAmount * (affiliate.commissionRate || 0.05)), // 5% default
  //   // ... other fields
  // });
}

/**
 * Calculate weekly GGR for affiliate commission
 */
export async function calculateWeeklyGGR(
  affiliateId: string,
  weekStart?: Date
): Promise<WeeklyGGR | null>
{
  try {
    // Calculate week boundaries
    const now = new Date();
    const startOfWeek = weekStart || getStartOfWeek(now);
    const endOfWeek = getEndOfWeek(startOfWeek);

    // Get affiliate info
    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.id, affiliateId),
    });

    if (!affiliate) {
      return null;
    }

    // In production, this would query a ggr_contributions table
    // For now, using a simplified calculation based on affiliate logs
    const affiliateContributions = await db.query.affiliateLogs.findMany({
      where: and(
        eq(affiliateLogs.invitorId, affiliateId),
        gte(affiliateLogs.createdAt, startOfWeek),
        lte(affiliateLogs.createdAt, endOfWeek)
      ),
    });

    // Calculate totals
    const totalWagers = affiliateContributions.reduce((sum, log) => sum + Number(log.betAmount), 0);
    const totalCommissionWagers = affiliateContributions.reduce((sum, log) => sum + Number(log.commissionWager), 0);
    const totalReferralAmount = affiliateContributions.reduce((sum, log) => sum + Number(log.referralAmount), 0);

    // GGR = Total Wagers - Total Wins - Bonuses/Promo Costs
    // For simplicity, using commission wager as the GGR contribution
    const totalGGR = totalCommissionWagers;

    // Get commission rate (should be configurable per affiliate)
    const commissionRate = 0.05; // 5% default - should come from affiliate settings
    const commissionAmount = Math.floor(totalGGR * commissionRate);

    return {
      affiliateId,
      weekStart: startOfWeek,
      weekEnd: endOfWeek,
      totalGGR,
      totalWagers,
      totalWins: affiliateContributions.reduce((sum, log) => sum + Number(log.totalReferralAmount), 0),
      commissionRate,
      commissionAmount,
      paidOut: false,
    };
  } catch (error) {
    console.error('Weekly GGR calculation failed:', error);
    return null;
  }
}

/**
 * Get affiliate earnings summary
 */
export async function getAffiliateEarnings(affiliateId: string): Promise<AffiliateEarnings | null>
{
  try {
    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.id, affiliateId),
    });

    if (!affiliate) {
      return null;
    }

    // Get all affiliate logs for earnings calculation
    const affiliateContributions = await db.query.affiliateLogs.findMany({
      where: eq(affiliateLogs.invitorId, affiliateId),
    });

    // Calculate totals
    const totalCommissionAmount = affiliateContributions.reduce(
      (sum, log) => sum + Number(log.commissionAmount), 0
    );

    // In production, you'd track which earnings have been paid
    const paidEarnings = 0; // Placeholder
    const pendingEarnings = totalCommissionAmount - paidEarnings;

    return {
      affiliateId,
      totalEarnings: totalCommissionAmount,
      paidEarnings,
      pendingEarnings,
      lastPayoutDate: undefined, // Would come from payout tracking
      nextPayoutDate: getNextPayoutDate(),
    };
  } catch (error) {
    console.error('Affiliate earnings calculation failed:', error);
    return null;
  }
}

/**
 * Process weekly affiliate payouts
 */
export async function processWeeklyAffiliatePayouts(): Promise<{
  success: boolean;
  payoutsProcessed: number;
  totalPayoutAmount: number;
  error?: string;
}>
{
  try {
    // Get current week
    const weekStart = getStartOfWeek(new Date());

    // Get all affiliates
    const affiliates = await db.query.affiliates.findMany();

    let payoutsProcessed = 0;
    let totalPayoutAmount = 0;

    for (const affiliate of affiliates) {
      const weeklyGGR = await calculateWeeklyGGR(affiliate.id, weekStart);

      if (weeklyGGR && weeklyGGR.commissionAmount > 0) {
        // Process payout (in production, this would credit affiliate's account)
        console.log(`Processing payout for affiliate ${affiliate.playername}: $${weeklyGGR.commissionAmount / 100}`);

        // Mark as paid out
        weeklyGGR.paidOut = true;
        weeklyGGR.payoutDate = new Date();

        payoutsProcessed++;
        totalPayoutAmount += weeklyGGR.commissionAmount;
      }
    }

    return {
      success: true,
      payoutsProcessed,
      totalPayoutAmount,
    };
  } catch (error) {
    console.error('Weekly affiliate payout processing failed:', error);
    return {
      success: false,
      payoutsProcessed: 0,
      totalPayoutAmount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get GGR statistics for reporting
 */
export async function getGGRStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalGGR: number;
  totalWagers: number;
  totalWins: number;
  averageGGR: number;
  affiliateContributions: number;
  period: {
    start: Date;
    end: Date;
  };
}>
{
  const periodStart = startDate || getStartOfWeek(new Date());
  const periodEnd = endDate || getEndOfWeek(periodStart);

  // In production, this would query actual GGR data
  // For now, using affiliate logs as proxy
  const affiliateContributions = await db.query.affiliateLogs.findMany({
    where: and(
      gte(affiliateLogs.createdAt, periodStart),
      lte(affiliateLogs.createdAt, periodEnd)
    ),
  });

  const totalWagers = affiliateContributions.reduce((sum, log) => sum + Number(log.betAmount), 0);
  const totalWins = affiliateContributions.reduce((sum, log) => sum + Number(log.totalReferralAmount), 0);
  const totalGGR = affiliateContributions.reduce((sum, log) => sum + Number(log.commissionWager), 0);

  const averageGGR = affiliateContributions.length > 0 ? totalGGR / affiliateContributions.length : 0;

  return {
    totalGGR,
    totalWagers,
    totalWins,
    averageGGR,
    affiliateContributions: affiliateContributions.length,
    period: {
      start: periodStart,
      end: periodEnd,
    },
  };
}

/**
 * Get affiliate performance metrics
 */
export async function getAffiliatePerformance(
  affiliateId: string,
  days: number = 30
): Promise<{
  affiliateId: string;
  periodDays: number;
  totalReferrals: number;
  activeReferrals: number;
  totalGGR: number;
  totalCommissions: number;
  averageCommissionPerReferral: number;
}>
{
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);

  // Get affiliate logs for the period
  const affiliateContributions = await db.query.affiliateLogs.findMany({
    where: and(
      eq(affiliateLogs.invitorId, affiliateId),
      gte(affiliateLogs.createdAt, periodStart)
    ),
  });

  // Count unique referrals
  const uniqueReferrals = new Set(affiliateContributions.map(log => log.childId));
  const totalReferrals = uniqueReferrals.size;

  // Count active referrals (those with recent activity)
  const activeReferrals = affiliateContributions.filter(log =>
    Number(log.betAmount) > 0
  ).length;

  const totalGGR = affiliateContributions.reduce((sum, log) => sum + Number(log.commissionWager), 0);
  const totalCommissions = affiliateContributions.reduce((sum, log) => sum + Number(log.commissionAmount), 0);
  const averageCommissionPerReferral = totalReferrals > 0 ? totalCommissions / totalReferrals : 0;

  return {
    affiliateId,
    periodDays: days,
    totalReferrals,
    activeReferrals,
    totalGGR,
    totalCommissions,
    averageCommissionPerReferral,
  };
}

/**
 * Helper function to get start of week (Monday)
 */
function getStartOfWeek(date: Date): Date
{
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

/**
 * Helper function to get end of week (Sunday)
 */
function getEndOfWeek(startOfWeek: Date): Date
{
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

/**
 * Helper function to get next payout date (every Monday)
 */
function getNextPayoutDate(): Date
{
  const nextMonday = getStartOfWeek(new Date());
  nextMonday.setDate(nextMonday.getDate() + 7); // Next Monday
  return nextMonday;
}

/**
 * Get GGR contribution for a specific bet
 */
export function calculateBetGGR(wagerAmount: number, winAmount: number): number
{
  return wagerAmount - winAmount;
}

/**
 * Get affiliate commission rate (should be configurable per affiliate)
 */
export function getAffiliateCommissionRate(affiliateId?: string): number
{
  // In production, this would come from affiliate settings
  // For now, using default rates based on affiliate tier
  return 0.05; // 5% default
}