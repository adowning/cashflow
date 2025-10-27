/*
================================================================================
================================================================================

//     DEPRECATION NOTICE

//     This service is considered DEPRECATED.

//     Its logic (FIFO bonus deduction from `playerBonuses` table) is 
//     fundamentally incompatible with the new, simpler, aggregate balance 
//     model used by `WageringManager` (which uses the `bonusBalance` and 
//     `bonusWRRemaining` fields from the `playerBalances` table).

//     All functionality provided here (`deductBetAmount`, `addWinnings`, etc.)
//     is now handled by the new `WageringManager` service.

//     Please refactor any code using this service to use `WageringManager` instead.

//     See:
//     - `wagering.manager.ts`
//     - `deposit.service.ts` (for usage example)
//     - `withdrawal.service.ts` (for usage example)

// ================================================================================
// ================================================================================
// */

// import { and, asc, eq, sql } from 'drizzle-orm';
// import db from '@@/database/index.js';
// import { playerBonuses, bonuses } from '@@/database/schema';
// import { playerBalances } from '@@/database/schema/gameplay.schema.js';

// /**
//  * Balance management system for real vs bonus balance handling
//  * Implements FIFO logic for multiple bonuses and wagering progress tracking
//  * * @deprecated This service is deprecated. Use WageringManager instead.
//  */

// export interface BonusInfo {
//   id: string;
//   amount: number;
//   wageringRequirement: number;
//   wageredAmount: number;
//   remainingAmount: number;
//   expiryDate?: Date;
//   gameRestrictions?: string[];
// }

// // ... (rest of the deprecated file)
// // We leave the rest of the file intact to avoid breaking existing imports,
// // but it should not be used for new development.

// export interface BalanceDeductionRequest {
//   playerId: string;
//   amount: number; // Amount in cents
//   gameId: string;
//   preferredBalanceType?: 'real' | 'bonus' | 'auto';
// }

// export interface BalanceDeductionResult {
//   success: boolean;
//   balanceType: 'real' | 'bonus' | 'mixed';
//   deductedFrom: {
//     real: number;
//     bonuses: Array<{
//       bonusId: string;
//       amount: number;
//       remainingWagering: number;
//     }>;
//   };
//   wageringProgress: Array<{
//     bonusId: string;
//     progressBefore: number;
//     progressAfter: number;
//     completed: boolean;
//   }>;
//   error?: string;
// }

// export interface BalanceAdditionRequest {
//   playerId: string;
//   amount: number; // Amount in cents
//   balanceType: 'real' | 'bonus';
//   reason: string;
//   gameId?: string;
// }

// export interface BalanceOperation {
//   userId: string;
//   amount: number; // Amount in cents
//   reason: string;
//   gameId?: string;
//   operatorId?: string;
// }

// export interface BalanceCheck {
//   playerId: string;
//   amount: number; // Amount in cents
// }

// export interface PlayerBalance {
//   playerId: string;
//   realBalance: number;
//   bonusBalance: number;
//   totalBalance: number;
// }

// /**
//  * @deprecated Use `WageringManager.handleBet` instead.
//  */
// async function deductFromBonusBalance(
//   tx: any,
//   playerId: string,
//   amount: number,
//   gameId: string,
// ): Promise<{
//   success: boolean;
//   wageringProgress: BalanceDeductionResult['wageringProgress'];
//   error?: string;
// }> {
//   console.warn("DEPRECATED: deductFromBonusBalance called. Use WageringManager.");
//   // ... (original logic)
//   return { success: false, wageringProgress: [], error: 'Deprecated function' };
// }

// /**
//  * @deprecated Use `WageringManager.handleBet` instead.
//  */
// export async function deductBetAmount(
//   request: BalanceDeductionRequest,
// ): Promise<BalanceDeductionResult> {
//     console.warn("DEPRECATED: deductBetAmount called. Use WageringManager.handleBet.");
//     return {
//       success: false,
//       balanceType: 'real',
//       deductedFrom: { real: 0, bonuses: [] },
//       wageringProgress: [],
//       error: 'This service is deprecated. Use WageringManager instead.',
//     };
// }

// /**
//  * @deprecated Internal logic for a deprecated service.
//  */
// async function convertBonusToReal(tx: any, playerId: string, bonusAmount: number): Promise<void> {
//   // ... (original logic)
// }

// /**
//  * @deprecated Use `WageringManager.handleWin` instead.
//  */
// export async function addWinnings(
//   request: BalanceAdditionRequest,
// ): Promise<{ success: boolean; newBalance: number; error?: string }> {
//   console.warn("DEPRECATED: addWinnings called. Use WageringManager.handleWin.");
//   return {
//       success: false,
//       newBalance: 0,
//       error: 'This service is deprecated. Use WageringManager instead.',
//   };
// }

// /**
//  * @deprecated Use `WageringManager.getPlayerBalances` and `WageringManager.getPlayerStatistics` instead.
//  */
// export async function getDetailedBalance(userId: string): Promise<{
//   realBalance: number;
//   totalBonusBalance: number;
//   activeBonuses: BonusInfo[];
//   totalBalance: number;
// } | null> {
//     console.warn("DEPRECATED: getDetailedBalance called. Use WageringManager.");
//     return null;
// }

// ... (rest of the file remains, but all functions should be considered deprecated)
