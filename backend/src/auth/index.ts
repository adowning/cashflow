import { betterAuth } from 'better-auth';
import { type DB, drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { pino, type BaseLogger } from 'pino';
import { logger } from '@backend/utils/logger';

import db from '../database/';
export function createBetterAuth({ db, logger }: { db: DB, logger: BaseLogger }) {
  return betterAuth({
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
    emailAndPassword: {
      enabled: true,
    },
    plugins:[
      username()
    ]
  });
}

export type Auth = ReturnType<typeof createBetterAuth>;

export const auth = createBetterAuth({db, logger});