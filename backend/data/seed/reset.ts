import { sql } from 'drizzle-orm';
import db from '../database/index';

const tableNames = [
  'vip_ranks',
  'vip_levels',
  'vip_info',
  'session',
  'deposit',
  'operators',
  'account',
  'user',
  'session',
  'game_sessions',
  'balances',
  'games',
  'jackpot_contributions',
  'jackpot_wins',
  'jackpots',
  'operators',
  'products',
  'transactions',
  'players',
  'vip_info',
  'wallets',
  'withdrawals',
  
];

export async function resetDatabase()
{
  console.log('🗑️  Resetting database...');

  const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;`;

  try {
    await db.execute(sql.raw(truncateQuery));
    console.log('✅ Database reset successfully.');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}
