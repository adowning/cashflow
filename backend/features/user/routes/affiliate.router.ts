import { createRoute, z } from "@hono/zod-openapi";
import * as controller from "../controllers/affiliate.controller.v2";
import {
	AffiliateUsersResponseSchema,
	ChildrenAffiliateResponseSchema,
	ClickStatsResponseSchema,
	CommissionResponseSchema,
	CustomLandingResponseSchema,
	CustomLandingUrlRequestSchema,
	DashboardAnalysisResponseSchema,
	DashboardResponseSchema,
	ErrorResponseSchema,
	GetAffiliateUsersRequestSchema,
	GetChildrenAffiliateRequestSchema,
	GetDashboardAnalysisRequestSchema,
	QRStatsResponseSchema,
	ReferralCountResponseSchema,
	SuccessResponseSchema,
	TreeAffiliateResponseSchema,
	UpdateAffiliateRequestSchema,
	UpdatePasswordRequestSchema,
} from "../schema/affiliate.schema";

export const updateAffiliateRoute = createRoute({
	method: "put",
	path: "/",
	operationId: "updateAffiliate",
	tags: ["User"],
	summary: "Update Affiliate Profile",
	description:
		"Updates the authenticated affiliate's profile information including username, email, and personal details.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: UpdateAffiliateRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Affiliate profile updated successfully.",
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
		},
		400: {
			description:
				"Bad Request - Username or email already exists, or validation failed.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description:
				"Internal Server Error - Failed to update affiliate profile.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const referralCountRoute = createRoute({
	method: "get",
	path: "/referral-count",
	operationId: "getReferralCount",
	tags: ["User"],
	summary: "Get Referral Count",
	description:
		"Retrieves the count of affiliates and users referred by the authenticated affiliate, categorized by status.",
	responses: {
		200: {
			description: "Referral count retrieved successfully.",
			content: {
				"application/json": {
					schema: ReferralCountResponseSchema,
				},
			},
		},
		400: {
			description:
				"Bad Request - Invalid parameters or missing authentication.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description: "Internal Server Error - Failed to retrieve referral count.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const getDashboardRoute = createRoute({
	method: "get",
	path: "/dashboard",
	operationId: "getAffiliateDashboard",
	tags: ["User"],
	summary: "Get Affiliate Dashboard",
	description:
		"Retrieves dashboard data for the authenticated affiliate including user statistics and performance metrics.",
	request: {
		query: z.object({
			duration: z.string().optional().openapi({
				description:
					'Time duration for dashboard data (e.g., "7d", "30d", "all").',
				example: "30d",
			}),
		}),
	},
	responses: {
		200: {
			description: "Dashboard data retrieved successfully.",
			content: {
				"application/json": {
					schema: DashboardResponseSchema,
				},
			},
		},
		400: {
			description: "Bad Request - Invalid duration parameter.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description: "Internal Server Error - Failed to retrieve dashboard data.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const createDashboardAnalysisRoute = createRoute({
	method: "post",
	path: "/dashboard/analysis",
	operationId: "getDashboardAnalysis",
	tags: ["User"],
	summary: "Get Dashboard Analysis",
	description:
		"Retrieves detailed analysis data for the affiliate dashboard including win/bet statistics and currency breakdowns.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: GetDashboardAnalysisRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Dashboard analysis retrieved successfully.",
			content: {
				"application/json": {
					schema: DashboardAnalysisResponseSchema,
				},
			},
		},
		400: {
			description: "Bad Request - Invalid analysis parameters.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description:
				"Internal Server Error - Failed to retrieve dashboard analysis.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const createDashboardChildrenRoute = createRoute({
	method: "post",
	path: "/dashboard/children",
	operationId: "getDashboardChildren",
	tags: ["User"],
	summary: "Get Dashboard Children",
	description:
		"Retrieves child affiliates data for dashboard display with filtering and pagination support.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: GetChildrenAffiliateRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Dashboard children data retrieved successfully.",
			content: {
				"application/json": {
					schema: ChildrenAffiliateResponseSchema,
				},
			},
		},
		400: {
			description: "Bad Request - Invalid filter parameters.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description:
				"Internal Server Error - Failed to retrieve dashboard children.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const createChildrenAffiliateRoute = createRoute({
	method: "post",
	path: "/children",
	operationId: "getChildrenAffiliate",
	tags: ["User"],
	summary: "Get Children Affiliates",
	description:
		"Retrieves a paginated list of child affiliates for the authenticated affiliate with filtering options.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: GetChildrenAffiliateRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Children affiliates retrieved successfully.",
			content: {
				"application/json": {
					schema: ChildrenAffiliateResponseSchema,
				},
			},
		},
		400: {
			description: "Bad Request - Invalid filter parameters.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description:
				"Internal Server Error - Failed to retrieve children affiliates.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const createAffiliateUsersRoute = createRoute({
	method: "post",
	path: "/users",
	operationId: "getAffiliateUsers",
	tags: ["User"],
	summary: "Get Affiliate Users",
	description:
		"Retrieves a list of users associated with the authenticated affiliate with filtering and pagination.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: GetAffiliateUsersRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Affiliate users retrieved successfully.",
			content: {
				"application/json": {
					schema: AffiliateUsersResponseSchema,
				},
			},
		},
		400: {
			description: "Bad Request - Invalid filter parameters.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description:
				"Internal Server Error - Failed to retrieve affiliate users.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const getCommissionRoute = createRoute({
	method: "get",
	path: "/commission",
	operationId: "getCommission",
	tags: ["User"],
	summary: "Get Commission Rates",
	description:
		"Retrieves the current commission rate structure for affiliates.",
	responses: {
		200: {
			description: "Commission rates retrieved successfully.",
			content: {
				"application/json": {
					schema: CommissionResponseSchema,
				},
			},
		},
		500: {
			description:
				"Internal Server Error - Failed to retrieve commission rates.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const getTreeAffiliateRoute = createRoute({
	method: "get",
	path: "/tree-affiliates",
	operationId: "getTreeAffiliate",
	tags: ["User"],
	summary: "Get Affiliate Tree",
	description:
		"Retrieves the hierarchical tree structure of affiliates under the authenticated affiliate.",
	responses: {
		200: {
			description: "Affiliate tree retrieved successfully.",
			content: {
				"application/json": {
					schema: TreeAffiliateResponseSchema,
				},
			},
		},
		500: {
			description: "Internal Server Error - Failed to retrieve affiliate tree.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const generateQRCodeRoute = createRoute({
	method: "get",
	path: "/qr/:userId",
	operationId: "generateQRCode",
	tags: ["User"],
	summary: "Generate QR Code",
	description:
		"Generates a QR code for affiliate referrals that links to the Telegram bot or custom landing page.",
	request: {
		params: z.object({
			userId: z.string().openapi({
				description: "The user ID for generating the affiliate QR code.",
				example: "user_123",
			}),
		}),
	},
	responses: {
		200: {
			description: "QR code generated successfully.",
			content: {
				"image/svg+xml": {
					schema: z.string().openapi({
						description: "SVG QR code content.",
						example: "<svg>...</svg>",
					}),
				},
			},
		},
		500: {
			description: "Internal Server Error - Failed to generate QR code.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const getQRStatsRoute = createRoute({
	method: "get",
	path: "/qr/:userId/stats",
	operationId: "getQRStats",
	tags: ["User"],
	summary: "Get QR Code Statistics",
	description:
		"Retrieves scan and click statistics for the specified user's QR code.",
	request: {
		params: z.object({
			userId: z.string().openapi({
				description: "The user ID to get QR statistics for.",
				example: "user_123",
			}),
		}),
	},
	responses: {
		200: {
			description: "QR statistics retrieved successfully.",
			content: {
				"application/json": {
					schema: QRStatsResponseSchema,
				},
			},
		},
		500: {
			description: "Internal Server Error - Failed to retrieve QR statistics.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const scanQRCodeRoute = createRoute({
	method: "post",
	path: "/qr/:userId/scan",
	operationId: "scanQRCode",
	tags: ["User"],
	summary: "Track QR Code Scan",
	description:
		"Tracks when a QR code is scanned and increments the scan counter for analytics.",
	request: {
		params: z.object({
			userId: z.string().openapi({
				description: "The user ID whose QR code was scanned.",
				example: "user_123",
			}),
		}),
	},
	responses: {
		200: {
			description: "QR scan tracked successfully.",
			content: {
				"application/json": {
					schema: z
						.object({
							success: z.boolean().openapi({ example: true }),
							scans: z.number().openapi({
								description: "Updated scan count",
								example: 46,
							}),
						})
						.openapi("ScanQRCodeResponse"),
				},
			},
		},
		500: {
			description: "Internal Server Error - Failed to track QR scan.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const trackClickRedirectRoute = createRoute({
	method: "get",
	path: "/ref/:code",
	operationId: "trackClickRedirect",
	tags: ["User"],
	summary: "Track Click and Redirect",
	description:
		"Tracks referral link clicks and redirects users to the appropriate landing page or Telegram bot.",
	request: {
		params: z.object({
			code: z.string().openapi({
				description: "The referral code to track.",
				example: "AFF123",
			}),
		}),
	},
	responses: {
		302: {
			description: "Redirect to landing page or Telegram bot.",
		},
		500: {
			description: "Internal Server Error - Failed to process redirect.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const getClickStatsRoute = createRoute({
	method: "get",
	path: "/ref/:code/stats",
	operationId: "getClickStats",
	tags: ["User"],
	summary: "Get Click Statistics",
	description:
		"Retrieves click statistics and recent click events for a specific referral code.",
	request: {
		params: z.object({
			code: z.string().openapi({
				description: "The referral code to get statistics for.",
				example: "AFF123",
			}),
		}),
	},
	responses: {
		200: {
			description: "Click statistics retrieved successfully.",
			content: {
				"application/json": {
					schema: ClickStatsResponseSchema,
				},
			},
		},
		500: {
			description:
				"Internal Server Error - Failed to retrieve click statistics.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const setCustomLandingRoute = createRoute({
	method: "post",
	path: "/ref/:code/landing",
	operationId: "setCustomLanding",
	tags: ["User"],
	summary: "Set Custom Landing URL",
	description:
		"Sets a custom landing URL for a referral code that users will be redirected to instead of the default.",
	request: {
		params: z.object({
			code: z.string().openapi({
				description: "The referral code to set landing URL for.",
				example: "AFF123",
			}),
		}),
		body: {
			content: {
				"application/json": {
					schema: CustomLandingUrlRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Custom landing URL set successfully.",
			content: {
				"application/json": {
					schema: CustomLandingResponseSchema,
				},
			},
		},
		400: {
			description: "Bad Request - Invalid URL format.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description: "Internal Server Error - Failed to set custom landing URL.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const updatePasswordRoute = createRoute({
	method: "patch",
	path: "/password",
	operationId: "updateAffiliatePassword",
	tags: ["User"],
	summary: "Update Affiliate Password",
	description:
		"Allows the authenticated affiliate to change their password after providing the current password for verification.",
	request: {
		body: {
			content: {
				"application/json": {
					schema: UpdatePasswordRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Password updated successfully.",
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
		},
		400: {
			description:
				"Bad Request - Current password incorrect or new password too weak.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
		500: {
			description: "Internal Server Error - Failed to update password.",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const generateRoutes = (router: any) => {
	router.basePath("/affiliate");
	router.openapi(updateAffiliateRoute, controller.updateAffiliate as any);
	router.openapi(referralCountRoute, controller.referralCount as any);
	router.openapi(getDashboardRoute, controller.getDashboard as any);
	router.openapi(
		createDashboardAnalysisRoute,
		controller.getDashboardAnalysis as any,
	);
	router.openapi(
		createDashboardChildrenRoute,
		controller.getDashboardChildren as any,
	);
	router.openapi(
		createChildrenAffiliateRoute,
		controller.getChildrenAffiliate as any,
	);
	router.openapi(
		createAffiliateUsersRoute,
		controller.getAffiliateUsers as any,
	);
	router.openapi(getCommissionRoute, controller.getCommission as any);
	router.openapi(getTreeAffiliateRoute, controller.getTreeAffiliate as any);
	router.openapi(updatePasswordRoute, controller.updatePassword as any);

	router.openapi(generateQRCodeRoute, controller.generateQR as any);
	router.openapi(getQRStatsRoute, controller.getStats as any);
	router.openapi(scanQRCodeRoute, controller.scanCode as any);

	router.openapi(trackClickRedirectRoute, controller.trackClickRedirect as any);
	router.openapi(getClickStatsRoute, controller.getClickStats as any);
	router.openapi(setCustomLandingRoute, controller.customLandingUrl as any);

	return router.routes;
};
