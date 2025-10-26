import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import {
  customType,
  doublePrecision,
  varchar,
  uniqueIndex,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';
import { baseColumns, withBase } from './common.schema';

export const customBytes = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
  fromDriver(value: unknown) {
    if (Buffer.isBuffer(value)) return value;
    throw new Error('Expected Buffer');
  },
  toDriver(value: Buffer) {
    return value;
  },
});

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  displayUsername: text('display_username').notNull(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date', precision: 3 }).notNull(),
  role: text('role'),
  banned: boolean('banned'),
  banReason: text('banReason'),
  banExpires: timestamp('banExpires', { mode: 'date', precision: 3 }),
  phone: text('phone'),
});

// Zod schemas for users
export const ZUsersSelectSchema = createSelectSchema(users);
export const ZUsersUpdateSchema = createUpdateSchema(users);
export type TUsers = z.infer<typeof users>;
export type TUsersSelect = typeof users.$inferSelect & TUsers;

export const usersRoles = pgTable(
  'user_role',
  {
    ...baseColumns,
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: varchar('role_id', { length: 255 })
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('user_role_user_id_idx').on(table.userId),
    index('user_role_role_id_idx').on(table.roleId),
    uniqueIndex('user_role_unique_idx').on(table.userId, table.roleId),
  ],
);

// Zod schemas for usersRoles
export const ZUsersRolesSelectSchema = createSelectSchema(usersRoles);
export const ZUsersRolesUpdateSchema = createUpdateSchema(usersRoles);
export type TUsersRoles = z.infer<typeof usersRoles>;
export type TUsersRolesSelect = typeof usersRoles.$inferSelect & TUsersRoles;

export const roles = pgTable(
  'role',
  {
    ...baseColumns,
    name: varchar('name', { length: 64 }).notNull().unique(),
    description: text('description'),
  },
  (table) => [uniqueIndex('role_name_idx').on(table.name)],
);

// Zod schemas for roles
export const ZRolesSelectSchema = createSelectSchema(roles);
export const ZRolesUpdateSchema = createUpdateSchema(roles);
export type TRoles = z.infer<typeof roles>;
export type TRolesSelect = typeof roles.$inferSelect & TRoles;

// Auth Sessions (Distinct from Game Sessions)
export const authSessions = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt', { mode: 'date', precision: 3 }).notNull(),
  token: text('token').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date', precision: 3 }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull(),
  activeOrganizationId: text('activeOrganizationId'),
  impersonatedBy: text('impersonatedBy'),
});

// Zod schemas for authSessions
export const ZAuthSessionsSelectSchema = createSelectSchema(authSessions);
export const ZAuthSessionsUpdateSchema = createUpdateSchema(authSessions);
export type TAuthSessions = z.infer<typeof authSessions>;
export type TAuthSessionsSelect = typeof authSessions.$inferSelect & TAuthSessions;

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { mode: 'date', precision: 3 }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { mode: 'date', precision: 3 }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt', { mode: 'date', precision: 3 }).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date', precision: 3 }).notNull(),
});

// Zod schemas for accounts
export const ZAccountsSelectSchema = createSelectSchema(accounts);
export const ZAccountsUpdateSchema = createUpdateSchema(accounts);
export type TAccounts = z.infer<typeof accounts>;
export type TAccountsSelect = typeof accounts.$inferSelect & TAccounts;

export const verifications = pgTable('verification', {
  ...baseColumns,
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date', precision: 3 }).notNull(),
});

// Zod schemas for verifications
export const ZVerificationsSelectSchema = createSelectSchema(verifications);
export const ZVerificationsUpdateSchema = createUpdateSchema(verifications);
export type TVerifications = z.infer<typeof verifications>;
export type TVerificationsSelect = typeof verifications.$inferSelect & TVerifications;

export const jwks = pgTable('jwks', {
  ...baseColumns,
  privateKey: text('privateKey').notNull(),
  passpublicKey: text('passpublicKey').notNull(),
});

// Zod schemas for jwks
export const ZJwksSelectSchema = createSelectSchema(jwks);
export const ZJwksUpdateSchema = createUpdateSchema(jwks);
export type TJwks = z.infer<typeof jwks>;
export type TJwksSelect = typeof jwks.$inferSelect & TJwks;

export const usersRelations = relations(users, (helpers) => ({
  sessions: helpers.many(authSessions, { relationName: 'SessionToUser' }),
  userRoles: helpers.many(usersRoles),
  accounts: helpers.many(accounts, { relationName: 'AccountToUser' }),
}));

export const rolesRelations = relations(roles, (helpers) => ({
  usersRoles: helpers.many(usersRoles),
}));

