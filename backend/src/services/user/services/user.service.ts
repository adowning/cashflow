import db from '@backend/database';
import type { User } from '@backend/database/interfaces';
import { users } from '@/database/schema';
import type { z } from '@hono/zod-openapi';
import { eq, ilike, or } from 'drizzle-orm';
import type { createInsertSchema } from 'drizzle-zod';
// import { createUser } from '../controllers/user.controller.v2';

export function findManyUser(
  limit?: number,
  offset?: number,
  filter?: { username?: string; email?: string }
)
{
  const query = db.select().from(users);

  if (filter) {
    const { username, email } = filter;
    if (username || email) {
      query.where(
        or(
          username ? ilike(users.name, `%${username}%`) : undefined,
          email ? ilike(users.email, `%${email}%`) : undefined
        )
      );
    }
  }

  if (limit) {
    query.limit(limit);
  }

  if (offset) {
    query.offset(offset);
  }

  return query;
}

// export function createUser(
//   data: z.infer<ReturnType<typeof createInsertSchema>>
// )
// {
//   return db.insert(users).values(data).returning();
// }

export function findUserById(id: string)
{
  return db.select().from(users).where(eq(users.id, id));
}
export function getUsers()
{
  return db.select().from(users);
}
export function updateUser(id: string, data: z.infer<ReturnType<typeof createInsertSchema>>)
{
  return db.update(users).set(data).where(eq(users.id, id)).returning();
}

export function deleteUser(id: string)
{
  return db.delete(users).where(eq(users.id, id)).returning();
}

// From Pinia Store & HAR files

export function checkUser(userId: string)
{
  // Assuming a simple check that returns the user if they exist
  return findUserById(userId);
}

// export async function getUserBalance(userId: string) {
//   return  db.select().from(balances).where(eq(balances.userId, userId));
// }

// export async function setUserCurrency(currencyCode: string) {
//   // This is a simplified example. A real implementation would be more complex.
//   const currency =  db
//     .select()
//     .from(currencies)
//     .where(eq(currencies.code, currencyCode));
//   if (currency.length === 0) {
//     throw new Error("Invalid currency code");
//   }
//   // Logic to update user's currency preference would go here.
//   // For now, we'll just return the currency.
//   return currency[0];
// }

export function sendEmailVerification(userId: string)
{
  // Placeholder for sending a verification email
  console.log('Sending verification email to user', userId);
  return { status: 'ok', time: Date.now() };
}

export function getUserInfo(userId: string)
{
  return findUserById(userId);
}

// export function getVipInfo(userId: string)
// {
//   // Assuming vip info is part of the users table for now
//   return db
//     .select({ vipInfo: users.vipInfoId })
//     .from(users)
//     .where(eq(users.id, userId));
// }

// New Routes
export function getUserAmount()
{
  // Placeholder, you will need to implement the actual logic
  return {
    amount: 1000,
    currency: { fiat: true, name: 'USD', symbol: '$', type: 'fiat' },
    withdraw: 500,
    rate: 1,
  };
}
// export function setUserRTGSettings(time: number, userId: string)
// {
//   console.log(time);
//   console.log(userId);
//   return db
//     .update(users)
//     .set({ rtgBlockTime: time })
//     .where(eq(users.id, userId))
//     .returning();
// }
export function updateUserInfo(data: User)
{
  // Placeholder, you will need to implement the actual logic
  return { data };
}

export function updateEmail(data: { email: string; password: string })
{
  // Placeholder, you will need to implement the actual logic
  return { ...data };
}

export function updatePassword(data: {
  now_password: string;
  new_password: string;
})
{
  // Placeholder, you will need to implement the actual logic
  console.log(data);
}

export function suspendUser(data: { time: number })
{
  // Placeholder, you will need to implement the actual logic
  console.log(data);
}

// export async function getBalanceList() {
//   return  db.select().from(balances);
// }

// Game Routes
export function enterGame()
{
  // Placeholder
  return {};
}

export function userGame()
{
  // Placeholder
  return [];
}

export function favoriteGame()
{
  // Placeholder
  return { success: true };
}

// export async function getGameHistory(userId: string) {
//   return  db.select().from(GameHistory).where(eq(gameHistory.userId, userId));
// }

export function spinPage()
{
  // Placeholder
  return {};
}

export function spin()
{
  // Placeholder
  return {};
}
const usernameTaken = async (username: string) => {
  // return await UserModel.isUsernameTaken(username, id);
  const user = db.select().from(users).where(eq(users.name, username));
  return user !== undefined ? true : false;
};

export function favoriteGameList()
{
  // Placeholder
  return [];
}
export default {
  usernameTaken,
  // emailTaken,
  // phoneTaken,
  findUserById,
  // getUserById,
  // getUserByinvitorId,
  // getUserByUsername,
  // getUserByEmail,
  // getUserByPhone,
  // getUsers,
  // getUserCount,
  // getAffiliateUsers,
  getUsers,
  //   createUser,
  updateUser,
  updatePassword,

  // patchUpdate,
};

