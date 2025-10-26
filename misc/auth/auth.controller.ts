/* eslint-disable @typescript-eslint/no-explicit-any */
import moment from 'moment';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import type { Context } from 'hono';
import ApiError from '../../utils/ApiError';
import catchAsyncV2 from '../../utils/catchAsync.v2';
import {
  createBalanceForNewUser,
  getDetailedBalance,
} from '../gameplay/balance-management.service';
import { getGeoInfo } from '../../utils/getCountry';
import { getAffiliateByReferralCode, getReferralCodeByCode } from '../../services/ggr.service';
import {
  createUser,
  emailTaken,
  emailTaken,
  getUserByEmail,
  getUserByPhone,
  getUserByUsername,
  usernameTaken,
} from './user.service';

// service

// middlewares

export const adminLogin = catchAsyncV2(async (c: Context) => {
  const { username, password } = await c.req.json();
  const user = await getUserByUsername(username as string);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (!(await user.isPasswordMatch(String(password)))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password does not match');
  }

  if (user.status !== 'active') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Your account is ${user.status}`);
  }

  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You do not have permission to login');
  }

  const token = jwt.sign(
    { id: user._id, username: user.username },
    configurationManager.jwt.secret,
  );
  const expiredTime = moment()
    .add(configurationManager.jwt.accessExpirationMinutes, 'minutes')
    .toDate();
  await sessionService.createSession({ userId: String(user._id), token, expiredTime });

  //   const userIp = getIpAddress(c);
  //   const userAgent = c.req.header('user-agent');
  //   const isMobile = /mobile/i.test(userAgent);
  //   const parser = new UAParser.UAParser(userAgent);
  //   const result = parser.getResult();
  const country = {
    code: 'Unknown',
    name: 'Unknown',
  };
  const ip = (c.req.header('x-forwarded-for') || c.req.header('remote-addr')) as string;
  if (ip) {
    const { data } = await getGeoInfo(ip);
    country.code = data.countryCode;
    country.name = data.country;
  }

  //   await authLogService.createAuthLog({
  //     userId: String(user._id),
  //     ip: userIp || '',
  //     userAgent || '',
  //     os: result.os.name + ' ' + result.os.version,
  //     browser: result.browser.name + ' ' + result.browser.version,
  //     device: isMobile ? 'mobile' : 'desktop',
  //     country
  //   });

  return c.json({ user, accessToken: token });
});

export const me = catchAsyncV2(async (c: Context) => {
  const user = c.get('user');
  return c.json(user);
});

export const register = catchAsyncV2(async (c: Context) => {
  const { email, username, password, currencyId, inviteCode } = await c.req.json();

  if (await usernameTaken(username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  if (await emailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const newUser: any = {
    username,
    email,
    currencyId,
    password,
    role: 'user',
    currency: 'USD',
    country: {
      code: 'Unknown',
      name: 'Unknown',
    },
  };

  if (inviteCode) {
    if (inviteCode.startsWith('p-') && inviteCode.split('p-')[1]) {
      const referralCode = await getReferralCodeByCode(inviteCode.split('p-')[1]);
      if (referralCode) {
        newUser.invitorId = String(referralCode.userId);
        newUser.inviteCode = inviteCode.split('p-')[1];
      }
    } else {
      const invitor = await getAffiliateByReferralCode(inviteCode);
      if (invitor) {
        newUser.invitorId = String(invitor._id);
        newUser.path = [...invitor.path, String(invitor._id)];
      }
    }
  }

  const ip = (c.req.header('x-forwarded-for') || c.req.header('remote-addr')) as string;
  if (ip) {
    const { data } = await getGeoInfo(ip);
    newUser.country.code = data.countryCode;
    newUser.country.name = data.country;
  }

  const user = await createUser(newUser);
  await createBalanceForNewUser(String(user._id), String(user.currencyId));
  return c.json({ user });
});

export const login = catchAsyncV2(async (c: Context) => {
  const { username, password } = await c.req.json();

  let user: any;
  user = await getUserByUsername(username);
  if (!user) {
    user = await getUserByEmail(username);
  }
  if (!user) {
    user = await getUserByPhone(username);
  }

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (!(await user.isPasswordMatch(String(password)))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password does not match');
  }

  if (user.status !== 'active') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Your account is ${user.status}`);
  }

  if (user.role !== 'user') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You do not have permission to login');
  }

  const token = jwt.sign(
    { id: user._id, username: user.username },
    configurationManager.jwt.secret,
  );
  const expiredTime = moment()
    .add(configurationManager.jwt.accessExpirationMinutes, 'minutes')
    .toDate();
  await sessionService.createSession({ userId: String(user._id), token, expiredTime });

  //   const userIp = getIpAddress(c);

  //   const userAgent = c.req.header('user-agent');
  //   const parser = new UAParser.UAParser(userAgent);
  //   const result = parser.getResult();

  //   const country = {
  //     code: 'Unknown',
  //     name: 'Unknown'
  //   };

  //   if (userIp) {
  //     const { data } = await getGeoInfo(userIp);
  //     country.code = data.countryCode;
  //     country.name = data.country;
  //   }

  //   await authLogService.createAuthLog({
  //     userId: String(user._id),
  //     ip: userIp || '',
  //     userAgent || '',
  //     os: result.os.name + ' ' + result.os.version,
  //     browser: result.browser.name + ' ' + result.browser.version,
  //     device: result.device.type || 'desktop',
  //     country
  //   })

  const balance = await getDetailedBalance(user._id);
  //   const affiliateLog = await affiliateLogService.getAffiliateByUser({ childId: user._id });
  //   await (global as any).redis.set(
  //     `${user._id}-info`,
  //     JSON.stringify({
  //       invitorId: user.invitorId,
  //       invitorCode: user.invitorCode,
  //       currency: user.currency,
  //       path: user.path,
  //       affiliateInit: user.affiliateInit,
  //       referralInit: user.referralInit,
  //       lastVipLevelAmount: affiliateLog ? affiliateLog.lastVipLevelAmount : -1
  //     })
  //   );
  return c.json({ user, balance, accessToken: token });
});

