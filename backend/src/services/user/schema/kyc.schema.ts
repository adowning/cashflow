import { z } from "@hono/zod-openapi";

// KYC (Know Your Customer) schemas based on controller requirements
export const KycDocumentSchema = z
	.object({
		type: z
			.enum(["PASSPORT", "DRIVERS_LICENSE", "ID_CARD", "RESIDENCE_PERMIT"])
			.openapi({
				description: "Type of KYC document.",
				example: "PASSPORT",
			}),
		status: z.enum(["PENDING", "APPROVED", "REJECTED"]).openapi({
			description: "Document verification status.",
			example: "PENDING",
		}),
		documentNumber: z.string().optional().openapi({
			description: "Document number or ID.",
			example: "P123456789",
		}),
		expiryDate: z.string().optional().openapi({
			description: "Document expiry date (ISO format).",
			example: "2030-12-31",
		}),
		issueDate: z.string().optional().openapi({
			description: "Document issue date (ISO format).",
			example: "2020-01-15",
		}),
		issuingCountry: z.string().optional().openapi({
			description: "Country that issued the document.",
			example: "USA",
		}),
		frontImageUrl: z.string().optional().openapi({
			description: "URL to front image of document.",
			example: "https://example.com/doc-front.jpg",
		}),
		backImageUrl: z.string().optional().openapi({
			description: "URL to back image of document.",
			example: "https://example.com/doc-back.jpg",
		}),
		selfieImageUrl: z.string().optional().openapi({
			description: "URL to selfie image for verification.",
			example: "https://example.com/selfie.jpg",
		}),
		uploadedAt: z.string().openapi({
			description: "When the document was uploaded.",
			example: "2023-10-01T12:00:00Z",
		}),
		verifiedAt: z.string().optional().openapi({
			description: "When the document was verified.",
			example: "2023-10-02T14:30:00Z",
		}),
		rejectionReason: z.string().optional().openapi({
			description: "Reason for document rejection.",
			example: "Document unclear, please retake photo",
		}),
	})
	.openapi("KycDocument");

export const KycStatusSchema = z
	.object({
		status: z
			.enum(["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"])
			.openapi({
				description: "Overall KYC verification status.",
				example: "PENDING",
			}),
		level: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED"]).openapi({
			description: "KYC verification level.",
			example: "BASIC",
		}),
		documents: z.array(KycDocumentSchema).openapi({
			description: "List of submitted KYC documents.",
		}),
		submittedAt: z.string().optional().openapi({
			description: "When KYC was first submitted.",
			example: "2023-10-01T12:00:00Z",
		}),
		verifiedAt: z.string().optional().openapi({
			description: "When KYC was verified.",
			example: "2023-10-02T14:30:00Z",
		}),
		expiryDate: z.string().optional().openapi({
			description: "When KYC verification expires.",
			example: "2024-10-01T12:00:00Z",
		}),
		notes: z.string().optional().openapi({
			description: "Additional notes from verification team.",
			example: "All documents verified successfully",
		}),
	})
	.openapi("KycStatus");

// Request schemas for KYC operations
export const CreateKycRequestSchema = z
	.object({
		type: z
			.enum(["PASSPORT", "DRIVERS_LICENSE", "ID_CARD", "RESIDENCE_PERMIT"])
			.openapi({
				description: "Type of KYC document being submitted.",
				example: "PASSPORT",
			}),
		countryCode: z.string().length(2).openapi({
			description: "ISO country code where document was issued.",
			example: "US",
		}),
		country: z.string().openapi({
			description: "Full country name.",
			example: "United States",
		}),
		documentNumber: z.string().optional().openapi({
			description: "Document number or ID.",
			example: "P123456789",
		}),
		expiryDate: z.string().optional().openapi({
			description: "Document expiry date (ISO format).",
			example: "2030-12-31",
		}),
		personalDetails: z
			.object({
				firstName: z.string().min(1).max(50).openapi({
					description: "First name as shown on document.",
					example: "John",
				}),
				lastName: z.string().min(1).max(50).openapi({
					description: "Last name as shown on document.",
					example: "Doe",
				}),
				dateOfBirth: z.string().openapi({
					description: "Date of birth (ISO format).",
					example: "1990-05-15",
				}),
				nationality: z.string().length(2).openapi({
					description: "ISO country code of nationality.",
					example: "US",
				}),
			})
			.openapi({
				description: "Personal details for KYC verification.",
			}),
	})
	.openapi("CreateKycRequest");

export const UpdateKycRequestSchema = z
	.object({
		documentId: z.string().openapi({
			description: "ID of the document to update.",
			example: "kyc_doc_123",
		}),
		status: z.enum(["APPROVED", "REJECTED"]).openapi({
			description: "New status for the document.",
			example: "APPROVED",
		}),
		rejectionReason: z.string().optional().openapi({
			description: "Reason for rejection (required if status is REJECTED).",
			example: "Document image is blurry",
		}),
		notes: z.string().optional().openapi({
			description: "Additional verification notes.",
			example: "Document verified against government database",
		}),
	})
	.openapi("UpdateKycRequest");

// Response schemas
export const KycDocumentsResponseSchema = z.array(KycDocumentSchema).openapi({
	description: "List of KYC documents submitted by the user.",
});

export const KycStatusResponseSchema = KycStatusSchema;

// Generic response schemas
export const SuccessResponseSchema = z
	.object({
		success: z.boolean().openapi({ example: true }),
		message: z.string().openapi({ example: "KYC submitted successfully." }),
	})
	.openapi("SuccessResponse");

export const ErrorResponseSchema = z
	.object({
		error: z.string().openapi({
			description: "Error message.",
			example: "Invalid document type",
		}),
		code: z.string().optional().openapi({
			description: "Error code for programmatic handling.",
			example: "VALIDATION_ERROR",
		}),
	})
	.openapi("ErrorResponse");
