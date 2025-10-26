import type { Context } from 'hono';
import httpStatus from 'http-status';
import settingService from '#/modulesV2/common/services/setting.service';
// service
import affiliateService from '#/modulesV2/user/services/affiliate.service';
import userService from '#/modulesV2/user/services/user.service';
// utils
import ApiError from '@@/lib/utils/ApiError';
import catchAsyncV2 from '@@/lib/utils/catchAsync.v2';

export const updatePassword = catchAsyncV2(async (c: Context) => {
  const { oldPassword, newPassword } = await c.req.json();
  const affiliate = c.get('affiliate');
  if (!(await affiliate.isPasswordMatch(oldPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
  }
  await affiliateService.updatePassword(String(affiliate._id), newPassword);
  return c.json(null, httpStatus.NO_CONTENT);
});

export const updateAffiliate = catchAsyncV2(async (c: Context) => {
  const data = await c.req.json();
  const affiliateId = c.get('affiliate')._id;

  if (await affiliateService.emailTaken(data.email, affiliateId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already exist');
  }
  if (await affiliateService.usernameTaken(data.username, affiliateId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already exist');
  }
  const affiliate = await affiliateService.patchUpdate({ _id: affiliateId }, data);
  return c.json(affiliate);
});

export const referralCount = catchAsyncV2(async (c: Context) => {
  const affiliateId = c.get('affiliate')._id;

  const affiliates = await affiliateService.getAffiliateByparentId(affiliateId);
  const users = await userService.getUserByinvitorId(affiliateId);
  const activeAffiliates = affiliates.filter((a) => a.status === 'active').length;
  const activeUsers = users.filter((u) => u.status === 'active').length;

  const affiliate = {
    all: affiliates.length,
    active: activeAffiliates,
    inactive: affiliates.length - activeAffiliates,
  };

  const user = {
    all: users.length,
    active: activeUsers,
    inactive: users.length - activeUsers,
  };

  return c.json({ affiliate, user });
});

export const getDashboard = catchAsyncV2(async (c: Context) => {
  const affiliateId = c.get('affiliate')._id;
  const duration = c.req.query('duration') || 'all';

  const dashboard = await affiliateService.getDashboard({
    parentId: String(affiliateId),
    duration: String(duration),
  });
  const user = await userService.getAffiliateUsers({
    parentId: String(affiliateId),
    duration: String(duration),
  });
  const data: any = { user };
  dashboard.forEach((d) => {
    data[d._id] = d.count;
  });
  return c.json(data);
});

export const getDashboardAnalysis = catchAsyncV2(async (c: Context) => {
  const affiliateId = c.get('affiliate')._id;
  const data = await affiliateService.getAnalysis(affiliateId, await c.req.json());

  const setting = await settingService.getSetting();

  const result = {};

  for (const type of ['win', 'bet']) {
    const entry = data[type];
    let sum = 0;
    for (const currency in entry) {
      const amount = entry[currency];
      const rate = setting.rates[currency];
      sum += amount * rate;
    }
    result[type] = sum;
  }
  return c.json(result);
});

export const getDashboardChildren = catchAsyncV2(async (c: Context) => {
  const affiliateId = c.get('affiliate')._id;
  const data = await affiliateService.getDashboardChildren(affiliateId, await c.req.json());
  return c.json(data);
});

export const getChildrenAffiliate = catchAsyncV2(async (c: Context) => {
  const affiliateId = c.get('affiliate')._id;
  const data = await affiliateService.getChildrenAffiliate(String(affiliateId), await c.req.json());
  return c.json(data);
});

export const getAffiliateUsers = catchAsyncV2(async (c: Context) => {
  const affiliateId = c.get('affiliate')._id;
  const data = await affiliateService.getAffiliateUsers(String(affiliateId), await c.req.json());
  return c.json(data);
});

export const getTreeAffiliate = catchAsyncV2(async (c: Context) => {
  const affiliateId = c.get('affiliate')._id;
  const data = await affiliateService.getTreeAffiliate(String(affiliateId));
  return c.json(data);
});

export const getCommission = catchAsyncV2(async (c: Context) => {
  const setting = await settingService.getSetting();
  return c.json(setting.commission);
});

export const updateCommission = catchAsyncV2(async (c: Context) => {
  const setting = await settingService.updateSetting({
    commission: await c.req.json(),
  });
  return c.json(setting.commission);
});

// app.get('/:userId', async (c) => {
export const generateQR = catchAsyncV2(async (c: Context) => {
  const userId = c.req.param('userId');
  const publicUrl = c.env.PUBLIC_URL || 'https://t.me/your_bot';
  const affiliateUrl = `${publicUrl}?start=ref${userId}`;

  // Generate QR code as SVG (browser-friendly)
  // Using a lightweight QR generation approach
  const qrSvg = generateQRCodeSVG(affiliateUrl);

  c.header('Content-Type', 'image/svg+xml');
  c.header('Cache-Control', 'public, max-age=3600');

  return c.body(qrSvg);
});

/**
 * GET /affiliate/qr/:userId/stats
 * Get QR code scan statistics
 */
// app.get('/:userId/stats', async (c) => {
export const getStats = catchAsyncV2(async (c: Context) => {
  const userId = c.req.param('userId');

  try {
    const scans = (await c.env.AFFILIATE_KV.get(`qr_scans:${userId}`, 'json')) || 0;
    const clicks = (await c.env.AFFILIATE_KV.get(`clicks:${userId}`, 'json')) || 0;

    return c.json({
      userId,
      scans: Number(scans),
      clicks: Number(clicks),
      lastUpdated: Date.now(),
    });
  } catch (_error) {
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

/**
 * POST /affiliate/qr/:userId/scan
 * Track QR code scan
 */
// app.post('/:userId/scan', async (c) => {
export const scanCode = catchAsyncV2(async (c: Context) => {
  const userId = c.req.param('userId');

  try {
    // Increment scan count
    const currentScans = (await c.env.AFFILIATE_KV.get(`qr_scans:${userId}`)) || '0';
    const newScans = parseInt(currentScans, 10) + 1;
    await c.env.AFFILIATE_KV.put(`qr_scans:${userId}`, newScans.toString());

    // Track scan event
    const scanKey = `qr_scan_event:${userId}:${Date.now()}`;
    await c.env.AFFILIATE_KV.put(
      scanKey,
      JSON.stringify({
        timestamp: Date.now(),
        userAgent: c.req.header('User-Agent'),
        ip: c.req.header('CF-Connecting-IP'),
      }),
      { expirationTtl: 86400 * 30 },
    ); // 30 days retention

    return c.json({ success: true, scans: newScans });
  } catch (_error) {
    return c.json({ error: 'Failed to track scan' }, 500);
  }
});

/**
 * GET /affiliate/ref/:code
 * Track click and redirect to landing page or Telegram bot
 */
// app.get('/:code', async (c) => {
export const trackClickRedirect = catchAsyncV2(async (c: Context) => {
  const code = c.req.param('code');
  const ua = c.req.header('User-Agent') || 'unknown';
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const referrer = c.req.header('Referer') || 'direct';

  try {
    // Track click event
    const clickKey = `click:${code}:${Date.now()}`;
    await c.env.AFFILIATE_KV.put(
      clickKey,
      JSON.stringify({
        ua,
        ip,
        referrer,
        timestamp: Date.now(),
      }),
      { expirationTtl: 86400 * 30 }, // 30 days retention
    );

    // Increment click count
    const currentClicks = (await c.env.AFFILIATE_KV.get(`clicks:${code}`)) || '0';
    const newClicks = parseInt(currentClicks, 10) + 1;
    await c.env.AFFILIATE_KV.put(`clicks:${code}`, newClicks.toString());

    // Get custom landing page or use default
    const customLanding = await c.env.AFFILIATE_KV.get(`landing:${code}`);
    const _defaultLanding = c.env.DEFAULT_LANDING_URL || 'https://my-app.com';
    const telegramBot = c.env.TELEGRAM_BOT_USERNAME || 'your_bot';

    // Prefer Telegram bot deep link
    const redirectUrl = customLanding || `https://t.me/${telegramBot}?start=ref${code}`;

    return c.redirect(redirectUrl, 302);
  } catch (_error) {
    // Fallback redirect even if tracking fails
    const telegramBot = c.env.TELEGRAM_BOT_USERNAME || 'your_bot';
    return c.redirect(`https://t.me/${telegramBot}?start=ref${code}`, 302);
  }
});

/**
 * GET /affiliate/ref/:code/stats
 * Get click statistics for a referral code
 */
// app.get('/:code/stats', async (c) => {
export const getClickStats = catchAsyncV2(async (c: Context) => {
  const code = c.req.param('code');

  try {
    const clicks = (await c.env.AFFILIATE_KV.get(`clicks:${code}`)) || '0';

    // Get recent click events (last 10)
    const clicksList = await c.env.AFFILIATE_KV.list({
      prefix: `click:${code}:`,
      limit: 10,
    });
    const recentClicks = [];

    for (const key of clicksList.keys) {
      const data = await c.env.AFFILIATE_KV.get(key.name, 'json');
      if (data) recentClicks.push(data);
    }

    return c.json({
      code,
      totalClicks: parseInt(clicks, 10),
      recentClicks: recentClicks.slice(0, 10),
    });
  } catch (_error) {
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

/**
 * POST /affiliate/ref/:code/landing
 * Set custom landing URL for a referral code
 */
// app.post('/:code/landing', async (c) => {
export const customLandingUrl = catchAsyncV2(async (c: Context) => {
  const code = c.req.param('code');
  const body = await c.req.json();
  const landingUrl = body.url;

  if (!landingUrl || !isValidUrl(landingUrl)) {
    return c.json({ error: 'Invalid URL' }, 400);
  }

  try {
    await c.env.AFFILIATE_KV.put(`landing:${code}`, landingUrl);
    return c.json({ success: true, code, landingUrl });
  } catch (_error) {
    return c.json({ error: 'Failed to set landing URL' }, 500);
  }
});

/**
 * Helper: Validate URL
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// export default app;
