// model

import { groupBy } from "lodash";
import settingService from "#/modulesV2/common/services/setting.service";
import AffiliateLogModel, { type IAffiliateLog } from "@/types";

export interface ICreateAffiliateLog {
	invitorId: string;
	childId: string;
	currency: string;
	referralCode: string;
	betAmount?: number;
	commissionAmount?: number;
	commissionWager?: number;
	totalReferralAmount?: number;
	referralAmount?: number;
	referralWager?: number;
	lastVipLevelAmount?: number;
}

const createAffiliateLog = async (log: ICreateAffiliateLog) => {
	return await AffiliateLogModel.create(log);
};

const updateAffiliateLog = async (
	condition: RootFilterQuery<IAffiliateLog>,
	log: UpdateQuery<IAffiliateLog>,
) => {
	return await AffiliateLogModel.findOneAndUpdate(condition, log, {
		new: true,
	});
};

const getCommissionRewardStatus = async (userId: string) => {
	return await AffiliateLogModel.aggregate([
		{
			$match: {
				invitorId: new Types.ObjectId(userId),
			},
		},
		{
			$group: {
				_id: "$currency",
				totalCommissionWager: { $sum: "$commissionWager" },
				totalCommissionAmount: { $sum: "$commissionAmount" },
				totalReferralAmount: { $sum: "$referralAmount" },
				totalReferralWager: { $sum: "$referralWager" },
			},
		},
	]);
};

interface IFilter {
	userId: string;
	type: string;
	currentPage: number;
	rowsPerPage: number;
}

const getRewardLog = async (filter: IFilter) => {
	const conditions = {
		invitorId: filter.userId,
	};

	const skip = (filter.currentPage - 1) * filter.rowsPerPage;
	const total = await AffiliateLogModel.countDocuments(conditions);

	if (filter.type === "commission") {
		const data = await AffiliateLogModel.aggregate([
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
					from: "users",
					as: "user",
					localField: "childId",
					foreignField: "_id",
					pipeline: [
						{
							$project: {
								_id: 1,
								username: 1,
								createdAt: 1,
							},
						},
					],
				},
			},
			{
				$unwind: "$user",
			},
			{
				$lookup: {
					from: "referralCodes",
					as: "referralData",
					localField: "referralCode",
					foreignField: "code",
				},
			},
			{
				$unwind: "$referralData",
			},
		]);

		return { data, total };
	}

	const data = await AffiliateLogModel.aggregate([
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
				from: "users",
				as: "user",
				localField: "childId",
				foreignField: "_id",
				pipeline: [
					{
						$project: {
							_id: 1,
							username: 1,
							createdAt: 1,
						},
					},
				],
			},
		},
		{
			$unwind: "$user",
		},
		{
			$lookup: {
				from: "balances",
				as: "balance",
				localField: "childId",
				foreignField: "userId",
				pipeline: [
					{
						$project: {
							turnover: 1,
						},
					},
				],
			},
		},
		{
			$unwind: "$balance",
		},
		{
			$lookup: {
				from: "referralCodes",
				as: "referralData",
				localField: "referralCode",
				foreignField: "code",
			},
		},
		{
			$unwind: "$referralData",
		},
	]);

	return { data, total };
};

const getAffiliateByUser = async (
	condition: RootFilterQuery<IAffiliateLog>,
) => {
	return await AffiliateLogModel.findOne(condition);
};

const getRewardDashboard = async (userId: string, currency: string) => {
	const result = await AffiliateLogModel.aggregate([
		{
			$match: {
				invitorId: new Types.ObjectId(userId),
			},
		},
		{
			$group: {
				_id: "$currency",
				totalBetAmount: { $sum: "$betAmount" },
				totalCommissionAmount: { $sum: "$commissionAmount" },
				totalCommissionWager: { $sum: "$commissionWager" },
				totalReferralAmount: { $sum: "$totalReferralAmount" },
				totalAvailableReferral: { $sum: "$referralAmount" },
				totalReferralWager: { $sum: "$referralWager" },
			},
		},
	]);

	const data = {
		totalBetAmount: 0,
		totalCommissionAmount: 0,
		totalCommissionWager: 0,
		totalReferralAmount: 0,
		totalAvailableReferral: 0,
		totalReferralWager: 0,
	};
	const setting = await settingService.getSetting();

	result.forEach((element) => {
		data.totalBetAmount +=
			element.totalBetAmount * (1 / setting.rates[element._id]);
		data.totalCommissionAmount +=
			element.totalCommissionAmount * (1 / setting.rates[element._id]);
		data.totalCommissionWager +=
			element.totalCommissionWager * (1 / setting.rates[element._id]);
		data.totalReferralAmount +=
			element.totalReferralAmount * (1 / setting.rates[element._id]);
		data.totalAvailableReferral +=
			element.totalAvailableReferral * (1 / setting.rates[element._id]);
		data.totalReferralWager +=
			element.totalReferralWager * (1 / setting.rates[element._id]);
	});

	data.totalBetAmount = data.totalBetAmount * setting.rates[currency];
	data.totalCommissionAmount =
		data.totalCommissionAmount * setting.rates[currency];
	data.totalCommissionWager =
		data.totalCommissionWager * setting.rates[currency];
	data.totalReferralAmount = data.totalReferralAmount * setting.rates[currency];
	data.totalAvailableReferral =
		data.totalAvailableReferral * setting.rates[currency];
	data.totalReferralWager = data.totalReferralWager * setting.rates[currency];

	return data;
};

