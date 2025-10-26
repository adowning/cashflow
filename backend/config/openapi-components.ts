import
  {
    UserSchema,
    VipCashbackSchema,
    VipLevelSchema,
    VipLevelUpBonusSchema,
    VipRankSchema,
    VipSpinRewardSchema,
    WalletsSchema,
  } from "@/types";
import { z } from '@hono/zod-openapi';

/**
 * Reusable OpenAPI components for consistent API documentation
 */

// User-related components
export const UserComponents = {
  schemas: {
    User: UserSchema,
    UserAmount: z.object({
      amount: z.number(),
      currency: z.object({
        fiat: z.boolean(),
        name: z.string(),
        symbol: z.string(),
        type: z.string(),
      }),
      withdraw: z.number(),
      rate: z.number(),
    }),
    UserCheck: z.object({
      userCheck: z.boolean(),
    }),
    VipInfo: z.object({
      vipLevel: z.number().nullable(),
    }),
  },
} as const;

// VIP-related components
export const VipComponents = {
  schemas: {
    VipRank: VipRankSchema,
    VipLevel: VipLevelSchema,
    VipCashback: VipCashbackSchema,
    VipLevelUpBonus: VipLevelUpBonusSchema,
    VipSpinReward: VipSpinRewardSchema,
  },
} as const;

// Wallet-related components
export const WalletComponents = {
  schemas: {
    Wallet: WalletsSchema,
    WalletHistory: z.object({
      wallets: z.array(WalletsSchema),
    }),
    SwitchOperatorRequest: z.object({
      operatorId: z.string(),
      idempotencyKey: z.string().optional(),
    }),
    SwitchOperatorResponse: z.object({
      wallet: WalletsSchema,
    }),
  },
} as const;

// Common response components
export const CommonComponents = {
  schemas: {
    Error: z.object({
      error: z.string(),
    }),
    Message: z.object({
      message: z.string(),
    }),
    Success: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
    CashtagUpdate: z.object({
      cashtag: z.string(),
    }),
  },
} as const;

// Export all components combined
export const OpenAPIComponents = {
  schemas: {
    ...UserComponents.schemas,
    ...VipComponents.schemas,
    ...WalletComponents.schemas,
    ...CommonComponents.schemas,
  },
} as const;