import type { Context } from "hono";
import httpStatus from "http-status";
import * as UAParser from "ua-parser-js";
import balanceService from "#/modulesV2/finance/services/balance.service";
import currencyService from "#/modulesV2/finance/services/currency.service";
import depositService from "#/modulesV2/finance/services/deposit.service";
import transactionService from "#/modulesV2/finance/services/transaction.service";
import withdrawService from "#/modulesV2/finance/services/withdraw.service";
// service
import userService from "#/modulesV2/user/services/user.service";
import playerBonusService from "#/modulesV2/vip/services/player-bonus.service";
// utils
import ApiError from "#/utils/ApiError";
import catchAsyncV2 from "#/utils/catchAsync.v2";
import { getGeoInfo } from "#/utils/getCountry";
import { getIpAddress } from "#/utils/utils.v2";
import kycService from "../services/kyc.service";
import passwordLogService from "../services/password-log.service";

export const updateUsername = catchAsyncV2(async (c: Context) => {
	const updateData = await c.req.json();
	const user = c.get("user");

	if (updateData.username) {
		if (
			await userService.usernameTaken(updateData.username, String(user._id))
		) {
			throw new ApiError(httpStatus.BAD_REQUEST, "Username already taken");
		}
	}
	const updatedUser = await userService.patchUpdate(
		{ _id: user._id },
		updateData,
	);
	return c.json(updatedUser);
});

export const updateCurrency = catchAsyncV2(async (c: Context) => {
	const updateData = await c.req.json();
	const user = c.get("user");
	const updatedUser = await userService.patchUpdate(
		{ _id: user._id },
		updateData,
	);
	return c.json(updatedUser);
});

export const updateAvatar = catchAsyncV2(async (c: Context) => {
	const _user = c.get("user");
	// TODO: Handle file upload
	// if (!c.req.file) {
	//     throw new ApiError(httpStatus.BAD_REQUEST, 'Avatar upload is incorrect');
	// }
	// const updatedUser = await userService.patchUpdate({ _id: user._id }, { avatar: c.req.file.filename });
	// return c.json(updatedUser);
	return c.json({ message: "File upload not implemented yet" });
});

export const updatePassword = catchAsyncV2(async (c: Context) => {
	const { oldPassword, newPassword } = await c.req.json();
	const user = c.get("user");
	if (!(await user.isPasswordMatch(oldPassword))) {
		throw new ApiError(httpStatus.BAD_REQUEST, "Current password is incorrect");
	}
	await userService.updatePassword(String(user._id), newPassword);

	const userIp = getIpAddress(c);

	const userAgent = c.req.header("user-agent");
	const parser = new UAParser.UAParser(userAgent);
	const result = parser.getResult();

	const country = {
		code: "Unknown",
		name: "Unknown",
	};

	if (userIp) {
		const { data } = await getGeoInfo(userIp);
		country.code = data.countryCode;
		country.name = data.country;
	}
	await passwordLogService.createPasswordLog({
		userId: String(user._id),
		actorId: String(user._id),
		ip: userIp,
		userAgent,
		device: result.device.type || "desktop",
		os: `${result.os.name} ${result.os.version}`,
		browser: `${result.browser.name} ${result.browser.version}`,
		country,
	});

	return c.json(null, httpStatus.NO_CONTENT);
});

export const getPlayerBalance = catchAsyncV2(async (c: Context) => {
	const user = c.get("user");
	const balance = await balanceService.getBalanceByUser(String(user._id));
	return c.json(balance);
});

export const getKyc = catchAsyncV2(async (c: Context) => {
	const user = c.get("user");
	const kyc = await kycService.getKycByUser(String(user._id));
	return c.json(kyc);
});

export const createKyc = catchAsyncV2(async (c: Context) => {
	const user = c.get("user");
	const oldkyc = await kycService.getKycByUser(String(user._id));
	if (oldkyc) {
		throw new ApiError(httpStatus.BAD_REQUEST, "Your KYC already exists");
	}

	// TODO: Handle file upload
	const frontImg = "";
	const backImg = "";

	const { type, countryCode, country } = await c.req.json();

	const kyc = await kycService.createKYC({
		userId: String(user._id),
		frontImg,
		backImg,
		type,
		country: {
			code: countryCode,
			name: country,
		},
	});
	return c.json(kyc);
});

export const getPlayerTransactions = catchAsyncV2(async (c: Context) => {
	const user = c.get("user");
	const transactions = await transactionService.getPlayerTransaction(
		user._id,
		await c.req.json(),
	);
	return c.json(transactions);
});

export const getPlayerDeposit = catchAsyncV2(async (c: Context) => {
	const user = c.get("user");
	const body = await c.req.json();
	const withdraws = await depositService.getPlayerDeposit({
		...body,
		userId: user._id,
	});
	return c.json(withdraws);
});

export const getPlayerWithdraw = catchAsyncV2(async (c: Context) => {
	const user = c.get("user");
	const body = await c.req.json();
	const withdraws = await withdrawService.getPlayerWithdraw({
		...body,
		userId: user._id,
	});
	return c.json(withdraws);
});

export const getPlayerBonus = catchAsyncV2(async (c: Context) => {
	const user = c.get("user");
	const body = await c.req.json();
	const bonuses = await playerBonusService.getPlayerBonus({
		...body,
		userId: user._id,
	});
	return c.json(bonuses);
});

export const claimBonus = catchAsyncV2(async (c: Context) => {
	const { bonusId } = c.req.param();
	const user = c.get("user");
	const userId = user._id;

	const bonus = await playerBonusService.getPlayerActiveBonus(bonusId, userId);
	if (bonus) {
		throw new ApiError(httpStatus.BAD_REQUEST, "Bonus not found");
	}

	const currency = await currencyService.getCurrencyById(user.currencyId);
	const balance = await balanceService.patchUpdate(
		{ userId },
		{ $in: { amount: bonus.amount, bonus: bonus.amount * -1 } },
	);

	await transactionService.createTransaction({
		userId: userId,
		relatedId: String(bonus._id),
		tnxId: Date.now().toString(),
		amount: Number(bonus.amount.toFixed(2)),
		beforeAmount: Number((balance.amount - bonus.amount).toFixed(2)),
		afterAmount: Number(balance.amount.toFixed(2)),
		currencyName: currency.name,
		type: "deposit",
		typeDescription: "Bonus",
		provider: "bonus",
	});

	const storedSocketId = await (global as any).redis.get(String(userId));
	if (storedSocketId) {
		(global as any).io
			.to(storedSocketId)
			.emit("balance", { amount: balance.amount });
	}
	const updatedBonus = await playerBonusService.patchUpdate(
		{ _id: bonusId },
		{ status: "claimed" },
	);
	return c.json(updatedBonus);
});

export const getPlayerGame = catchAsyncV2(async (c: Context) => {
	const user = c.get("user");
	const games = await transactionService.getPlayerGames(user._id);
	return c.json(games);
});
