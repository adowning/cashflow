import { z } from "@hono/zod-openapi";

// Affiliate schemas based on controller requirements
export const AffiliateSchema = z
	.object({
		id: z.string().openapi({ description: "Affiliate ID", example: "aff_123" }),
		username: z
			.string()
			.openapi({
				description: "Affiliate username",
				example: "affiliate_user",
			}),
		firstName: z
			.string()
			.openapi({ description: "First name", example: "John" }),
		lastName: z.string().openapi({ description: "Last name", example: "Doe" }),
		status: z
			.string()
			.openapi({ description: "Affiliate status", example: "active" }),
		email: z
			.string()
			.email()
			.openapi({
				description: "Email address",
				example: "john.doe@example.com",
			}),
		role: z
			.string()
			.openapi({ description: "User role", example: "AFFILIATE" }),
		referralCode: z
			.string()
			.openapi({ description: "Referral code", example: "AFF123" }),
		parentId: z
			.string()
			.nullable()
			.openapi({ description: "Parent affiliate ID", example: "aff_parent" }),
		path: z
			.array(z.string())
			.openapi({
				description: "Affiliate hierarchy path",
				example: ["aff_1", "aff_2"],
			}),
		password: z
			.string()
			.openapi({
				description: "Password (hashed)",
				example: "hashed_password",
			}),
		createdAt: z
			.string()
			.openapi({
				description: "Creation timestamp",
				example: "2023-10-01T12:00:00Z",
			}),
		updatedAt: z
			.string()
			.openapi({
				description: "Last update timestamp",
				example: "2023-10-01T12:00:00Z",
			}),
	})
	.openapi("Affiliate");

// Request schemas for affiliate operations
export const UpdateAffiliateRequestSchema = z
	.object({
		username: z.string().min(3).max(20).optional().openapi({
			description: "New username for the affiliate.",
			example: "new_affiliate_user",
		}),
		email: z.string().email().optional().openapi({
			description: "New email address.",
			example: "new.email@example.com",
		}),
		firstName: z.string().min(1).max(50).optional().openapi({
			description: "First name.",
			example: "Jane",
		}),
		lastName: z.string().min(1).max(50).optional().openapi({
			description: "Last name.",
			example: "Smith",
		}),
	})
	.openapi("UpdateAffiliateRequest");

export const UpdatePasswordRequestSchema = z
	.object({
		oldPassword: z.string().min(8).openapi({
			description: "Current password for verification.",
			example: "currentPassword123",
		}),
		newPassword: z.string().min(8).openapi({
			description: "New password to set.",
			example: "newPassword123",
		}),
	})
	.openapi("UpdatePasswordRequest");

export const GetDashboardRequestSchema = z
	.object({
		duration: z.string().optional().openapi({
			description:
				'Time duration for dashboard data (e.g., "7d", "30d", "all").',
			example: "30d",
		}),
	})
	.openapi("GetDashboardRequest");

export const GetDashboardAnalysisRequestSchema = z
	.object({
		startDate: z.string().optional().openapi({
			description: "Start date for analysis (ISO format).",
			example: "2023-10-01T00:00:00Z",
		}),
		endDate: z.string().optional().openapi({
			description: "End date for analysis (ISO format).",
			example: "2023-10-31T23:59:59Z",
		}),
		currency: z.string().optional().openapi({
			description: "Currency for analysis.",
			example: "USD",
		}),
	})
	.openapi("GetDashboardAnalysisRequest");

export const GetChildrenAffiliateRequestSchema = z
	.object({
		limit: z.number().optional().openapi({
			description: "Maximum number of children to return.",
			example: 20,
		}),
		offset: z.number().optional().openapi({
			description: "Number of children to skip.",
			example: 0,
		}),
		status: z.string().optional().openapi({
			description: "Filter by affiliate status.",
			example: "active",
		}),
	})
	.openapi("GetChildrenAffiliateRequest");

export const GetAffiliateUsersRequestSchema = z
	.object({
		limit: z.number().optional().openapi({
			description: "Maximum number of users to return.",
			example: 20,
		}),
		offset: z.number().optional().openapi({
			description: "Number of users to skip.",
			example: 0,
		}),
		status: z.string().optional().openapi({
			description: "Filter by user status.",
			example: "active",
		}),
	})
	.openapi("GetAffiliateUsersRequest");

export const CustomLandingUrlRequestSchema = z
	.object({
		url: z.string().url().openapi({
			description: "Custom landing URL for the referral code.",
			example: "https://example.com/landing",
		}),
	})
	.openapi("CustomLandingUrlRequest");

// Response schemas
export const ReferralCountResponseSchema = z
	.object({
		affiliate: z.object({
			all: z.number().openapi({ description: "Total affiliates", example: 15 }),
			active: z
				.number()
				.openapi({ description: "Active affiliates", example: 12 }),
			inactive: z
				.number()
				.openapi({ description: "Inactive affiliates", example: 3 }),
		}),
		user: z.object({
			all: z.number().openapi({ description: "Total users", example: 150 }),
			active: z.number().openapi({ description: "Active users", example: 120 }),
			inactive: z
				.number()
				.openapi({ description: "Inactive users", example: 30 }),
		}),
	})
	.openapi("ReferralCountResponse");

