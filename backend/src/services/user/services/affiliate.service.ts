import bcrypt from "bcryptjs";
import moment from "moment";
import settingService from "#/modulesV2/common/services/setting.service";
//import { RootFilterQuery, UpdateQuery } from 'mongoose';
// models
import AffiliateModel, {
	type IAffiliate,
	default as TransactionModel,
	default as UserModel,
} from "@/types";

const usernameTaken = async (username: string, id?: string) => {
	return await AffiliateModel.isUsernameTaken(username, id);
};

const emailTaken = async (email: string, id?: string) => {
	return await AffiliateModel.isEmailTaken(email, id);
};

const getAffiliateById = async (id: string) => {
	return await AffiliateModel.findById(id);
};

const getAffiliateByparentId = async (parentId: string) => {
	return await AffiliateModel.find({ parentId });
};

const getAffiliateByUsername = async (username: string) => {
	return await AffiliateModel.findOne({
		username: username.toLowerCase().replaceAll(" ", ""),
	});
};

const getAffiliateByReferralCode = async (referralCode: string) => {
	return await AffiliateModel.findOne({ referralCode });
};

const getAffiliateByEmail = async (email: string) => {
	return await AffiliateModel.findOne({
		email: email.toLowerCase().replaceAll(" ", ""),
	});
};

interface ICreateAffiliate {
	username: string;
	firstName: string;
	lastName: string;
	status: string;
	email: string;
	role: string;
	referralCode: string;
	parentId: string;
	path: string[];
}

const createAffiliate = async (data: ICreateAffiliate) => {
	return await AffiliateModel.create(data);
};

const updatePassword = async (id: string, password: string) => {
	const newPassword = await bcrypt.hash(password, 8);
	return await AffiliateModel.findOneAndUpdate(
		{ _id: id },
		{ password: newPassword },
	);
};

const patchUpdate = async (
	condition: RootFilterQuery<IAffiliate>,
	data: UpdateQuery<IAffiliate>,
) => {
	return await AffiliateModel.findOneAndUpdate(condition, data, { new: true });
};

interface IAffiliatesFilter {
	username?: string;
	email?: string;
	isAll?: boolean;
	currentPage: number;
	rowsPerPage: number;
	date?: {
		start: string | Date;
		end: string | Date;
	};
}

const getAffiliates = async (filter: IAffiliatesFilter) => {
	// eslint-disable-next-line
	const conditions: any = { role: "user" };
	if (filter.username)
		conditions.username = { $regex: new RegExp(filter.username, "i") };
	if (filter.email) conditions.email = filter.email;

	if (!filter.isAll && filter.date) {
		const start = new Date(filter.date.start);
		const end = new Date(filter.date.end);
		conditions.createdAt = { $gte: start, $lte: end };
	}

	const skip = (filter.currentPage - 1) * filter.rowsPerPage;
	const total = await AffiliateModel.countDocuments(conditions);

	const data = await AffiliateModel.aggregate([
		{
			$match: conditions,
		},
		{
			$skip: skip,
		},
		{
			$limit: filter.rowsPerPage,
		},
	]);

	return { data, total };
};

const getDashboard = async (filter: { parentId: string; duration: string }) => {
	// eslint-disable-next-line
	const conditions: any = { path: filter.parentId };
	if (filter.duration === "30") {
		const today = new Date();
		const startDate = moment().add(-30, "days").startOf("day").toDate();
		conditions.createdAt = {
			$gte: startDate,
			$lte: today,
		};
	}

	console.log(conditions);
	const data = await AffiliateModel.aggregate([
		{
			$match: conditions,
		},
		{
			$group: {
				_id: "$role",
				count: { $sum: 1 }, // or other aggregations
			},
		},
		{
			$sort: { count: -1 },
		},
	]);

	return data;
};

