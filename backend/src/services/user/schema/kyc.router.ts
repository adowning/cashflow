import { createRoute, z } from "@hono/zod-openapi";
import * as controller from "../controllers/kyc.controller";
import {
	CreateKycRequestSchema,
	ErrorResponseSchema,
	KycStatusResponseSchema,
	SuccessResponseSchema,
	UpdateKycRequestSchema,
} from "./kyc.schema";

export const getKycStatusRoute = createRoute({
	method: "get",
	path: "/",
	operationId: "getKycStatus",
	tags: ["User"],
	summary: "Get KYC Status",
	description:
		"Retrieves the current KYC (Know Your Customer) verification status and submitted documents for the authenticated user.",
	responses: {
		200: {
			description: "KYC status retrieved successfully.",
			content: {
				"application/json": {
					schema: KycStatusResponseSchema,
				},
			},
		},
		500: {
			description: "Internal Server Error - Failed to retrieve KYC status.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const createKycRoute = createRoute({
	method: "post",
	path: "/",
	operationId: "createKyc",
	tags: ["User"],
	summary: "Submit KYC Documents",
	description:
		"Submits KYC verification documents for the authenticated user. Only one KYC submission is allowed per user.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateKycRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "KYC documents submitted successfully.",
			content: {
				"application/json": {
					schema: KycStatusResponseSchema,
				},
			},
		},
		400: {
			description: "Bad Request - KYC already exists or invalid document data.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description: "Internal Server Error - Failed to submit KYC documents.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const updateKycDocumentRoute = createRoute({
	method: "patch",
	path: "/document/:documentId",
	operationId: "updateKycDocument",
	tags: ["User"],
	summary: "Update KYC Document Status",
	description:
		"Updates the verification status of a specific KYC document (approve/reject with reason).",
	request: {
		params: z.object({
			documentId: z.string().openapi({
				description: "The unique identifier of the KYC document.",
				example: "kyc_doc_123",
			}),
		}),
		body: {
			content: {
				"application/json": {
					schema: UpdateKycRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "KYC document status updated successfully.",
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
		},
		400: {
			description:
				"Bad Request - Invalid document status or missing rejection reason.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		404: {
			description: "KYC document not found.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description: "Internal Server Error - Failed to update KYC document.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const generateRoutes = (router: any) => {
	router.basePath("/kyc");
	router.openapi(getKycStatusRoute, controller.getKyc as any);
	router.openapi(createKycRoute, controller.createKyc as any);
	router.openapi(updateKycDocumentRoute, controller.updateKyc as any);
	return router.routes;
};
