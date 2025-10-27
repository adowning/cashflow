import db from "@@/database";
import {
  transactions,
  transactionTypeEnum,
  transactionStatusEnum,
} from "@@/database/schema";
import { createId } from "@paralleldrive/cuid2";
import { nanoid } from "nanoid";

export interface LogTransactionRequest {
  playerId: string;
  type: (typeof transactionTypeEnum.enumValues)[number];
  status: (typeof transactionStatusEnum.enumValues)[number];
  wagerAmount?: number | 0;
  winAmount?: number | 0;
  realBalanceBefore: number;
  realBalanceAfter: number;
  bonusBalanceBefore: number;
  bonusBalanceAfter: number;
  relatedId?: string;
  sessionId?: string;
  gameId?: string;
  gameName?: string;
  operatorId?: string | "house";
  ggrContribution?: number | 0;
  vipPointsAdded?: number | 0;
  affiliateName?: string | "adminuser";
  processingTime?: number | 0;
  jackpotContribution?: number | 0;
  metadata?: Record<string, unknown>;
}

/**
 * Logs a financial transaction to the transactions table for auditing.
 */
export async function logTransaction(
  request: LogTransactionRequest
): Promise<any> {
  try {
    const transaction = await db
      .insert(transactions)
      .values({
        id: createId(),
        playerId: request.playerId,
        type: request.type,
        status: request.status,
        wagerAmount: request.wagerAmount,

        realBalanceBefore: request.realBalanceBefore,
        realBalanceAfter: request.realBalanceAfter,
        bonusBalanceBefore: request.bonusBalanceBefore,
        bonusBalanceAfter: request.bonusBalanceAfter,
        ggrContribution: request.bonusBalanceAfter,
        jackpotContribution: request.bonusBalanceAfter,
        processingTime: request.processingTime,
        vipPointsAdded: request.vipPointsAdded,
        affiliateName: request.affiliateName,
        relatedId: request.relatedId,
        sessionId: request.sessionId,
        gameId: request.gameId,
        gameName: request.gameName,

        operatorId: "house", //request.operatorId,
        metadata: request.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return transaction;
  } catch (error) {
    console.error(
      `[TransactionService] Failed to log transaction for player ${request.playerId}:`,
      error
    );
    // In a real app, you might add this to a retry queue
  }
}
