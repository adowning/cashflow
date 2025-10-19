import { z } from "@hono/zod-openapi";

// Simplified schemas to avoid runtime issues with Drizzle integration
export const UserSchema = z
	.object({
		id: z.string(),
		username: z.string(),
		email: z.string().nullable(),
		avatarUrl: z.string(),
		role: z.string(),
		isActive: z.boolean(),
		totalXpGained: z.number(),
		vipInfoId: z.string().nullable(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("User");

export const WalletSchema = z
	.object({
		id: z.string(),
		balance: z.number(),
		paymentMethod: z.string(),
		currency: z.string(),
		address: z.string().nullable(),
		cashtag: z.string().nullable(),
		isActive: z.boolean(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("Wallet");

export const TransactionSchema = z
	.object({
		id: z.string(),
		type: z.string(),
		status: z.string(),
		amount: z.number(),
		netAmount: z.number().nullable(),
		currencyName: z.string().nullable(),
		feeAmount: z.number().nullable(),
		description: z.string().nullable(),
		provider: z.string().nullable(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("Transaction");

export const DepositSchema = z
	.object({
		id: z.string(),
		amount: z.number(),
		status: z.string(),
		idNumber: z.string().nullable(),
		firstName: z.string().nullable(),
		lastName: z.string().nullable(),
		note: z.string().nullable(),
		currency: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("Deposit");

export const WithdrawalSchema = z
	.object({
		id: z.string(),
		amount: z.number(),
		status: z.string(),
		idNumber: z.string().nullable(),
		firstName: z.string().nullable(),
		lastName: z.string().nullable(),
		note: z.string().nullable(),
		currencyType: z.string().nullable(),
		currency: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("Withdrawal");

export const GameSpinSchema = z
	.object({
		id: z.string(),
		playerName: z.string().nullable(),
		gameName: z.string().nullable(),
		gameId: z.string().nullable(),
		grossWinAmount: z.number(),
		wagerAmount: z.number(),
		spinNumber: z.number(),
		playerAvatar: z.string().nullable(),
		currencyId: z.string().nullable(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("GameSpin");

export const VipInfoSchema = z
	.object({
		id: z.string(),
		level: z.number(),
		xp: z.number(),
		totalXp: z.number(),
		currentRankid: z.number().nullable(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("VipInfo");

export const ReferralCodeSchema = z
	.object({
		id: z.string(),
		code: z.string(),
		name: z.string(),
		commissionRate: z.number(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("ReferralCode");

// Request schemas for player operations
export const UpdateUsernameRequestSchema = z
	.object({
		username: z.string().min(3).max(20).openapi({
			description: "The new, unique username for the player.",
			example: "NewGamer123",
		}),
	})
	.openapi("UpdateUsernameRequest");

export const UpdateCurrencyRequestSchema = z
	.object({
		currency: z.string().min(3).max(3).openapi({
			description: "The currency code to set for the player.",
			example: "USD",
		}),
	})
	.openapi("UpdateCurrencyRequest");

export const UpdateAvatarRequestSchema = z
	.object({
		avatarUrl: z.string().url().openapi({
			description: "The URL of the new avatar image.",
			example: "https://example.com/avatar.jpg",
		}),
	})
	.openapi("UpdateAvatarRequest");

export const UpdatePasswordRequestSchema = z
	.object({
		currentPassword: z.string().min(8).openapi({
			description: "The current password for verification.",
			example: "currentPassword123",
		}),
		newPassword: z.string().min(8).openapi({
			description: "The new password to set.",
			example: "newPassword123",
		}),
	})
	.openapi("UpdatePasswordRequest");

export const CreateTransactionRequestSchema = z
	.object({
		amount: z.number().positive().openapi({
			description: "The transaction amount.",
			example: 100.5,
		}),
		type: z.enum(["DEPOSIT", "WITHDRAWAL", "BET", "WIN"]).openapi({
			description: "The type of transaction.",
			example: "DEPOSIT",
		}),
		description: z.string().optional().openapi({
			description: "Optional description for the transaction.",
			example: "Game deposit",
		}),
	})
	.openapi("CreateTransactionRequest");

export const CreateDepositRequestSchema = z
	.object({
		amount: z.number().positive().openapi({
			description: "The deposit amount.",
			example: 100.0,
		}),
		currency: z.string().min(3).max(3).openapi({
			description: "The currency for the deposit.",
			example: "USD",
		}),
		paymentMethod: z.string().openapi({
			description: "The payment method to use.",
			example: "CREDIT_CARD",
		}),
	})
	.openapi("CreateDepositRequest");

export const CreateWithdrawalRequestSchema = z
	.object({
		amount: z.number().positive().openapi({
			description: "The withdrawal amount.",
			example: 50.0,
		}),
		currency: z.string().min(3).max(3).openapi({
			description: "The currency for the withdrawal.",
			example: "USD",
		}),
		paymentMethod: z.string().openapi({
			description: "The payment method to use.",
			example: "BANK_TRANSFER",
		}),
	})
	.openapi("CreateWithdrawalRequest");

export const CreateBonusRequestSchema = z
	.object({
		bonusType: z.string().openapi({
			description: "The type of bonus to create.",
			example: "WELCOME_BONUS",
		}),
		amount: z.number().positive().openapi({
			description: "The bonus amount.",
			example: 25.0,
		}),
	})
	.openapi("CreateBonusRequest");

// Response schemas
export const PlayerBalanceResponseSchema = z
	.object({
		balance: z.number().openapi({
			description: "The current balance of the player.",
			example: 150.75,
		}),
		currency: z.string().openapi({
			description: "The currency of the balance.",
			example: "USD",
		}),
	})
	.openapi("PlayerBalanceResponse");

export const PlayerGamesResponseSchema = z
	.array(
		z
			.object({
				id: z.string().openapi({
					description: "The game ID.",
					example: "game_123",
				}),
				name: z.string().openapi({
					description: "The name of the game.",
					example: "Slot Machine Deluxe",
				}),
				category: z.string().openapi({
					description: "The game category.",
					example: "slots",
				}),
				thumbnailUrl: z.string().nullable().openapi({
					description: "The thumbnail URL of the game.",
					example: "https://example.com/game-thumb.jpg",
				}),
				isActive: z.boolean().openapi({
					description: "Whether the game is currently active.",
					example: true,
				}),
			})
			.openapi({
				description: "List of games available to the player.",
			}),
	)
	.openapi("PlayerGamesResponse");

export const PlayerTransactionsResponseSchema = z
	.array(
		z
			.object({
				id: z.string().openapi({
					description: "The transaction ID.",
					example: "txn_123",
				}),
				type: z.string().openapi({
					description: "The type of transaction.",
					example: "DEPOSIT",
				}),
				amount: z.number().openapi({
					description: "The transaction amount.",
					example: 100.0,
				}),
				status: z.string().openapi({
					description: "The transaction status.",
					example: "COMPLETED",
				}),
				createdAt: z.string().openapi({
					description: "The transaction creation timestamp.",
					example: "2023-10-01T12:00:00Z",
				}),
			})
			.openapi({
				description: "List of player transactions.",
			}),
	)
	.openapi("PlayerTransactionsResponse");

export const PlayerProfileResponseSchema = UserSchema.extend({
	vipInfo: VipInfoSchema.nullable().openapi({
		description: "VIP information for the player.",
	}),
	wallet: WalletSchema.nullable().openapi({
		description: "Primary wallet information.",
	}),
}).openapi("PlayerProfileResponse");

export const KycStatusResponseSchema = z
	.object({
		status: z.enum(["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED"]).openapi({
			description: "The KYC verification status.",
			example: "PENDING",
		}),
		documents: z
			.array(
				z.object({
					type: z.string().openapi({
						description: "The document type.",
						example: "PASSPORT",
					}),
					status: z.enum(["PENDING", "APPROVED", "REJECTED"]).openapi({
						description: "The document verification status.",
						example: "PENDING",
					}),
					uploadedAt: z.string().openapi({
						description: "When the document was uploaded.",
						example: "2023-10-01T12:00:00Z",
					}),
				}),
			)
			.openapi({
				description: "List of KYC documents.",
			}),
	})
	.openapi("KycStatusResponse");

// Generic response schemas
export const SuccessResponseSchema = z
	.object({
		success: z.boolean().openapi({
			example: true,
		}),
		message: z.string().openapi({
			example: "Operation was successful.",
		}),
	})
	.openapi("SuccessResponse");

export const ErrorResponseSchema = z
	.object({
		error: z.string().openapi({
			description: "Error message.",
			example: "Invalid request parameters",
		}),
		code: z.string().optional().openapi({
			description: "Error code for programmatic handling.",
			example: "VALIDATION_ERROR",
		}),
	})
	.openapi("ErrorResponse");
