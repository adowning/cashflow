/* eslint-disable @typescript-eslint/no-explicit-any */
 
import moment from 'moment';
// //import { RootFilterQuery, UpdateQuery } from 'mongoose';
// models

export const usernameTaken = async (username: string, id?: string) => {
    return await User.isUsernameTaken(username, id);
};

export const emailTaken = async (email: string, id?: string) => {
    return await User.isEmailTaken(email, id);
};

export const phoneTaken = async (phone: string, id?: string) => {
    return await User.isPhoneTaken(phone, id);
};

export const getUserById = async (id: string) => {
    return await User.findById(id);
};

export const getUserByinvitorId = async (invitorId: string) => {
    return await User.find({ invitorId });
};

export const getUserByUsername = async (username: string) => {
    return await User.findOne({ username: username.toLowerCase().replaceAll(' ', '') });
};

export const getUserByEmail = async (email: string) => {
    return await User.findOne({ email: email.toLowerCase().replaceAll(' ', '') });
};

export const getUserByPhone = async (phone: string) => {
    return await User.findOne({ phone: phone.toLowerCase().replaceAll(' ', '') });
};
interface ICreateUser {
    username: string;
    email: string;
    password: string;
    role: string;
    currencyId: string;
    currency: string;
    country: {
        code: string;
        name: string;
    };
    invitorId?: string;
    inviteCode?: string;
    path?: string[];
}

export const createUser = async (data: ICreateUser) => {
    return await User.create(data);
};

export const updatePassword = async (id: string, password: string) => {
     const newPassword = await Bun.password.hash(password);
    return await User.findOneAndUpdate({ _id: id }, { password: newPassword });
};

export const patchUpdate = async (condition: any, data: any) => {
    return await User.findOneAndUpdate(condition, data, { new: true });
};

interface IUsersFilter {
    status: string;
    username?: string;
    phone?: string;
    email?: string;
    isAll?: boolean;
    currentPage: number;
    rowsPerPage: number;
    date?: {
        start: string | Date;
        end: string | Date;
    };
}

export const getUsers = async (filter: IUsersFilter) => {
     
     const conditions: any = { role: 'user' };
    if (filter.status) conditions.status = filter.status;
    if (filter.username) conditions.username = { $regex: new RegExp(filter.username, 'i') };
    if (filter.phone) conditions.phone = filter.phone;
    if (filter.email) conditions.email = filter.email;

    if (!filter.isAll && filter.date) {
         const start = new Date(filter.date.start);
         const end = new Date(filter.date.end);
        conditions.createdAt = { $gte: start, $lte: end };
    }

     const skip = (filter.currentPage - 1) * filter.rowsPerPage;
     const total = await User.countDocuments(conditions);

     const data = await User.aggregate([
        {
            $match: conditions
        },
        {
            $skip: skip
        },
        {
            $limit: filter.rowsPerPage
        },
        {
            $lookup: {
                from: 'balances',
                as: 'balance',
                localField: '_id',
                foreignField: 'userId'
            }
        },
        {
            $unwind: '$balance'
        }
    ]);

    return { data, total };
};

export const getAffiliateUsers = async (filter: { parentId: string; duration: string }) => {
     
     const conditions: any = { path: filter.parentId };
    if (filter.duration === '30') {
         const today = new Date();
         const startDate = moment().add(-30, 'days').startOf('day').toDate();
        conditions.createdAt = {
            $gte: startDate,
            $lte: today
        };
    }

     const data = await User.countDocuments(conditions);
    return data;
};

export const getUserCount = async () => {
    
};
