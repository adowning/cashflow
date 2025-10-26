// model
import KycModel from "@/types";
//import { RootFilterQuery, UpdateQuery } from 'mongoose';

export interface IKyc {
	userId: string;
	frontImg: string;
	backImg: string;
	type: string;
	country: {
		code: string;
		name: string;
	};
}

const createKYC = async (kyc: IKyc) => {
	console.log(kyc);
	return await KycModel.create(kyc);
};

const getKycByUser = async (userId: string) => {
	return await KycModel.findOne({ userId });
};

interface IKycFilter {
	status: string;
	email?: string;
	currentPage: number;
	rowsPerPage: number;
	date?: {
		start: string | Date;
		end: string | Date;
	};
}

const getKycs = async (filter: IKycFilter) => {
	const conditions: any = {};
	if (filter.date) {
		const start = new Date(filter.date.start);
		const end = new Date(filter.date.end);
		conditions.createdAt = { $gte: start, $lte: end };
	}

	if (filter.status !== "all") conditions.status = filter.status;

	const skip = (filter.currentPage - 1) * filter.rowsPerPage;
	const total = await KycModel.countDocuments(conditions);

	const data = await KycModel.aggregate([
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
				localField: "userId",
				foreignField: "_id",
				as: "user",
			},
		},
		{ $unwind: { path: "$user" } },
		{ $sort: { updatedAt: -1 } },
	]);
	return { data, total };
};

const patchUpdate = async (
	condition: RootFilterQuery<IKyc>,
	data: UpdateQuery<IKyc>,
) => {
	return await KycModel.findOneAndUpdate(condition, data, { new: true });
};

export default {
	createKYC,
	getKycByUser,
	getKycs,

	patchUpdate,
};
