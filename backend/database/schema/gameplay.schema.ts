import { serial, integer, text, timestamp, pgTable } from 'drizzle-orm/pg-core';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

/**
 * Global platform settings for wagering.
 * This is where the 1x deposit, 30x bonus, etc., rules are stored.
 */
export const platformSettings = pgTable('platform_settings', {
  id: serial('id').primaryKey(),
  // e.g., 1.0
  depositWRMultiplier: integer('deposit_wr_multiplier').default(1).notNull(),
  // e.g., 30
  bonusWRMultiplier: integer('bonus_wr_multiplier').default(30).notNull(),
  // e.g., 30
  freeSpinWRMultiplier: integer('free_spin_wr_multiplier').default(30).notNull(),
  // For liability calculation: an assumed average win value per free spin (in cents)
  avgFreeSpinWinValue: integer('avg_free_spin_win_value').default(15).notNull(),
});

/**
 * The core balances for each player.
 * Stores all balances, wagering requirements, and statistical totals.
 * All monetary values are stored in cents (integers).
 */
export const playerBalances = pgTable('player_balances', {
  playerId: text('player_id').primaryKey(),

  // Balances
  realBalance: integer('real_balance').default(0).notNull(),
  bonusBalance: integer('bonus_balance').default(0).notNull(),
  freeSpinsRemaining: integer('free_spins_remaining').default(0).notNull(),

  // Wagering Requirements (in cents)
  depositWRRemaining: integer('deposit_wr_remaining').default(0).notNull(),
  bonusWRRemaining: integer('bonus_wr_remaining').default(0).notNull(),

  // Lifetime Statistics (in cents, except for free_spin_wins_count)
  totalDeposited: integer('total_deposited').default(0).notNull(),
  totalWithdrawn: integer('total_withdrawn').default(0).notNull(),
  totalWagered: integer('total_wagered').default(0).notNull(),
  totalWon: integer('total_won').default(0).notNull(),
  totalBonusGranted: integer('total_bonus_granted').default(0).notNull(),
  totalFreeSpinWins: integer('total_free_spin_wins').default(0).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 2. ZOD SCHEMAS (VALIDATION & TYPES) ---

// Drizzle-derived types
export const ZPlayerBalances = createSelectSchema(playerBalances);
export type TPlayerBalances = z.infer<typeof ZPlayerBalances>;

// Export the table for use in other modules
export const TPlayerBalancess = playerBalances;
export type TTPlayerBalancess = TPlayerBalances;

export const PlatformSettingsSchema = createSelectSchema(platformSettings);
export type PlatformSettings = z.infer<typeof PlatformSettingsSchema>;

// Input validation schemas
const PositiveInt = z.number().int().positive('Amount must be a positive integer (cents).');
const NonNegativeInt = z.number().int().min(0, 'Amount must be a non-negative integer (cents).');

export const DepositSchema = z.object({
  playerId: z.string().min(1),
  amount: PositiveInt, // in cents
});
export type DepositInput = z.infer<typeof DepositSchema>;

export const GrantBonusSchema = z.object({
  playerId: z.string().min(1),
  amount: PositiveInt, // in cents
});
export type GrantBonusInput = z.infer<typeof GrantBonusSchema>;

export const GrantFreeSpinsSchema = z.object({
  playerId: z.string().min(1),
  count: PositiveInt,
});
export type GrantFreeSpinsInput = z.infer<typeof GrantFreeSpinsSchema>;

export const BetSchema = z.object({
  playerId: z.string().min(1),
  betAmount: NonNegativeInt, // 0 for a free spin
  isFreeSpin: z.boolean().default(false),
});
export type BetInput = z.infer<typeof BetSchema>;

export const WinSchema = z.object({
  playerId: z.string().min(1),
  winAmount: NonNegativeInt, // 0 for a losing spin
  isFreeSpinWin: z.boolean().default(false),
});
export type WinInput = z.infer<typeof WinSchema>;

export const WithdrawSchema = z.object({
  playerId: z.string().min(1),
  amount: PositiveInt, // in cents
});
export type WithdrawInput = z.infer<typeof WithdrawSchema>;

// --- 3. PUBLIC TYPE DEFINITIONS (API OUTPUTS) ---

export interface PlayerBalances {
  playerId: string;
  realBalance: number;
  bonusBalance: number;
  freeSpinsRemaining: number;
  depositWRRemaining: number;
  bonusWRRemaining: number;
}

export interface PlayerStatistics {
  playerId: string;
  totalWagered: number;
  totalWon: number;
  totalLoss: number;
  rtp: number; // Return to Player, as a percentage (e.g., 95.5)
  totalDeposited: number;
  totalWithdrawn: number;
  netDeposits: number;

  // Liability Metrics
  currentBonusBalance: number;
  outstandingFreeSpins: number;
  estimatedFreeSpinLiability: number; // freeSpins * avgWinValue
  totalBonusGranted: number;
  totalFreeSpinWins: number;
}

// --- 4. WAGERING MANAGER SERVICE CLASS ---

// Define the DB schema type for the constructor
// type AppSchema = typeof import('./WageringManager.ts');
// type DbInstance = PostgresJsDatabase<AppSchema>;