export const DashboardResponseSchema = z
	.object({
		user: z
			.array(
				z.object({
					_id: z
						.string()
						.openapi({ description: "User ID", example: "user_123" }),
					count: z
						.number()
						.openapi({ description: "Count value", example: 25 }),
				}),
			)
			.openapi({ description: "User dashboard data" }),
	})
	.openapi("DashboardResponse");

export const DashboardAnalysisResponseSchema = z
	.object({
		win: z
			.number()
			.openapi({ description: "Total wins amount", example: 1500.5 }),
		bet: z
			.number()
			.openapi({ description: "Total bets amount", example: 1200.75 }),
	})
	.openapi("DashboardAnalysisResponse");

export const ChildrenAffiliateResponseSchema = z
	.array(
		z.object({
			id: z
				.string()
				.openapi({
					description: "Child affiliate ID",
					example: "aff_child_123",
				}),
			username: z
				.string()
				.openapi({ description: "Username", example: "child_affiliate" }),
			status: z.string().openapi({ description: "Status", example: "active" }),
			createdAt: z
				.string()
				.openapi({
					description: "Creation date",
					example: "2023-10-01T12:00:00Z",
				}),
		}),
	)
	.openapi("ChildrenAffiliateResponse");

export const AffiliateUsersResponseSchema = z
	.array(
		z.object({
			id: z.string().openapi({ description: "User ID", example: "user_123" }),
			username: z
				.string()
				.openapi({ description: "Username", example: "regular_user" }),
			status: z.string().openapi({ description: "Status", example: "active" }),
			totalXpGained: z
				.number()
				.openapi({ description: "Total XP gained", example: 1500 }),
			createdAt: z
				.string()
				.openapi({
					description: "Registration date",
					example: "2023-10-01T12:00:00Z",
				}),
		}),
	)
	.openapi("AffiliateUsersResponse");

export const TreeAffiliateResponseSchema = z
	.array(
		z.object({
			id: z
				.string()
				.openapi({ description: "Affiliate ID", example: "aff_123" }),
			username: z
				.string()
				.openapi({ description: "Username", example: "tree_affiliate" }),
			level: z.number().openapi({ description: "Hierarchy level", example: 2 }),
			children: z
				.array(
					z.object({
						id: z.string(),
						username: z.string(),
						level: z.number(),
					}),
				)
				.openapi({ description: "Child affiliates" }),
		}),
	)
	.openapi("TreeAffiliateResponse");

export const CommissionResponseSchema = z
	.object({
		master: z
			.number()
			.openapi({ description: "Master commission rate", example: 30.0 }),
		affiliate: z
			.number()
			.openapi({ description: "Affiliate commission rate", example: 20.0 }),
		subAffiliate: z
			.number()
			.openapi({ description: "Sub-affiliate commission rate", example: 10.0 }),
	})
	.openapi("CommissionResponse");

export const QRStatsResponseSchema = z
	.object({
		userId: z.string().openapi({ description: "User ID", example: "user_123" }),
		scans: z
			.number()
			.openapi({ description: "Number of QR scans", example: 45 }),
		clicks: z
			.number()
			.openapi({ description: "Number of clicks", example: 120 }),
		lastUpdated: z
			.number()
			.openapi({
				description: "Last update timestamp",
				example: 1696160000000,
			}),
	})
	.openapi("QRStatsResponse");

export const ClickStatsResponseSchema = z
	.object({
		code: z
			.string()
			.openapi({ description: "Referral code", example: "AFF123" }),
		totalClicks: z
			.number()
			.openapi({ description: "Total clicks", example: 150 }),
		recentClicks: z
			.array(
				z.object({
					ua: z
						.string()
						.openapi({ description: "User agent", example: "Mozilla/5.0..." }),
					ip: z
						.string()
						.openapi({ description: "IP address", example: "192.168.1.1" }),
					referrer: z
						.string()
						.openapi({
							description: "Referrer",
							example: "https://example.com",
						}),
					timestamp: z
						.number()
						.openapi({
							description: "Click timestamp",
							example: 1696160000000,
						}),
				}),
			)
			.openapi({ description: "Recent click events" }),
	})
	.openapi("ClickStatsResponse");

export const CustomLandingResponseSchema = z
	.object({
		success: z
			.boolean()
			.openapi({ description: "Operation success", example: true }),
		code: z
			.string()
			.openapi({ description: "Referral code", example: "AFF123" }),
		landingUrl: z
			.string()
			.openapi({
				description: "Custom landing URL",
				example: "https://example.com/landing",
			}),
	})
	.openapi("CustomLandingResponse");

// Generic response schemas
export const SuccessResponseSchema = z
	.object({
		success: z.boolean().openapi({ example: true }),
		message: z.string().openapi({ example: "Operation was successful." }),
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