const getRewardActivity = async (userId: string, currency: string) => {
	const result = await AffiliateLogModel.aggregate([
		{
			$match: {
				invitorId: new Types.ObjectId(userId),
			},
		},
		{
			$group: {
				_id: {
					code: "$referralCode",
					currency: "$currency",
				},
				totalBetAmount: { $sum: "$betAmount" },
				totalCommissionAmount: { $sum: "$commissionAmount" },
				totalCommissionWager: { $sum: "$commissionWager" },
				totalReferralAmount: { $sum: "$totalReferralAmount" },
				totalAvailableReferral: { $sum: "$referralAmount" },
				totalReferralWager: { $sum: "$referralWager" },
			},
		},
		{
			$lookup: {
				from: "referralCodes",
				as: "referralData",
				localField: "_id.referralCode",
				foreignField: "code",
			},
		},
		{
			$unwind: "$referralData",
		},
		{
			$sort: {
				"referralData.createdAt": 1,
			},
		},
		{
			$project: {
				referralCode: "$_id.referralCode",
				name: "$referralData.name",
				currency: "$_id.currency",
				createdAt: "$referralData.createdAt",
				totalBetAmount: 1,
				totalCommissionAmount: 1,
				totalCommissionWager: 1,
				totalReferralAmount: 1,
				totalAvailableReferral: 1,
				totalReferralWager: 1,
			},
		},
	]);

	const usdData = [];
	const setting = await settingService.getSetting();

	const codeGroup = groupBy(result, "referralCode");

	Object.keys(codeGroup).forEach((key) => {
		const values = {
			totalBetAmount: 0,
			totalCommissionAmount: 0,
			totalCommissionWager: 0,
			totalReferralAmount: 0,
			totalAvailableReferral: 0,
			totalReferralWager: 0,
		};
		codeGroup[key].forEach((item) => {
			values.totalBetAmount +=
				item.totalBetAmount * (1 / setting.rates[item.currency]);
			values.totalCommissionAmount +=
				item.totalCommissionAmount * (1 / setting.rates[item.currency]);
			values.totalCommissionWager +=
				item.totalCommissionWager * (1 / setting.rates[item.currency]);
			values.totalReferralAmount +=
				item.totalReferralAmount * (1 / setting.rates[item.currency]);
			values.totalAvailableReferral +=
				item.totalAvailableReferral * (1 / setting.rates[item.currency]);
			values.totalReferralWager +=
				item.totalReferralWager * (1 / setting.rates[item.currency]);
		});
		usdData.push({
			...values,
			referralCode: key,
			name: codeGroup[key][0].name,
			createdAt: codeGroup[key][0].createdAt,
		});
	});

	const data = usdData.map((item) => ({
		...item,
		totalBetAmount: item.totalBetAmount * setting.rates[currency],
		totalCommissionAmount: item.totalCommissionAmount * setting.rates[currency],
		totalCommissionWager: item.totalCommissionWager * setting.rates[currency],
		totalReferralAmount: item.totalReferralAmount * setting.rates[currency],
		totalAvailableReferral:
			item.totalAvailableReferral * setting.rates[currency],
		totalReferralWager: item.totalReferralWager * setting.rates[currency],
	}));

	return data;
};

const convertCommission = async (userId: string) => {
	return await AffiliateLogModel.updateMany(
		{ invitorId: new Types.ObjectId(userId) },
		[
			{
				$set: {
					commissionWager: { $add: ["$commissionWager", "$commissionAmount"] },
					commissionAmount: 0,
				},
			},
		],
	);
};

const convertReferral = async (userId: string) => {
	return await AffiliateLogModel.updateMany(
		{ invitorId: new Types.ObjectId(userId) },
		[
			{
				$set: {
					referralWager: { $add: ["$referralWager", "$referralAmount"] },
					referralAmount: 0,
				},
			},
		],
	);
};

export default {
	getCommissionRewardStatus,
	getAffiliateByUser,
	createAffiliateLog,
	updateAffiliateLog,
	getRewardLog,
	getRewardDashboard,
	getRewardActivity,
	convertCommission,
	convertReferral,
};
