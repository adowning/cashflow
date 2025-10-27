// /** biome-ignore-all lint/suspicious/noExplicitAny: <> */

// import db from '@@/database';
// import { deposits, transactions } from '@@/database/schema';
// import { nanoid } from 'nanoid';
// import { notifyBalanceChange } from '@/shared/notifications.service';
// import { logTransaction } from '@/shared/transaction.service';
// import { sql, and, eq } from 'drizzle-orm';
// import { addXpToUser } from '@/user/vip.service';
// import { wageringManager } from '@/wagering.manager'; // Import the unified manager
// import { TDeposits } from '@@/database/schema/other.schema';

// /**
//  * Enhanced deposit service implementing PRD requirements
//  * Handles deposit initiation, webhook confirmation, and bonus processing
//  * USES THE UNIFIED WAGERING MANAGER
//  */

// export enum DepositStatus {
//   PENDING = 'PENDING',
//   PROCESSING = 'PROCESSING', // Corrected typo from PROCESING
//   COMPLETED = 'COMPLETED',
//   FAILED = 'FAILED',
//   CANCELLED = 'CANCELLED',
//   EXPIRED = 'EXPIRED',
// }

// export enum PaymentMethod {
//   CASHAPP = 'CASHAPP',
//   INSTORE_CASH = 'INSTORE_CASH',
//   INSTORE_CARD = 'INSTORE_CARD',
// }

// export interface DepositRequest {
//   userId: string;
//   amount: number; // Amount in cents
//   paymentMethod: PaymentMethod;
//   currency?: string;
//   note?: string;
//   metadata?: Record<string, unknown>;
// }

// export interface DepositResponse {
//   success: boolean;
//   depositId?: string;
//   status: DepositStatus;
//   instructions?: string;
//   referenceId?: string;
//   error?: string;
// }

// export interface WebhookConfirmation {
//   transactionId: string; // This is the external referenceId
//   amount: number;
//   senderInfo?: string;
//   timestamp: Date;
//   providerData?: Record<string, unknown>;
// }

// export interface DepositCompletionResult {
//   success: boolean;
//   depositId: string;
//   amount: number;
//   bonusApplied?: {
//     xpGained: number;
//     freeSpinsAwarded: number;
//   };
//   error?: string;
// }

// /**
//  * Initiate a new deposit request
//  */
// export async function initiateDeposit(request: DepositRequest): Promise<DepositResponse> {
//   try {
//     // Validate user exists by trying to get their balance
//     // This will create one if it doesn't exist, failing only on DB error
//     await wageringManager.getPlayerBalances(request.userId);

//     // Generate unique reference ID for tracking
//     const referenceId = `DEP_${Date.now()}_${nanoid(9)}`;

//     // Create deposit record
//     const deposit = await db
//       .insert(deposits)
//       .values({
//         id: nanoid(),
//         playerId: request.userId,
//         amount: request.amount,
//         status: DepositStatus.PENDING,
//         paymentMethod: request.paymentMethod,
//         referenceId: referenceId, // Store the reference ID
//         currency: request.currency || 'USD',
//         note: request.note,
//         metadata: {
//             ...request.metadata,
//             referenceId: referenceId // Also store in metadata for searching
//         }
//       })
//       .returning({ id: deposits.id });

//     if (!deposit[0]) throw new Error('Failed to create deposit record');
//     const depositId = deposit[0].id;

//     // Get payment instructions based on method
//     const instructions = await getPaymentInstructions(
//       request.paymentMethod,
//       referenceId,
//       request.amount,
//     );

//     return {
//       success: true,
//       depositId,
//       status: DepositStatus.PENDING,
//       instructions,
//       referenceId,
//     };
//   } catch (error) {
//     console.error('Deposit initiation failed:', error);
//     return {
//       success: false,
//       status: DepositStatus.FAILED,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// }

// /**
//  * Process webhook confirmation for completed deposit
//  */
// export async function processDepositConfirmation(
//   confirmation: WebhookConfirmation,
// ): Promise<DepositCompletionResult> {

//   let pendingDeposit: TDeposits | undefined;

//   try {
//     // Find pending deposit by transaction ID (referenceId)
//     pendingDeposit = await db.query.deposits.findFirst({
//       where: and(
//         eq(deposits.status, DepositStatus.PENDING),
//         eq(deposits.referenceId, confirmation.transactionId),
//         // This SQL search is less efficient, but good as a fallback
//         // sql`metadata->>'referenceId' = ${confirmation.transactionId}`,
//       ),
//     });

