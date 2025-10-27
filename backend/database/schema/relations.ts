import { relations } from "drizzle-orm";

// --- Import all tables ---

// from auth.schema.ts
import {
  users,
  usersRoles,
  roles,
  authSessions,
  accounts,
} from "./auth.schema";

// from core.schema.ts
import {
  players,
  balances,
  operators,
  games,
  transactions,
  vipRanks,
} from "./core.schema";

// from other.schema.ts
import {
  deposits,
  withdrawals,
  gameSessions,
  jackpots,
  jackpotContributions,
  jackpotWins,
  referralCodes,
  kycSubmissions,
  kycDocuments,
  passwordLogs,
  operatorSwitchHistories,
  products,
  operatorSettlements,
  loyaltyFundTransactions,
} from "./other.schema";

// from vip.schema.ts
import {
  bonuses,
  playerBonuses,
  affiliateLogs,
  affiliatePayouts,
  vipCashbacks,
  vipLevelUpBonuses,
  vipSpinRewards,
  // vipLevels, // No apparent relations
  // commissions, // No apparent relations
} from "./vip.schema";

// --- Define Relations ---

// Relations for auth.schema.ts
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(authSessions, { relationName: "SessionToUser" }),
  userRoles: many(usersRoles),
  accounts: many(accounts, { relationName: "AccountToUser" }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  usersRoles: many(usersRoles),
}));

