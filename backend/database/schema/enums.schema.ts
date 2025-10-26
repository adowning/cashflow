import { pgEnum } from 'drizzle-orm/pg-core';

import { createSelectSchema } from 'drizzle-zod';

import { z } from 'zod';

export const tournamentStatusEnum = pgEnum('TournamentStatus', [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
]);

export const ZTournamentStatusSelectSchema = createSelectSchema(tournamentStatusEnum);

export type TTournamentStatus = z.infer<typeof tournamentStatusEnum>;

export type TTournamentStatusSelect = TTournamentStatus;

export const playerRoleEnum = pgEnum('PlayerRole', [
  'PLAYER',
  'ADMIN',
  'MODERATOR',
  'SUPPORT',
  'BOT',
  'SYSTEM',
]);

export const ZPlayerRoleSelectSchema = createSelectSchema(playerRoleEnum);

export type TPlayerRole = z.infer<typeof playerRoleEnum>;

export type TPlayerRoleSelect = TPlayerRole;

// --- User/Auth Enums ---
export const userRoleEnum = pgEnum('user_role_enum', [
  'USER',
  'ADMIN',
  'AFFILIATE',
  'SUPER_AFFILIATE',
  'MODERATOR',
  'SUPPORT',
  'BOT',
  'SYSTEM',
]); // Added from auth/core

export const ZUserRoleSelectSchema = createSelectSchema(userRoleEnum);

export type TUserRole = z.infer<typeof userRoleEnum>;

export type TUserRoleSelect = TUserRole;
export const userStatusEnum = pgEnum('user_status_enum', [
  'ACTIVE',
  'INACTIVE',
  'BANNED',
  'PENDING',
]); // Added from generated/core

export const ZUserStatusSelectSchema = createSelectSchema(userStatusEnum);

export type TUserStatus = z.infer<typeof userStatusEnum>;

export type TUserStatusSelect = TUserStatus;

// --- Transaction/Payment Enums ---
export const transactionTypeEnum = pgEnum('transaction_type_enum', [
  'DEPOSIT',
  'WITHDRAWAL',
  'BET',
  'WIN',
  'BONUS_AWARD', // Added from core
  'BONUS_WAGER', // Added from core
  'BONUS_CONVERT', // Added from core
  'ADJUSTMENT', // Added from generated
  'CASHBACK', // Added from generated
  'AFFILIATE_PAYOUT', // Added from generated
  'BONUS', // Keep generic bonus? (From generated)
]);

export const ZTransactionTypeSelectSchema = createSelectSchema(transactionTypeEnum);

export type TTransactionType = z.infer<typeof transactionTypeEnum>;

export type TTransactionTypeSelect = TTransactionType;
export const transactionStatusEnum = pgEnum('transaction_status_enum', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REJECTED', // Added from generated/withdrawal
  'EXPIRED', // Added from generated/deposit
]);

export const ZTransactionStatusSelectSchema = createSelectSchema(transactionStatusEnum);

export type TTransactionStatus = z.infer<typeof transactionStatusEnum>;

export type TTransactionStatusSelect = TTransactionStatus;
export const paymentMethodEnum = pgEnum('payment_method_enum', [
  'INSTORE_CASH',
  'INSTORE_CARD',
  'CASHAPP',
  'CRYPTO',
  'BANK_TRANSFER',
  'CHECK',
]); // Added more from withdrawal

export const ZPaymentMethodSelectSchema = createSelectSchema(paymentMethodEnum);

export type TPaymentMethod = z.infer<typeof paymentMethodEnum>;

export type TPaymentMethodSelect = TPaymentMethod;
export const depositStatusEnum = transactionStatusEnum; // Alias for consistency
export const withdrawalStatusEnum = transactionStatusEnum; // Alias for consistency
export const payoutMethodEnum = paymentMethodEnum; // Alias for consistency

// --- Bonus Enums ---
export const bonusTypeEnum = pgEnum('bonus_type_enum', [
  'DEPOSIT_MATCH',
  'FREE_SPINS',
  'CASHBACK',
  'LEVEL_UP',
  'MANUAL',
]); // Added from generated

export const ZBonusTypeSelectSchema = createSelectSchema(bonusTypeEnum);

export type TBonusType = z.infer<typeof bonusTypeEnum>;

export type TBonusTypeSelect = TBonusType;
export const bonusStatusEnum = pgEnum('bonus_status_enum', [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
]); // Added from core/generated

export const ZBonusStatusSelectSchema = createSelectSchema(bonusStatusEnum);

export type TBonusStatus = z.infer<typeof bonusStatusEnum>;

export type TBonusStatusSelect = TBonusStatus;

