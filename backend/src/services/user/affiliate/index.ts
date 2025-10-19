/**
 * Affiliate Routes
 * Main router for all affiliate-related endpoints
 */

import { Hono } from "hono";
import broadcastRoutes from "./broadcast";
import qrRoutes from "./qr";
import refRoutes from "./ref";
import withdrawRoutes from "./withdraw";

type Bindings = {
	AFFILIATE_KV: KVNamespace;
	DB?: D1Database;
	PUBLIC_URL?: string;
	TELEGRAM_BOT_USERNAME?: string;
	TELEGRAM_BOT_TOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Mount sub-routes
app.route("/affiliate/qr", qrRoutes);
app.route("/affiliate/ref", refRoutes);
app.route("/affiliate/withdraw", withdrawRoutes);
app.route("/affiliate/broadcast", broadcastRoutes);

// Health check for affiliate system
app.get("/health", (c) => {
	return c.json({
		status: "healthy",
		service: "affiliate-api",
		timestamp: Date.now(),
	});
});

// export default app;
export const affiliate = app;
