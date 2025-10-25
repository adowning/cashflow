import { betterAuth } from 'better-auth';
import { type DB, drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username, customSession } from 'better-auth/plugins';
import { pino, type BaseLogger } from 'pino';
import { logger } from '@backend/utils/logger';
import { nanoid } from 'nanoid';
const getUserRoles = async (userId: string) => {
  try {
    const rolesResult = await db.query.usersRoles.findMany({
      where: eq(usersRoles.userId, userId),
      with: {
        role: {
          columns: { name: true },
        },
      },
    });
    return rolesResult.map((ur) => ur.role.name);
  } catch (error: unknown) {
    console.error('Error fetching user roles:', error);
    return [];
  }
};
import db from '../database';
import { randRecentDate } from '@ngneat/falso';
import { players, usersRoles } from '@/database/schema';
import { eq } from 'drizzle-orm';
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  logger: {
    log: (level, message) => {
      // if (level === 'error') return;
      logger[level](message);
    },
  },
  databaseHooks: {
    user: {
      create: {
        // before: async (user) =>
        // {
        //   const id = nanoid()
        //   // const id = user.playerId as string || nanoid();
        //   return { data: { ...user, id, } };
        // },
        after: async (user, ctx) => {
          if (user.isBot) {
            const createdAt = randRecentDate({ days: 60 });

            await db.insert(players).values({
              playername: user.name!,
              id: user.id,
              createdAt,
              // balance: {
              //   amount: 1000,
              //   bonus: 0,
              //   turnover: 0,
              //   withdrawable: 0,
              //   pending: 0,
              // },
              vipInfo: {
                id: nanoid(),
                level: 1,
                depositExp: 0,
                betExp: 0,
                xp: 0,
                totalXp: 0,
                rankBetExp: 0,
                rankDepositExp: 0,
                freeSpinTimes: 0,
                weekGift: 0,
                monthGift: 0,
                upgradeGift: 0,
                nowCashBack: 0,
                yesterdayCashBack: 0,
                historyCashBack: 0,
              },
            });
          } else {
            await db.insert(players).values({
              playername: user.name,
              id: user.id,
              userId: user.id,
              avatarUrl: 'https://gameui.cashflowcasino.com/public/avatars/avatar-06.webp',
              // balance: {
              //   amount: 0,
              //   bonus: 0,
              //   turnover: 0,
              //   withdrawable: 0,
              //   pending: 0,
              // },
              // vipInfo: {
              //   id: nanoid(),
              //   level: 1,
              //   depositExp: 0,
              //   betExp: 0,
              //   xp: 0,
              //   totalXp: 0,
              //   rankBetExp: 0,
              //   rankDepositExp: 0,
              //   freeSpinTimes: 0,
              //   weekGift: 0,
              //   monthGift: 0,
              //   upgradeGift: 0,
              //   nowCashBack: 0,
              //   yesterdayCashBack: 0,
              //   historyCashBack: 0,
              // }
            });
          }
        },
      },
    },

    session: {
      create: {
        before: async (session) => {
          const playerId = session.userId;
          return { data: { ...session, player_id: playerId } };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => {
        console.log(password);
        // Custom password hashing
        const passwordHash = await Bun.password.hash(password);
        return passwordHash;
      },
      verify: async ({ hash, password }) => {
        // Custom password verification
        const isValid = await Bun.password.verify(password, hash);
        return isValid;
      },
    },
  },
  plugins: [
    username(),
    customSession(async ({ user, session }) => {
      const roles = await getUserRoles(user.id);
      return {
        roles: roles && roles.length > 0 ? roles : ['user'],
        user,
        session,
      };
    }),
  ],
});

export type Auth = ReturnType<typeof auth>;

// export const auth = createBetterAuth({db, logger});