// --- Game/Session Enums ---
export const gameStatusEnum = pgEnum('game_status_enum', ['ACTIVE', 'INACTIVE', 'MAINTENANCE']); // Added from generated

export const ZGameStatusSelectSchema = createSelectSchema(gameStatusEnum);

export type TGameStatus = z.infer<typeof gameStatusEnum>;

export type TGameStatusSelect = TGameStatus;
export const sessionStatusEnum = pgEnum('session_status_enum', [
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'ABANDONED',
  'TIMEOUT',
  'OTP_PENDING',
]); // From other.schema

export const ZSessionStatusSelectSchema = createSelectSchema(sessionStatusEnum);

export type TSessionStatus = z.infer<typeof sessionStatusEnum>;

export type TSessionStatusSelect = TSessionStatus;
export const gameCategoriesEnum = pgEnum('game_categories_enum', [
  'SLOTS',
  'FISH',
  'TABLE',
  'LIVE',
  'OTHER',
]); // From enums/core + additions

export const ZGameCategoriesSelectSchema = createSelectSchema(gameCategoriesEnum);

export type TGameCategories = z.infer<typeof gameCategoriesEnum>;

export type TGameCategoriesSelect = TGameCategories;

// --- Jackpot Enums ---
export const jackpotGroupEnum = pgEnum('jackpot_group_enum', ['minor', 'major', 'mega']); // Added from generated

export const ZJackpotGroupSelectSchema = createSelectSchema(jackpotGroupEnum);

export type TJackpotGroup = z.infer<typeof jackpotGroupEnum>;

export type TJackpotGroupSelect = TJackpotGroup;
export const typeOfJackpotEnum = pgEnum('type_of_jackpot_enum', ['MINOR', 'MAJOR', 'GRAND']); // From enums.schema - reconcile? Using jackpotGroupEnum seems more consistent.

export const ZTypeOfJackpotSelectSchema = createSelectSchema(typeOfJackpotEnum);

export type TTypeOfJackpot = z.infer<typeof typeOfJackpotEnum>;

export type TTypeOfJackpotSelect = TTypeOfJackpot;

// --- KYC Enums ---
export const kycStatusEnum = pgEnum('kyc_status_enum', [
  'NOT_STARTED',
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
]); // Added from generated

export const ZKycStatusSelectSchema = createSelectSchema(kycStatusEnum);

export type TKycStatus = z.infer<typeof kycStatusEnum>;

export type TKycStatusSelect = TKycStatus;
export const kycDocumentTypeEnum = pgEnum('kyc_document_type_enum', [
  'PASSPORT',
  'DRIVERS_LICENSE',
  'ID_CARD',
  'RESIDENCE_PERMIT',
]); // Added from generated

export const ZKycDocumentTypeSelectSchema = createSelectSchema(kycDocumentTypeEnum);

export type TKycDocumentType = z.infer<typeof kycDocumentTypeEnum>;

export type TKycDocumentTypeSelect = TKycDocumentType;

// --- Misc Enums ---
export const typeEnum = pgEnum('type_enum', ['ADD', 'OUT']); // From enums.schema

export const ZTypeSelectSchema = createSelectSchema(typeEnum);

export type TType = z.infer<typeof typeEnum>;

export type TTypeSelect = TType;
export const progressTypeEnum = pgEnum('progress_type_enum', ['ONE_PAY', 'SUM_PAY']); // From enums.schema

export const ZProgressTypeSelectSchema = createSelectSchema(progressTypeEnum);

export type TProgressType = z.infer<typeof progressTypeEnum>;

export type TProgressTypeSelect = TProgressType;
export const loyaltyFundTransactionTypeEnum = pgEnum('loyalty_fund_transaction_type_enum', [
  'CONTRIBUTION',
  'PAYOUT',
]); // From enums.schema

export const ZLoyaltyFundTransactionTypeSelectSchema = createSelectSchema(loyaltyFundTransactionTypeEnum);

export type TLoyaltyFundTransactionType = z.infer<typeof loyaltyFundTransactionTypeEnum>;

export type TLoyaltyFundTransactionTypeSelect = TLoyaltyFundTransactionType;
export const messageTypeEnum = pgEnum('message_type_enum', [
  'update:vip',
  'update:balance',
  'update:gameSession',
]); // From enums.schema

export const ZMessageTypeSelectSchema = createSelectSchema(messageTypeEnum);

export type TMessageType = z.infer<typeof messageTypeEnum>;

export type TMessageTypeSelect = TMessageType;
export const updateTypeEnum = pgEnum('update_type_enum', ['BINARY', 'OTA']); // From enums.schema

export const ZUpdateTypeSelectSchema = createSelectSchema(updateTypeEnum);

export type TUpdateType = z.infer<typeof updateTypeEnum>;

export type TUpdateTypeSelect = TUpdateType;