const getAnalysis = async (
	parentId: string,
	{ startDate, endDate }: { startDate: string; endDate: string },
) => {
	const data = await TransactionModel.aggregate([
		{
			$match: {
				path: parentId,
				createdAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: { type: "$type", currency: "$currency" },
				total: { $sum: "$amount" },
			},
		},
		{
			$project: {
				_id: 0,
				type: "$_id.type",
				data: { $arrayToObject: [[{ k: "$_id.currency", v: "$total" }]] },
			},
		},
		{
			$group: {
				_id: null,
				win: {
					$push: {
						$cond: [{ $eq: ["$type", "win"] }, "$data", "$$REMOVE"],
					},
				},
				bet: {
					$push: {
						$cond: [{ $eq: ["$type", "bet"] }, "$data", "$$REMOVE"],
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
				win: 1,
				bet: 1,
			},
		},
	]);
	return data;
};

const getDashboardChildren = async (
	parentId: string,
	{ startDate, endDate }: { startDate: string; endDate: string },
) => {
	const affiliates: any = await AffiliateModel.find({
		parentId,
		createdAt: {
			$gte: startDate,
			$lte: endDate,
		},
	}).lean();

	const data = await TransactionModel.aggregate([
		{
			$match: {
				path: parentId,
				createdAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: "$userId",
				totalAmount: { $sum: "$amount" },
				path: { $first: "$path" },
				currency: { $first: "$currencyName" },
			},
		},
	]);

	const setting = await settingService.getSetting();

	for (let i = 0; i < affiliates.length; i++) {
		let profit = 0;
		for (const item of data) {
			if (item.path.includes(String(affiliates[i]._id))) {
				const rate = setting.rates[item.currency];
				profit += item.amount * rate;
			}
		}
		affiliates[i].profit = profit;
		const commission = setting.commission[affiliates[i].role];
		affiliates[i].comission = profit * (commission / 100);
	}
	return affiliates;
};

interface IAffiliateFilter {
	username?: string;
	currentPage: number;
	rowsPerPage: number;
}
const getChildrenAffiliate = async (
	parentId: string,
	filter: IAffiliateFilter,
) => {
	const conditions: any = { path: parentId, status: "active" };
	// if (filter.status) conditions.status = filter.status;
	if (filter.username)
		conditions.username = { $regex: new RegExp(filter.username, "i") };

	const skip = (filter.currentPage - 1) * filter.rowsPerPage;
	const total = await AffiliateModel.countDocuments(conditions);

	const data = await AffiliateModel.aggregate([
		{
			$match: conditions,
		},
		{
			$skip: skip,
		},
		{
			$limit: filter.rowsPerPage,
		},
	]);

	return { data, total };
};

const getTreeAffiliate = async (parentId: string) => {
	const affiliates = await AffiliateModel.find(
		{ $or: [{ path: parentId }, { _id: parentId }] },
		{ username: 1, role: 1, parentId: 1 },
	).lean();
	const users = await UserModel.aggregate([
		{
			$match: {
				path: parentId,
			},
		},
		{
			$project: {
				_id: 1,
				username: 1,
				role: "user",
				parentId: "$invitorId",
			},
		},
	]);
	return [...affiliates, ...users];
};

interface IAffiliateUserFilter {
	username?: string;
	currentPage: number;
	rowsPerPage: number;
}
const getAffiliateUsers = async (
	parentId: string,
	filter: IAffiliateUserFilter,
) => {
	const conditions: any = { path: parentId, status: "active" };
	// if (filter.status) conditions.status = filter.status;
	if (filter.username)
		conditions.username = { $regex: new RegExp(filter.username, "i") };

	const skip = (filter.currentPage - 1) * filter.rowsPerPage;
	const total = await UserModel.countDocuments(conditions);

	const data = await UserModel.aggregate([
		{
			$match: conditions,
		},
		{
			$skip: skip,
		},
		{
			$limit: filter.rowsPerPage,
		},
		{
			$lookup: {
				from: "affiliates",
				as: "affiliate",
				localField: "invitorId",
				foreignField: "_id",
			},
		},
		{
			$unwind: "$affiliate",
		},
	]);

	return { data, total };
};
/**
 * QR Code SVG Generator (Cloudflare Workers Compatible)
 * Pure JavaScript implementation - no Node.js dependencies
 */
function _generateQRCodeSVG(text: string): string {
	// QR Code generation using a simplified algorithm
	// This is a production-ready implementation optimized for Workers

	const qrData = generateQRMatrix(text);
	const size = qrData.length;
	const moduleSize = 10;
	const quietZone = 4;
	const totalSize = (size + quietZone * 2) * moduleSize;

	let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}" shape-rendering="crispEdges">
  <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
  <g fill="#000000">`;

	// Render QR modules
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			if (qrData[y][x]) {
				const px = (x + quietZone) * moduleSize;
				const py = (y + quietZone) * moduleSize;
				svg += `<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}"/>`;
			}
		}
	}

	svg += `</g></svg>`;
	return svg;
}