export const logout = catchAsyncV2(async (c: Context) => {
  const user = c.get('user');
  await sessionService.deleteSessionByUserId(String(user.id));
  await authLogService.updateAuthLog(String(user.id), 'Manual logout');
  await (global as any).redis.del(`${user.id}-info`);
  return c.json(null, httpStatus.NO_CONTENT);
});

// export const affiliateMe = catchAsyncV2(async (c: Context) => {
//   const affiliate = c.get('affiliate');
//   return c.json(affiliate);
// });

// export const affiliateLogin = catchAsyncV2(async (c: Context) => {
//   const { username, password } = await c.req.json();

//   let affiliate: any;
//   affiliate = await affiliateService.getAffiliateByUsername(username);
//   if (!affiliate) {
//     affiliate = await affiliateService.getAffiliateByEmail(username);
//   }

//   if (!affiliate) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
//   }
//   if (!(await affiliate.isPasswordMatch(String(password)))) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Password does not match');
//   }

//   if (affiliate.status !== 'active') {
//     throw new ApiError(httpStatus.BAD_REQUEST, `Your account is ${affiliate.status}`);
//   }

//   const token = jwt.sign({ id: affiliate._id, username: affiliate.username }, config.jwt.secret);
//   const expiredTime = moment().add(config.jwt.accessExpirationMinutes, 'minutes').toDate();
//   await sessionService.createSession({ userId: String(affiliate._id), token, expiredTime });

//   return c.json({ affiliate, accessToken: token });
// });

// export const affiliateRegister = catchAsyncV2(async (c: Context) => {
//   const { email, username, firstName, lastName, password, referralCode } = await c.req.json();

//   if (await usernameTaken(username)) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
//   }

//   if (await emailTaken(email)) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
//   }

//   const parent = await affiliateService.getAffiliateByReferralCode(referralCode);

//   if (!parent) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Referral code');
//   }

//   const parentRoleIndex = AFFILIATE_ROLE.findIndex((r) => r === parent.role);

//   if (parentRoleIndex === AFFILIATE_ROLE.length - 1) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid parent');
//   }

//   const newRole = AFFILIATE_ROLE[parentRoleIndex + 1];

//   let referral = generateReferral();
//   let otpCheck = await affiliateService.getAffiliateByReferralCode(referral);

//   while (otpCheck) {
//     referral = generateReferral();
//     otpCheck = await affiliateService.getAffiliateByReferralCode(referral);
//   }

//   const newAffiliate: any = {
//     username,
//     email,
//     firstName,
//     lastName,
//     password,
//     parentId: parent._id,
//     path: [...parent.path, parent._id],
//     referralCode: referral,
//     role: newRole,
//     status: 'active'
//   };

//   const affiliate = await affiliateService.createAffiliate(newAffiliate);

//   const token = jwt.sign({ id: affiliate._id, username: affiliate.username }, config.jwt.secret);
//   const expiredTime = moment().add(config.jwt.accessExpirationMinutes, 'minutes').toDate();
//   await sessionService.createSession({ userId: String(affiliate._id), token, expiredTime });

//   return c.json({ affiliate, accessToken: token });
// });

// export const affiliateLogout = catchAsyncV2(async (c: Context) => {
//   const affiliate = c.get('affiliate');
//   await sessionService.deleteSessionByUserId(String(affiliate.id));
//   return c.json(null, httpStatus.NO_CONTENT);
// });