// import bcrypt from "bcryptjs";
// import moment from "moment";
// // //import { RootFilterQuery, UpdateQuery } from 'mongoose';
// // models
// import UserModel, { type IUser } from "@/types";


// const emailTaken = async (email: string, id?: string) => {
// 	return await UserModel.isEmailTaken(email, id);
// };

// const phoneTaken = async (phone: string, id?: string) => {
// 	return await UserModel.isPhoneTaken(phone, id);
// };

// const getUserById = async (id: string) => {
// 	return await UserModel.findById(id);
// };

// const getUserByinvitorId = async (invitorId: string) => {
// 	return await UserModel.find({ invitorId });
// };

// const getUserByUsername = async (username: string) => {
// 	return await UserModel.findOne({
// 		username: username.toLowerCase().replaceAll(" ", ""),
// 	});
// };

// const getUserByEmail = async (email: string) => {
// 	return await UserModel.findOne({
// 		email: email.toLowerCase().replaceAll(" ", ""),
// 	});
// };

// const getUserByPhone = async (phone: string) => {
// 	return await UserModel.findOne({
// 		phone: phone.toLowerCase().replaceAll(" ", ""),
// 	});
// };
// interface ICreateUser {
// 	username: string;
// 	email: string;
// 	password: string;
// 	role: string;
// 	currencyId: string;
// 	currency: string;
// 	country: {
// 		code: string;
// 		name: string;
// 	};
// 	invitorId?: string;
// 	inviteCode?: string;
// 	path?: string[];
// }

// const createUser = async (data: ICreateUser) => {
// 	return await UserModel.create(data);
// };

// const updatePassword = async (id: string, password: string) => {
// 	const newPassword = await bcrypt.hash(password, 8);
// 	return await UserModel.findOneAndUpdate(
// 		{ _id: id },
// 		{ password: newPassword },
// 	);
// };

// const patchUpdate = async (
// 	condition: RootFilterQuery<IUser>,
// 	data: UpdateQuery<IUser>,
// ) => {
// 	return await UserModel.findOneAndUpdate(condition, data, { new: true });
// };

// interface IUsersFilter {
// 	status: string;
// 	username?: string;
// 	phone?: string;
// 	email?: string;
// 	isAll?: boolean;
// 	currentPage: number;
// 	rowsPerPage: number;
// 	date?: {
// 		start: string | Date;
// 		end: string | Date;
// 	};
// }

// const getUsers = async (filter: IUsersFilter) => {
// 	// eslint-disable-next-line
// 	const conditions: any = { role: "user" };
// 	if (filter.status) conditions.status = filter.status;
// 	if (filter.username)
// 		conditions.username = { $regex: new RegExp(filter.username, "i") };
// 	if (filter.phone) conditions.phone = filter.phone;
// 	if (filter.email) conditions.email = filter.email;

// 	if (!filter.isAll && filter.date) {
// 		const start = new Date(filter.date.start);
// 		const end = new Date(filter.date.end);
// 		conditions.createdAt = { $gte: start, $lte: end };
// 	}

// 	const skip = (filter.currentPage - 1) * filter.rowsPerPage;
// 	const total = await UserModel.countDocuments(conditions);

// 	const data = await UserModel.aggregate([
// 		{
// 			$match: conditions,
// 		},
// 		{
// 			$skip: skip,
// 		},
// 		{
// 			$limit: filter.rowsPerPage,
// 		},
// 		{
// 			$lookup: {
// 				from: "balances",
// 				as: "balance",
// 				localField: "_id",
// 				foreignField: "userId",
// 			},
// 		},
// 		{
// 			$unwind: "$balance",
// 		},
// 	]);

// 	return { data, total };
// };

// const getAffiliateUsers = async (filter: {
// 	parentId: string;
// 	duration: string;
// }) => {
// 	// eslint-disable-next-line
// 	const conditions: any = { path: filter.parentId };
// 	if (filter.duration === "30") {
// 		const today = new Date();
// 		const startDate = moment().add(-30, "days").startOf("day").toDate();
// 		conditions.createdAt = {
// 			$gte: startDate,
// 			$lte: today,
// 		};
// 	}

// 	const data = await UserModel.countDocuments(conditions);
// 	return data;
// };

// const getUserCount = async () => {
//   const data = await UserModel.aggregate([
//     {
//       $match: {
//         role: 'user',
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         total: { $sum: 1 },
//         active: {
//           $sum: {
//             $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
//           },
//         },
//         blocked: {
//           $sum: {
//             $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0],
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         total: 1,
//         active: 1,
//         blocked: 1,
//       },
//     },
//   ]);
//   if (data.length) {
//     return data[0];
//   }
//   return { total: 0, active: 0, blocked: 0 };
// };