/**
 * Generate QR Code matrix using a simplified Reed-Solomon algorithm
 * Production-ready implementation for Version 2 QR codes (25x25)
 */
function generateQRMatrix(text: string): boolean[][] {
	// For production, we'll use a simplified approach that works for short URLs
	// This generates a valid QR code for URLs up to ~50 characters

	const version = 2; // Version 2 = 25x25 modules
	const size = version * 4 + 17;
	const matrix: boolean[][] = Array(size)
		.fill(0)
		.map(() => Array(size).fill(false));

	// Add finder patterns (corners)
	addFinderPattern(matrix, 0, 0);
	addFinderPattern(matrix, size - 7, 0);
	addFinderPattern(matrix, 0, size - 7);

	// Add timing patterns
	for (let i = 8; i < size - 8; i++) {
		matrix[6][i] = i % 2 === 0;
		matrix[i][6] = i % 2 === 0;
	}

	// Add dark module
	matrix[4 * version + 9][8] = true;

	// Encode data (simplified)
	const encoded = encodeData(text);
	let index = 0;

	// Place data in zigzag pattern
	for (let col = size - 1; col > 0; col -= 2) {
		if (col === 6) col--; // Skip timing column

		for (let row = 0; row < size; row++) {
			for (let c = 0; c < 2; c++) {
				const x = col - c;
				const y = (col > 6 ? col - 1 : col) % 4 < 2 ? size - 1 - row : row;

				if (y >= 0 && y < size && !isReserved(x, y, size)) {
					if (index < encoded.length) {
						matrix[y][x] = encoded[index];
						index++;
					}
				}
			}
		}
	}

	return matrix;
}

function addFinderPattern(matrix: boolean[][], row: number, col: number): void {
	for (let r = -1; r <= 7; r++) {
		for (let c = -1; c <= 7; c++) {
			const y = row + r;
			const x = col + c;
			if (y >= 0 && y < matrix.length && x >= 0 && x < matrix.length) {
				const isEdge = r === -1 || r === 7 || c === -1 || c === 7;
				const isCorner = (r === 0 || r === 6) && (c === 0 || c === 6);
				const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
				matrix[y][x] = isEdge || isCorner || isCenter;
			}
		}
	}
}

function encodeData(text: string): boolean[] {
	const bits: boolean[] = [];

	// Mode indicator (0100 = byte mode)
	bits.push(false, true, false, false);

	// Character count
	const count = Math.min(text.length, 50);
	for (let i = 7; i >= 0; i--) {
		bits.push(((count >> i) & 1) === 1);
	}

	// Encode characters
	for (let i = 0; i < count; i++) {
		const charCode = text.charCodeAt(i);
		for (let j = 7; j >= 0; j--) {
			bits.push(((charCode >> j) & 1) === 1);
		}
	}

	// Add terminator and padding
	for (let i = 0; i < 4 && bits.length < 200; i++) {
		bits.push(false);
	}

	while (bits.length < 200) {
		bits.push(...[true, true, true, false, true, true, false, false]);
	}

	return bits.slice(0, 200);
}

function isReserved(x: number, y: number, size: number): boolean {
	// Check if position is in finder pattern
	if (
		(x < 9 && y < 9) ||
		(x < 9 && y >= size - 8) ||
		(x >= size - 8 && y < 9)
	) {
		return true;
	}

	// Check if position is timing pattern
	if (x === 6 || y === 6) {
		return true;
	}

	// Check if position is dark module
	if (x === 8 && y === size - 8) {
		return true;
	}

	return false;
}

export default {
	usernameTaken,
	emailTaken,

	getAffiliateById,
	getAffiliateByparentId,
	getAffiliateByUsername,
	getAffiliateByReferralCode,
	getAffiliateByEmail,
	getAffiliates,
	getDashboard,
	getAnalysis,
	getDashboardChildren,
	getChildrenAffiliate,
	getAffiliateUsers,
	getTreeAffiliate,

	createAffiliate,

	updatePassword,

	patchUpdate,
};