export const usersRolesRelations = relations(usersRoles, ({ one }) => ({
  user: one(users, {
    fields: [usersRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [usersRoles.roleId],
    references: [roles.id],
  }),
}));

export const sessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    relationName: "SessionToUser",
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    relationName: "AccountToUser",
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Relations for core.schema.ts
export const playersRelations = relations(players, ({ one, many }) => ({
  balance: one(balances, {
    fields: [players.id],
    references: [balances.playerId],
  }),
  transactions: many(transactions),
  deposits: many(deposits),
  withdrawals: many(withdrawals),
  gameSessions: many(gameSessions),
  jackpotWins: many(jackpotWins, { relationName: "JackpotWinner" }),
  jackpotContributions: many(jackpotContributions),
  referralCodes: many(referralCodes, { relationName: "ReferralCodeOwner" }),
  kycSubmission: one(kycSubmissions, {
    fields: [players.id],
    references: [kycSubmissions.playerId],
  }),
  kycDocuments: many(kycDocuments),
  passwordLogs: many(passwordLogs, { relationName: "PasswordLogUser" }),
  passwordLogsAsActor: many(passwordLogs, { relationName: "PasswordLogActor" }),
  operatorSwitchHistories: many(operatorSwitchHistories),
  loyaltyFundTransactions: many(loyaltyFundTransactions),
  playerBonuses: many(playerBonuses),
  affiliateLogsAsInvitor: many(affiliateLogs, {
    relationName: "AffiliateInvitor",
  }),
  affiliateLogsAsChild: many(affiliateLogs, {
    relationName: "AffiliateChild",
  }),
  affiliatePayouts: many(affiliatePayouts, { relationName: "AffiliatePayout" }),
  vipCashbacks: many(vipCashbacks),
  vipLevelUpBonuses: many(vipLevelUpBonuses),
  vipSpinRewards: many(vipSpinRewards),
  invitor: one(players, {
    fields: [players.invitorId],
    references: [players.id],
    relationName: "Referrals",
  }),
  invitees: many(players, {
    // fields: [players.id], // REMOVED - This is defined in the 'invitor' relation
    // references: [players.invitorId], // REMOVED
    relationName: "Referrals",
  }),
  vipRank: one(vipRanks, {
    fields: [players.vipRankId],
    references: [vipRanks.id],
  }),
}));

export const balancesRelations = relations(balances, ({ one }) => ({
  player: one(players, {
    fields: [balances.playerId],
    references: [players.id],
  }),
}));

export const operatorsRelations = relations(operators, ({ many }) => ({
  games: many(games),
  transactions: many(transactions),
  operatorSwitchHistoriesAsFrom: many(operatorSwitchHistories, {
    relationName: "FromOperator",
  }),
  operatorSwitchHistoriesAsTo: many(operatorSwitchHistories, {
    relationName: "ToOperator",
  }),
  products: many(products),
  operatorSettlements: many(operatorSettlements),
  loyaltyFundTransactions: many(loyaltyFundTransactions),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  operator: one(operators, {
    fields: [games.operatorId],
    references: [operators.id],
  }),
  transactions: many(transactions),
  gameSessions: many(gameSessions),
  jackpotContributions: many(jackpotContributions),
  jackpotWins: many(jackpotWins),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  player: one(players, {
    fields: [transactions.playerId],
    references: [players.id],
  }),
  game: one(games, {
    fields: [transactions.gameId],
    references: [games.id], // Updated to use games.id
  }),
  operator: one(operators, {
    fields: [transactions.operatorId],
    references: [operators.id],
  }),
  deposit: one(deposits, {
    fields: [transactions.id],
    references: [deposits.transactionId],
  }),
  withdrawal: one(withdrawals, {
    fields: [transactions.id],
    references: [withdrawals.transactionId],
  }),
  jackpotContribution: one(jackpotContributions, {
    fields: [transactions.id],
    references: [jackpotContributions.betTransactionId],
  }),
  jackpotWin: one(jackpotWins, {
    fields: [transactions.id],
    references: [jackpotWins.winTransactionId],
  }),
  vipCashback: one(vipCashbacks, {
    fields: [transactions.id],
    references: [vipCashbacks.transactionId],
  }),
  vipLevelUpBonus: one(vipLevelUpBonuses, {
    fields: [transactions.id],
    references: [vipLevelUpBonuses.transactionId],
  }),
  affiliatePayout: one(affiliatePayouts, {
    fields: [transactions.id],
    references: [affiliatePayouts.transactionId],
  }),
}));

export const vipRanksRelations = relations(vipRanks, ({ many }) => ({
  players: many(players),
}));

// Relations for other.schema.ts
export const depositsRelations = relations(deposits, ({ one }) => ({
  player: one(players, {
    fields: [deposits.playerId],
    references: [players.id],
  }),
  transaction: one(transactions, {
    fields: [deposits.transactionId],
    references: [transactions.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  player: one(players, {
    fields: [withdrawals.playerId],
    references: [players.id],
  }),
  transaction: one(transactions, {
    fields: [withdrawals.transactionId],
    references: [transactions.id],
  }),
}));

export const gameSessionsRelations = relations(
  gameSessions,
  ({ one, many }) => ({
    player: one(players, {
      fields: [gameSessions.playerId],
      references: [players.id],
    }),
    game: one(games, {
      fields: [gameSessions.gameId],
      references: [games.id], // Assuming this should reference games.id, not games.name
    }),
    jackpotWins: many(jackpotWins),
  })
);

export const jackpotsRelations = relations(jackpots, ({ one, many }) => ({
  jackpotContributions: many(jackpotContributions, {
    // fields: [jackpots.group], // REMOVED - This is defined in jackpotContributionsRelations
    // references: [jackpotContributions.jackpotGroup], // REMOVED
    relationName: "JackpotContributions", // <--- ADDED
  }),
  jackpotWins: many(jackpotWins, {
    // fields: [jackpots.group], // REMOVED - This is defined in jackpotWinsRelations
    // references: [jackpotWins.jackpotGroup], // REMOVED
    relationName: "JackpotWins", // <--- ADDED
  }),
  lastWonByPlayer: one(players, {
    fields: [jackpots.lastWonByPlayerId],
    references: [players.id],
  }),
}));

export const jackpotContributionsRelations = relations(
  jackpotContributions,
  ({ one }) => ({
    jackpot: one(jackpots, {
      fields: [jackpotContributions.jackpotGroup],
      references: [jackpots.group],
      relationName: "JackpotContributions", // <--- ADDED
    }),
    player: one(players, {
      fields: [jackpotContributions.playerId],
      references: [players.id],
    }),
    game: one(games, {
      fields: [jackpotContributions.gameId],
      references: [games.id], // Assuming this should reference games.id
    }),
    betTransaction: one(transactions, {
      fields: [jackpotContributions.betTransactionId],
      references: [transactions.id],
    }),
  })
);

export const jackpotWinsRelations = relations(jackpotWins, ({ one }) => ({
  jackpot: one(jackpots, {
    fields: [jackpotWins.jackpotGroup],
    references: [jackpots.group],
    relationName: "JackpotWins", // <--- ADDED
  }),
  winner: one(players, {
    fields: [jackpotWins.winnerId],
    references: [players.id],
    relationName: "JackpotWinner",
  }),
  game: one(games, {
    fields: [jackpotWins.gameId],
    references: [games.id], // Assuming this should reference games.id
  }),
  gameSession: one(gameSessions, {
    fields: [jackpotWins.gameSessionId],
    references: [gameSessions.id],
  }),
  winTransaction: one(transactions, {
    fields: [jackpotWins.winTransactionId],
    references: [transactions.id],
  }),
}));

export const referralCodesRelations = relations(referralCodes, ({ one }) => ({
  owner: one(players, {
    fields: [referralCodes.ownerId],
    references: [players.id],
    relationName: "ReferralCodeOwner",
  }),
}));

export const kycSubmissionsRelations = relations(
  kycSubmissions,
  ({ one, many }) => ({
    player: one(players, {
      fields: [kycSubmissions.playerId],
      references: [players.id],
    }),
    kycDocuments: many(kycDocuments, {
      relationName: "KycSubmissionDocuments",
    }),
  })
);

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  submission: one(kycSubmissions, {
    fields: [kycDocuments.submissionId],
    references: [kycSubmissions.id],
    relationName: "KycSubmissionDocuments",
  }),
  player: one(players, {
    fields: [kycDocuments.playerId],
    references: [players.id],
  }),
}));

export const passwordLogsRelations = relations(passwordLogs, ({ one }) => ({
  user: one(players, {
    fields: [passwordLogs.userId],
    references: [players.id],
    relationName: "PasswordLogUser",
  }),
  actor: one(players, {
    fields: [passwordLogs.actorId],
    references: [players.id],
    relationName: "PasswordLogActor",
  }),
}));

export const operatorSwitchHistoriesRelations = relations(
  operatorSwitchHistories,
  ({ one }) => ({
    player: one(players, {
      fields: [operatorSwitchHistories.playerId],
      references: [players.id],
    }),
    fromOperator: one(operators, {
      fields: [operatorSwitchHistories.fromOperatorId],
      references: [operators.id],
      relationName: "FromOperator",
    }),
    toOperator: one(operators, {
      fields: [operatorSwitchHistories.toOperatorId],
      references: [operators.id],
      relationName: "ToOperator",
    }),
  })
);

export const productsRelations = relations(products, ({ one }) => ({
  operator: one(operators, {
    fields: [products.operatorId],
    references: [operators.id],
  }),
}));

export const operatorSettlementsRelations = relations(
  operatorSettlements,
  ({ one }) => ({
    operator: one(operators, {
      fields: [operatorSettlements.operatorId],
      references: [operators.id],
    }),
  })
);

export const loyaltyFundTransactionsRelations = relations(
  loyaltyFundTransactions,
  ({ one }) => ({
    operator: one(operators, {
      fields: [loyaltyFundTransactions.operatorId],
      references: [operators.id],
    }),
    player: one(players, {
      fields: [loyaltyFundTransactions.playerId],
      references: [players.id],
    }),
  })
);

// Relations for vip.schema.ts
export const bonusesRelations = relations(bonuses, ({ many }) => ({
  playerBonuses: many(playerBonuses),
}));

export const playerBonusesRelations = relations(playerBonuses, ({ one }) => ({
  player: one(players, {
    fields: [playerBonuses.playerId],
    references: [players.id],
  }),
  bonus: one(bonuses, {
    fields: [playerBonuses.bonusId],
    references: [bonuses.id],
  }),
}));

export const affiliateLogsRelations = relations(affiliateLogs, ({ one }) => ({
  invitor: one(players, {
    fields: [affiliateLogs.invitorId],
    references: [players.id],
    relationName: "AffiliateInvitor",
  }),
  child: one(players, {
    fields: [affiliateLogs.childId],
    references: [players.id],
    relationName: "AffiliateChild",
  }),
  payout: one(affiliatePayouts, {
    fields: [affiliateLogs.payoutId],
    references: [affiliatePayouts.id],
    relationName: "AffiliatePayoutLogs",
  }),
}));

export const affiliatePayoutsRelations = relations(
  affiliatePayouts,
  ({ one, many }) => ({
    affiliate: one(players, {
      fields: [affiliatePayouts.affiliateId],
      references: [players.id],
      relationName: "AffiliatePayout",
    }),
    affiliateLogs: many(affiliateLogs, {
      relationName: "AffiliatePayoutLogs",
    }),
    transaction: one(transactions, {
      fields: [affiliatePayouts.transactionId],
      references: [transactions.id],
    }),
  })
);

export const vipCashbacksRelations = relations(vipCashbacks, ({ one }) => ({
  player: one(players, {
    fields: [vipCashbacks.playerId],
    references: [players.id],
  }),
  transaction: one(transactions, {
    fields: [vipCashbacks.transactionId],
    references: [transactions.id],
  }),
}));

export const vipLevelUpBonusesRelations = relations(
  vipLevelUpBonuses,
  ({ one }) => ({
    player: one(players, {
      fields: [vipLevelUpBonuses.playerId],
      references: [players.id],
    }),
    transaction: one(transactions, {
      fields: [vipLevelUpBonuses.transactionId],
      references: [transactions.id],
    }),
  })
);

export const vipSpinRewardsRelations = relations(vipSpinRewards, ({ one }) => ({
  player: one(players, {
    fields: [vipSpinRewards.playerId],
    references: [players.id],
  }),
}));