//     if (!pendingDeposit) {
//       throw new Error(`No pending deposit found for reference ${confirmation.transactionId}`);
//     }

//     if (confirmation.amount < pendingDeposit.amount) {
//         // Handle partial payment or mismatch
//         console.warn(`Webhook amount ${confirmation.amount} is less than pending deposit ${pendingDeposit.amount} for ${pendingDeposit.id}`);
//         // For now, we'll accept the webhook amount
//     }

//     const playerId = pendingDeposit.playerId;
//     if (!playerId) {
//          throw new Error(`Critical: Deposit ${pendingDeposit.id} has no playerId.`);
//     }

//     const result = await db.transaction(async (tx) => {
//       // 1. Update deposit status to completed
//       await tx
//         .update(deposits)
//         .set({
//           status: DepositStatus.COMPLETED,
//           updatedAt: new Date(),
//           metadata: {
//               ...pendingDeposit?.metadata,
//               webhookData: confirmation
//           }
//         })
//         .where(eq(deposits.id, pendingDeposit!.id));

//       // 2. Credit user balance USING WAGERING MANAGER
//       // This handles balance update AND adds wagering requirement
//       const newBalance = await wageringManager.handleDeposit({
//           playerId: playerId,
//           amount: confirmation.amount // Use the amount from the webhook
//       });

//       // 3. Log transaction (WageringManager already does this)
//       // We can add a cross-reference transactionId to the deposit record

//       const depositTx = await tx.query.transactions.findFirst({
//           where: and(
//               eq(transactions.playerId, playerId),
//               eq(transactions.type, 'DEPOSIT')
//           ),
//           orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
//           limit: 1
//       });

//       if (depositTx) {
//           await tx
//             .update(deposits)
//             .set({ transactionId: depositTx.id })
//             .where(eq(deposits.id, pendingDeposit!.id));
//       }

//       // 4. Apply deposit bonuses (VIP XP, etc.)
//       const bonusResult = await applyDepositBonuses(playerId, confirmation.amount);

//       return {
//         success: true,
//         depositId: pendingDeposit!.id,
//         amount: confirmation.amount,
//         bonusApplied: bonusResult,
//       };
//     });

//     // 5. Send real-time balance notification
//     const currentBalance = await wageringManager.getPlayerBalances(playerId);
//     await notifyBalanceChange(playerId, {
//       realBalance: currentBalance.realBalance,
//       bonusBalance: currentBalance.bonusBalance,
//       totalBalance: currentBalance.realBalance + currentBalance.bonusBalance,
//       changeAmount: confirmation.amount,
//       changeType: 'deposit', // More specific
//     });

//     return result;

//   } catch (error) {
//     console.error('Deposit confirmation processing failed:', error);

//     // If we found a deposit, mark it as FAILED
//     if (pendingDeposit) {
//         await db.update(deposits).set({
//             status: DepositStatus.FAILED,
//             note: error instanceof Error ? error.message : 'Unknown processing error'
//         }).where(eq(deposits.id, pendingDeposit.id));
//     }

//     return {
//       success: false,
//       depositId: pendingDeposit?.id || '',
//       amount: confirmation.amount,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// }

// /**
//  * Get payment instructions for different payment methods
//  */
// async function getPaymentInstructions(
//   method: PaymentMethod,
//   referenceId: string,
//   amount: number,
// ): Promise<string> {
//   const amountInDollars = (amount / 100).toFixed(2);
//   const cashappTag = process.env.CASHAPP_TAG || '$YourCashAppTag'; // Use env variable

//   switch (method) {
//     case PaymentMethod.CASHAPP:
//       return `Send $${amountInDollars} via CashApp to ${cashappTag}. You MUST include this in the 'For' note: ${referenceId}`;

//     case PaymentMethod.INSTORE_CASH:
//       return `Visit any participating store location and provide reference: ${referenceId}. Pay $${amountInDollars} in cash.`;

//     case PaymentMethod.INSTORE_CARD:
//       return `Visit any participating store location and provide reference: ${referenceId}. Pay $${amountInDollars} by card.`;

//     default:
//       return `Complete payment of $${amountInDollars} using reference: ${referenceId}`;
//   }
// }

// /**
//  * Apply deposit bonuses (XP and free spins)
//  */
// async function applyDepositBonuses(
//   userId: string,
//   amount: number,
// ): Promise<{ xpGained: number; freeSpinsAwarded: number }> {
//   let xpGained = 0;
//   let freeSpinsAwarded = 0;

