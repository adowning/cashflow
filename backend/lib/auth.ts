import { betterAuth } from 'better-auth';
import { type DB, drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username, customSession } from 'better-auth/plugins';
import { logger } from '@/lib/utils/logger';
import { createInsertSchema } from 'drizzle-zod';
import { players, balances } from '../database/schema';
import db from '../database';
import { usersRoles, roles } from '../database/schema/auth.schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const playerInsertSchema = createInsertSchema(players);

const getUserRoles = async (userId: string) => {
  try {
    const rolesResult: any[] = await db.query.usersRoles.findMany({
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
  session: {
    modelName: 'authSession',
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const displayUsername = user.name;
          const id = nanoid(); // user.playerId as string || nanoid();
          console.log(user);
          return { data: { ...user, id, displayUsername } };
        },
        after: async (user, ctx) => {
          try {
            // Create player record for all users
            const playername = user.username || user.name; // Ensure uniqueness using username

            const player = {
              playername,
              id: user.id,
              userId: user.id,
              avatarUrl: 'https://gameui.cashflowcasino.com/public/avatars/avatar-01.webp',
            };

            const parsedPlayer = playerInsertSchema.parse(player);
            await db.insert(players).values(parsedPlayer);

            // Create balance record with zero defaults
            await db.insert(balances).values({
              playerId: user.id,
            });

            // Query roles table for 'user' role ID
            const userRole = await db.query.roles.findFirst({
              where: eq(roles.name, 'user'),
            });

            if (userRole) {
              // Create usersRoles entry
              await db.insert(usersRoles).values({
                userId: user.id,
                roleId: userRole.id,
              });
            } else {
              logger.error('User role not found in database');
            }
          } catch (error) {
            logger.error('Error creating player, balance, or role for user:', error.toString());
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
