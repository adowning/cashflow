Based on my comprehensive analysis of the Drizzle schema and service files, I've identified several repetitive query patterns that would benefit from optimized database views. Here are 4 recommended Drizzle views that address common data access patterns:

## 1. Player Financial Summary View

**Purpose:** Provides a denormalized view of player balances, transaction summaries, and wagering progress for quick dashboard access and bet validation.

**Drizzle View Definition:**
```typescript
// prisma/drizzle/views/player-financial-summary.ts
import { pgView } from 'drizzle-orm/pg-core';
import { players } from '../players';
import { transactions } from '../transactions';
import { sql } from 'drizzle-orm';

export const playerFinancialSummary = pgView('player_financial_summary', {
  playerId: text('player_id').notNull(),
  username: text('username'),
  totalDeposits: integer('total_deposits').default(0),
  totalWithdrawals: integer('total_withdrawals').default(0),
  totalWagered: integer('total_wagered').default(0),
  totalWon: integer('total_won').default(0),
  currentRealBalance: integer('current_real_balance').default(0),
  currentBonusBalance: integer('current_bonus_balance').default(0),
  wageringProgress: integer('wagering_progress').default(0),
  lastTransactionDate: timestamp('last_transaction_date'),
}).as(sql`
  SELECT
    p.id as player_id,
    p.username,
    COALESCE(SUM(CASE WHEN t.type = 'DEPOSIT' THEN t.amount::int ELSE 0 END), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN t.type = 'WITHDRAWAL' THEN t.amount::int ELSE 0 END), 0) as total_withdrawals,
    COALESCE(SUM(CASE WHEN t.type = 'WAGER' THEN t.wager_amount::int ELSE 0 END), 0) as total_wagered,
    COALESCE(SUM(CASE WHEN t.type = 'WIN' THEN t.amount::int ELSE 0 END), 0) as total_won,
    (p.balance->>'real')::int as current_real_balance,
    (p.balance->>'bonus')::int as current_bonus_balance,
    (p.balance->>'wagering_progress')::int as wagering_progress,
    MAX(t.created_at) as last_transaction_date
  FROM players p
  LEFT JOIN transactions t ON p.id = t.player_id
  GROUP BY p.id, p.username, p.balance
`);
```

**Example Usage in Service:**
```typescript
// In balance-management.service.ts or bet-validation.service.ts
const playerSummary = await db.select().from(playerFinancialSummary)
  .where(eq(playerFinancialSummary.playerId, userId))
  .limit(1);

// Check if player has sufficient balance for bet
if (playerSummary[0].currentRealBalance + playerSummary[0].currentBonusBalance >= betAmount) {
  // Proceed with bet processing
}
```

**Justification:** This view eliminates the need for multiple joins and aggregations in balance checks and dashboard displays. It reduces query complexity from multiple table scans to a single view query, improving performance for frequent balance validations and player statistics lookups.

## 2. Affiliate Hierarchy View

**Purpose:** Flattens the affiliate referral tree with earnings calculations for efficient affiliate dashboard queries and commission processing.