//   try {
//     // Calculate XP bonus (1 XP per $1 deposited)
//     const xpAmount = Math.floor(amount / 100);
//     if (xpAmount > 0) {
//       const vipResult = await addXpToUser(userId, xpAmount);
//       if (vipResult.success) {
//         xpGained = xpAmount;
//       }
//     }

//     // Award free spins based on deposit amount
//     let spinsToAward = 0;
//     if (amount >= 10000) { // $100+
//       spinsToAward = 10;
//     } else if (amount >= 5000) { // $50+
//       spinsToAward = 5;
//     }

//     // Check if it's the first completed deposit
//     const firstDeposit = await checkFirstTimeDeposit(userId);
//     if (firstDeposit) {
//       spinsToAward += 20; // Extra 20 free spins for first deposit
//       console.log(`First-time deposit bonus: Awarding 20 extra free spins to ${userId}`);
//     }

//     if (spinsToAward > 0) {
//         await wageringManager.grantFreeSpins({ playerId: userId, count: spinsToAward });
//         freeSpinsAwarded = spinsToAward;
//         console.log(`Awarding ${spinsToAward} free spins to user ${userId}`);
//     }

//     return { xpGained, freeSpinsAwarded };
//   } catch (error) {
//     console.error(`Failed to apply deposit bonuses for ${userId}:`, error);
//     return { xpGained: 0, freeSpinsAwarded: 0 };
//   }
// }

// /**
//  * Check if this is user's first *completed* deposit
//  */
// async function checkFirstTimeDeposit(userId: string): Promise<boolean> {
//   const completedDeposits = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(deposits)
//       .where(
//           and(
//               eq(deposits.playerId, userId),
//               eq(deposits.status, DepositStatus.COMPLETED)
//           )
//       );

//   // The deposit being processed is not yet marked as COMPLETED in this check,
//   // so if the count is 0, this is the first one.
//   return completedDeposits[0].count === 0;
// }

// /**
//  * Get deposit status and details
//  */
// export async function getDepositStatus(depositId: string): Promise<{
//   deposit?: TDeposits;
//   status: DepositStatus;
//   error?: string;
// } | null> {
//   try {
//     const deposit = await db.query.deposits.findFirst({
//       where: eq(deposits.id, depositId),
//     });

//     if (!deposit) {
//       return {
//         status: DepositStatus.FAILED,
//         error: 'Deposit not found',
//       };
//     }

//     return {
//       deposit,
//       status: deposit.status as DepositStatus,
//     };
//   } catch (error) {
//     console.error('Failed to get deposit status:', error);
//     return {
//       status: DepositStatus.FAILED,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// }

// /**
//  * Get user's deposit history
//  */
// export async function getUserDepositHistory(
//   userId: string,
//   limit: number = 50,
//   offset: number = 0,
// ): Promise<{
//   deposits: TDeposits[];
//   total: number;
//   error?: string;
// }> {
//   try {
//     const depositsList = await db.query.deposits.findMany({
//       where: eq(deposits.playerId, userId),
//       orderBy: (deposits, { desc }) => [desc(deposits.createdAt)],
//       limit,
//       offset,
//     });

//     const total = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(deposits)
//       .where(eq(deposits.playerId, userId));

//     if (!total[0]) throw new Error('no total');

//     return {
//       deposits: depositsList,
//       total: total[0].count,
//     };
//   } catch (error) {
//     console.error('Failed to get deposit history:', error);
//     return {
//       deposits: [],
//       total: 0,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// }

// /**
//  * Cancel expired pending deposits
//  */
// export async function cleanupExpiredDeposits(): Promise<{
//   cancelled: number;
//   error?: string;
// }> {
//   try {
//     const expiryHours = 24; // Deposits expire after 24 hours
//     const expiryDate = new Date(Date.now() - expiryHours * 60 * 60 * 1000);

//     const result = await db
//       .update(deposits)
//       .set({
//         status: DepositStatus.EXPIRED,
//         updatedAt: new Date(),
//       })
//       .where(
//         and(
//           eq(deposits.status, DepositStatus.PENDING),
//           sql`${deposits.createdAt} < ${expiryDate.toISOString()}`,
//         ),
//       ).returning({ id: deposits.id });

//     return { cancelled: result.length || 0 };
//   } catch (error) {
//     console.error('Failed to cleanup expired deposits:', error);
//     return {
//       cancelled: 0,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// }
