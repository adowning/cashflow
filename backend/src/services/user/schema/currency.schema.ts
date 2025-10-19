import { z } from "@hono/zod-openapi";

// Currency schemas based on controller requirements
export const CurrencySchema = z
	.object({
		id: z.string().openapi({ description: "Currency ID", example: "cur_123" }),
		name: z
			.string()
			.openapi({ description: "Currency name", example: "US Dollar" }),
		code: z
			.string()
			.min(3)
			.max(3)
			.openapi({ description: "Currency code (ISO 4217)", example: "USD" }),
		symbol: z
			.string()
			.openapi({ description: "Currency symbol", example: "$" }),
		exchangeRate: z
			.number()
			.openapi({ description: "Exchange rate to base currency", example: 1.0 }),
		isActive: z
			.boolean()
			.openapi({ description: "Whether currency is active", example: true }),
		decimals: z
			.number()
			.openapi({ description: "Number of decimal places", example: 2 }),
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
	.openapi("Currency");

// Request schemas for currency operations
export const CreateCurrencyRequestSchema = z
	.object({
		name: z.string().min(1).max(100).openapi({
			description: "Currency name.",
			example: "US Dollar",
		}),
		code: z.string().min(3).max(3).openapi({
			description: "Currency code (ISO 4217).",
			example: "USD",
		}),
		symbol: z.string().min(1).max(10).openapi({
			description: "Currency symbol.",
			example: "$",
		}),
		exchangeRate: z.number().positive().openapi({
			description: "Exchange rate to base currency.",
			example: 1.0,
		}),
		decimals: z.number().int().min(0).max(8).openapi({
			description: "Number of decimal places.",
			example: 2,
		}),
	})
	.openapi("CreateCurrencyRequest");

export const UpdateCurrencyRequestSchema = z
	.object({
		name: z.string().min(1).max(100).optional().openapi({
			description: "Currency name.",
			example: "US Dollar",
		}),
		code: z.string().min(3).max(3).optional().openapi({
			description: "Currency code (ISO 4217).",
			example: "USD",
		}),
		symbol: z.string().min(1).max(10).optional().openapi({
			description: "Currency symbol.",
			example: "$",
		}),
		exchangeRate: z.number().positive().optional().openapi({
			description: "Exchange rate to base currency.",
			example: 1.0,
		}),
		isActive: z.boolean().optional().openapi({
			description: "Whether currency is active.",
			example: true,
		}),
		decimals: z.number().int().min(0).max(8).optional().openapi({
			description: "Number of decimal places.",
			example: 2,
		}),
	})
	.openapi("UpdateCurrencyRequest");

// Response schemas
export const CurrenciesResponseSchema = z
	.array(
		z.object({
			id: z
				.string()
				.openapi({ description: "Currency ID", example: "cur_123" }),
			name: z
				.string()
				.openapi({ description: "Currency name", example: "US Dollar" }),
			code: z
				.string()
				.openapi({ description: "Currency code", example: "USD" }),
			symbol: z
				.string()
				.openapi({ description: "Currency symbol", example: "$" }),
			exchangeRate: z
				.number()
				.openapi({ description: "Exchange rate", example: 1.0 }),
			isActive: z
				.boolean()
				.openapi({ description: "Active status", example: true }),
			decimals: z
				.number()
				.openapi({ description: "Decimal places", example: 2 }),
		}),
	)
	.openapi("CurrenciesResponse");

export const EnabledCurrenciesResponseSchema = z
	.array(
		z.object({
			id: z
				.string()
				.openapi({ description: "Currency ID", example: "cur_123" }),
			name: z
				.string()
				.openapi({ description: "Currency name", example: "US Dollar" }),
			code: z
				.string()
				.openapi({ description: "Currency code", example: "USD" }),
			symbol: z
				.string()
				.openapi({ description: "Currency symbol", example: "$" }),
			exchangeRate: z
				.number()
				.openapi({ description: "Exchange rate", example: 1.0 }),
			decimals: z
				.number()
				.openapi({ description: "Decimal places", example: 2 }),
		}),
	)
	.openapi("EnabledCurrenciesResponse");

export const CurrencyResponseSchema = z
	.object({
		id: z.string().openapi({ description: "Currency ID", example: "cur_123" }),
		name: z
			.string()
			.openapi({ description: "Currency name", example: "US Dollar" }),
		code: z.string().openapi({ description: "Currency code", example: "USD" }),
		symbol: z
			.string()
			.openapi({ description: "Currency symbol", example: "$" }),
		exchangeRate: z
			.number()
			.openapi({ description: "Exchange rate", example: 1.0 }),
		isActive: z
			.boolean()
			.openapi({ description: "Active status", example: true }),
		decimals: z.number().openapi({ description: "Decimal places", example: 2 }),
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
	.openapi("CurrencyResponse");

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