export const sessionsRelations = relations(authSessions, (helpers) => ({
  user: helpers.one(users, {
    relationName: 'SessionToUser',
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, (helpers) => ({
  user: helpers.one(users, {
    relationName: 'AccountToUser',
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const OpenAPIUserSchema = z.object({
  // status: StatusSchema,
  id: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  passwordHash: z.string().nullable(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  accessTokenExpiresAt: z.string().nullable(),
  refreshTokenExpiresAt: z.string().nullable(),
  currentGameSessionDataId: z.string().nullable(),
  currentAuthSessionDataId: z.string().nullable(),
  avatarUrl: z.string(),
  role: z.string(),
  phpId: z.number().int(),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
  totalXpGained: z.number().int(),
  vipInfoId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  lastSeen: z.string().nullable(),
  rtgBlockTime: z.number().int(),
  phone: z.string().nullable(),
  path: z.array(z.string()),
  invitorId: z.string().nullable(),
  avatar: z.string(),
  count_balance: z.number().int(),
  count_tournaments: z.number().int(),
  count_happyhours: z.number().int(),
  count_refunds: z.number().int(),
  count_progress: z.number().int(),
  count_daily_entries: z.number().int(),
  count_invite: z.number().int(),
  count_welcomebonus: z.number().int(),
  count_smsbonus: z.number().int(),
  count_wheelfortune: z.number().int(),
  address: z.number().int(),
  activeOperatorId: z.string().nullable(),
  activeWalletId: z.string().nullable(),
  inviteCode: z.string().nullable(),
});

export const OpenAPIVipInfoSchema = z.object({
  id: z.string(),
  level: z.number().int(),
  xp: z.number().int(),
  totalXp: z.number().int(),
  userId: z.string(),
  currentRankid: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OpenAPIVipRankSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  minXp: z.number().int(),
  icon: z.string(),
  dailyCashbackMax: z.number().int(),
  monthlyCashbackMax: z.number().int(),
  wagerBonusCoinPct: z.number().int(),
  purchaseBonusCoinPct: z.number().int(),
  levelUpBonusCoinPct: z.number().int(),
  vipSpinMaxAmount: z.number().int(),
  hasConcierge: z.boolean(),
  hasVipLoungeAccess: z.boolean(),
  isInvitationOnly: z.boolean(),
});

export const OpenAPIWalletsSchema = z.object({
  id: z.string(),
  balance: z.number().int(),
  paymentMethod: z.string(),
  currency: z.string(),
  address: z.string().nullable(),
  cashtag: z.string().nullable(),
  operatorId: z.string(),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
  isActive: z.boolean(),
});

export const OpenAPIGamesSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  category: z.string(),
  tags: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  developer: z.string(),
  providerId: z.string().nullable(),
  totalWagered: z.number().int().nullable(),
  totalWon: z.number().int().nullable(),
  targetRtp: z.number().int().nullable(),
  isFeatured: z.boolean().nullable(),
  statIn: z.number().int(),
  statOut: z.number().int(),
  isActive: z.boolean(),
  operatorId: z.string().nullable(),
  version: z.string().nullable(),
  jpgIds: z.array(z.string()),
  isHorizontal: z.boolean(),
  jpgId: z.string().nullable(),
  label: z.string().nullable(),
  device: z.number().int().nullable(),
  gamebank: z.string().nullable(),
  linesPercentConfigSpin: z.string().nullable(),
  linesPercentConfigSpinBonus: z.string().nullable(),
  linesPercentConfigBonus: z.string().nullable(),
  linesPercentConfigBonusBonus: z.string().nullable(),
  rezerv: z.string().nullable(),
  cask: z.string().nullable(),
  advanced: z.string().nullable(),
  bet: z.string().nullable(),
  scaleMode: z.string().nullable(),
  slotViewState: z.string().nullable(),
  view: z.string().nullable(),
  denomination: z.string().nullable(),
  categoryTemp: z.string().nullable(),
  originalId: z.string().nullable(),
  bids: z.array(z.string()),
  rtpStatIn: z.number().int().nullable(),
  rtpStatOut: z.number().int().nullable(),
  currentRtp: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.number().int(),
});

export const OpenAPIOperatorsSchema = z.object({
  id: z.string(),
  name: z.string(),
  operatorSecret: z.string(),
  operatorAccess: z.string(),
  callbackUrl: z.string(),
  isActive: z.boolean(),
  allowedIps: z.string(),
  description: z.string().nullable(),
  productIds: z.string().nullable(),
  balance: z.number().int(),
  netRevenue: z.number().int(),
  acceptedPayments: z.array(z.string()),
  ownerId: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  upfrontBankCredits: z.number().int(),
  platformFeeRate: z.string(),
  loyaltyContributionRate: z.string(),
});

export const OpenAPIUserSchemaWithoutPassword = OpenAPIUserSchema.omit({
  passwordHash: true,
});