**Drizzle View Definition:**
```typescript
// prisma/drizzle/views/affiliate-hierarchy.ts
import { pgView } from 'drizzle-orm/pg-core';
import { players } from '../players';
import { affiliateLogs } from '../affiliate-logs';
import { sql } from 'drizzle-orm';

export const affiliateHierarchy = pgView('affiliate_hierarchy', {
  affiliateId: text('affiliate_id').notNull(),
  affiliateUsername: text('affiliate_username'),
  referralId: text('referral_id').notNull(),
  referralUsername: text('referral_username'),
  referralLevel: integer('referral_level').default(1),
  totalReferralBetAmount: doublePrecision('total_referral_bet_amount').default(0),
  totalReferralCommission: doublePrecision('total_referral_commission').default(0),
  activeReferralsCount: integer('active_referrals_count').default(0),
  lastActivityDate: timestamp('last_activity_date'),
}).as(sql`
  WITH RECURSIVE referral_tree AS (
    -- Base case: direct referrals
    SELECT
      p.id as affiliate_id,
      p.username as affiliate_username,
      r.id as referral_id,
      r.username as referral_username,
      1 as referral_level,
      COALESCE(SUM(al.bet_amount), 0) as total_referral_bet_amount,
      COALESCE(SUM(al.commission_amount), 0) as total_referral_commission,
      COUNT(CASE WHEN al.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as active_referrals_count,
      MAX(al.created_at) as last_activity_date
    FROM players p
    JOIN players r ON r.invitor_id = p.id
    LEFT JOIN affiliate_logs al ON al.invitor_id = p.id AND al.child_id = r.id
    GROUP BY p.id, p.username, r.id, r.username
    
    UNION ALL
    
    -- Recursive case: indirect referrals
    SELECT
      rt.affiliate_id,
      rt.affiliate_username,
      r2.id as referral_id,
      r2.username as referral_username,
      rt.referral_level + 1,
      rt.total_referral_bet_amount,
      rt.total_referral_commission,
      rt.active_referrals_count,
      rt.last_activity_date
    FROM referral_tree rt
    JOIN players r2 ON r2.invitor_id = rt.referral_id
    WHERE rt.referral_level < 5  -- Limit depth to prevent infinite recursion
  )
  SELECT * FROM referral_tree
`);
```

**Example Usage in Service:**
```typescript
// In affiliate.service.ts
const affiliateData = await db.select().from(affiliateHierarchy)
  .where(eq(affiliateHierarchy.affiliateId, affiliateId));

// Calculate total earnings across all referral levels
const totalEarnings = affiliateData.reduce((sum, ref) => 
  sum + Number(ref.totalReferralCommission), 0);
```

**Justification:** The current affiliate service performs multiple queries with complex joins and aggregations for earnings calculations. This view pre-computes the hierarchical relationships and earnings data, reducing query time from multiple seconds to milliseconds for affiliate dashboards and commission processing.

## 3. Game Performance Metrics View

**Purpose:** Aggregates game statistics including RTP, turnover, GGR, and player engagement for real-time monitoring and reporting.

**Drizzle View Definition:**
```typescript
// prisma/drizzle/views/game-performance-metrics.ts
import { pgView } from 'drizzle-orm/pg-core';
import { games } from '../games';
import { transactions } from '../transactions';
import { gameSessions } from '../game-sessions';
import { sql } from 'drizzle-orm';

export const gamePerformanceMetrics = pgView('game_performance_metrics', {
  gameId: text('game_id').notNull(),
  gameName: text('game_name'),
  category: text('category'),
  totalWagered: integer('total_wagered').default(0),
  totalWon: integer('total_won').default(0),
  totalGGR: integer('total_ggr').default(0),
  actualRTP: doublePrecision('actual_rtp').default(0),
  theoreticalRTP: integer('theoretical_rtp'),
  uniquePlayers: integer('unique_players').default(0),
  totalSessions: integer('total_sessions').default(0),
  avgSessionDuration: integer('avg_session_duration').default(0),
  lastActivityDate: timestamp('last_activity_date'),
}).as(sql`
  SELECT
    g.id as game_id,
    g.name as game_name,
    g.category,
    COALESCE(SUM(CASE WHEN t.type = 'WAGER' THEN t.wager_amount::int ELSE 0 END), 0) as total_wagered,
    COALESCE(SUM(CASE WHEN t.type = 'WIN' THEN t.amount::int ELSE 0 END), 0) as total_won,
    COALESCE(SUM(CASE WHEN t.type = 'WAGER' THEN t.wager_amount::int WHEN t.type = 'WIN' THEN -t.amount::int ELSE 0 END), 0) as total_ggr,
    CASE 
      WHEN SUM(CASE WHEN t.type = 'WAGER' THEN t.wager_amount::int ELSE 0 END) > 0 
      THEN (SUM(CASE WHEN t.type = 'WIN' THEN t.amount::int ELSE 0 END) * 100.0 / SUM(CASE WHEN t.type = 'WAGER' THEN t.wager_amount::int ELSE 0 END))
      ELSE 0 
    END as actual_rtp,
    g.target_rtp as theoretical_rtp,
    COUNT(DISTINCT t.player_id) as unique_players,
    COUNT(DISTINCT gs.id) as total_sessions,
    COALESCE(AVG(gs.duration), 0) as avg_session_duration,
    GREATEST(MAX(t.created_at), MAX(gs.created_at)) as last_activity_date
  FROM games g
  LEFT JOIN transactions t ON g.id = t.game_id
  LEFT JOIN game_sessions gs ON g.id = gs.game_id
  GROUP BY g.id, g.name, g.category, g.target_rtp
`);
```

**Example Usage in Service:**
```typescript
// In dashboard.service.ts or game monitoring
const gameMetrics = await db.select().from(gamePerformanceMetrics)
  .where(eq(gamePerformanceMetrics.category, 'slots'))
  .orderBy(desc(gamePerformanceMetrics.totalGGR));

// Get top performing games for dashboard
const topGames = gameMetrics.slice(0, 10);
```

**Justification:** The dashboard and transaction services frequently perform complex aggregations across games, transactions, and sessions. This view consolidates these calculations, eliminating the need for multiple joins and window functions in real-time queries, significantly improving dashboard load times.

## 4. VIP Progress Tracking View

**Purpose:** Denormalizes VIP level data with progress calculations for efficient level-up checks and progress displays.

**Drizzle View Definition:**
```typescript
// prisma/drizzle/views/vip-progress-tracking.ts
import { pgView } from 'drizzle-orm/pg-core';
import { players } from '../players';
import { vipRankData } from '../vip-rank-data';
import { vipLevelData } from '../vip-level-data';
import { transactions } from '../transactions';
import { sql } from 'drizzle-orm';

export const vipProgressTracking = pgView('vip_progress_tracking', {
  playerId: text('player_id').notNull(),
  currentRankId: text('current_rank_id'),
  currentRankName: text('current_rank_name'),
  currentLevel: integer('current_level').default(0),
  totalXpPoints: integer('total_xp_points').default(0),
  currentLevelMinXp: integer('current_level_min_xp'),
  currentLevelMaxXp: integer('current_level_max_xp'),
  nextLevelMinXp: integer('next_level_min_xp'),
  progressToNextLevel: doublePrecision('progress_to_next_level').default(0),
  pointsToNextLevel: integer('points_to_next_level'),
  currentBenefits: jsonb('current_benefits'),
  nextLevelBenefits: jsonb('next_level_benefits'),
}).as(sql`
  SELECT
    p.id as player_id,
    vr.id as current_rank_id,
    vr.name as current_rank_name,
    COALESCE((p.vip_info->>'currentLevel')::int, 0) as current_level,
    COALESCE((p.vip_info->>'totalPoints')::int, 0) as total_xp_points,
    vl.min_xp_needed as current_level_min_xp,
    vl.max_xp_needed as current_level_max_xp,
    vl_next.min_xp_needed as next_level_min_xp,
    CASE 
      WHEN vl_next.min_xp_needed IS NOT NULL AND vl.max_xp_needed > vl.min_xp_needed
      THEN ((COALESCE((p.vip_info->>'totalPoints')::int, 0) - vl.min_xp_needed)::float / (vl_next.min_xp_needed - vl.min_xp_needed)) * 100
      ELSE 100
    END as progress_to_next_level,
    GREATEST(0, COALESCE(vl_next.min_xp_needed, 0) - COALESCE((p.vip_info->>'totalPoints')::int, 0)) as points_to_next_level,
    jsonb_build_object(
      'cashback', vl.cashback_benefit,
      'freeSpins', vl.free_spins_benefit,
      'higherLimits', vl.higher_limits_benefit,
      'prioritySupport', vl.priority_support_benefit
    ) as current_benefits,
    CASE 
      WHEN vl_next.id IS NOT NULL THEN
        jsonb_build_object(
          'cashback', vl_next.cashback_benefit,
          'freeSpins', vl_next.free_spins_benefit,
          'higherLimits', vl_next.higher_limits_benefit,
          'prioritySupport', vl_next.priority_support_benefit
        )
      ELSE NULL
    END as next_level_benefits
  FROM players p
  LEFT JOIN vip_rank_data vr ON vr.id = p.vip_info->>'rankId'
  LEFT JOIN vip_level_data vl ON vl.parent_id = vr.id 
    AND vl.level_number = COALESCE((p.vip_info->>'currentLevel')::int, 0)
  LEFT JOIN vip_level_data vl_next ON vl_next.parent_id = vr.id 
    AND vl_next.level_number = COALESCE((p.vip_info->>'currentLevel')::int, 0) + 1
`);
```

**Example Usage in Service:**
```typescript
// In vip.service.ts
const vipProgress = await db.select().from(vipProgressTracking)
  .where(eq(vipProgressTracking.playerId, userId))
  .limit(1);

// Check if player can level up
if (vipProgress[0].progressToNextLevel >= 100) {
  await processLevelUp(userId, vipProgress[0].currentLevel + 1);
}
```

**Justification:** The VIP service currently performs multiple queries to calculate progress and benefits. This view pre-computes all VIP-related data, reducing the complex joins and calculations needed for level-up checks, progress displays, and benefit applications from multiple queries to a single view lookup.

These views address the most performance-critical and repetitive query patterns observed in the codebase. They would significantly reduce database load, improve response times for dashboards and real-time features, and simplify service layer code by moving complex aggregations to the database level.