import { eq } from 'drizzle-orm';
import db from '../database/index';
import * as schema from '../database/_schema';

// This is the single, hardcoded operator for the entire system.
// Using a deterministic ID makes it easy to reference in other seeds.
const defaultOperator = {
  id: 'clxjv0w2z0000356s1szacrqs',
  name: 'Default Operator',
  balance: 100000,
  netRevenue: 0,
  operatorSecret: crypto.randomUUID(),
  operatorAccess: crypto.randomUUID(),
  callbackUrl: 'https://example.com/callback',
  allowedIps: '0.0.0.0/0', // Allows all IPs for dev purposes
  acceptedPayments: ['INSTORE_CASH', 'CREDIT_CARD'],
  goldsvetData: [],
};

export async function seedOperator()
{
  console.log('🏢 Seeding default operator...');
console.log(schema.operators);
  // onConflictDoNothing prevconsoents errors if the operator already exists.
  await db
    .insert(schema.operators)
    .values(defaultOperator)
    .onConflictDoNothing();

  await db
    .update(schema.operators)
    .set({ balance: 100000 })
    .where(eq(schema.operators.id, defaultOperator.id));

  console.log('✅ Default operator seeded.');
  // Return the operator object so its ID can be used in other seeds.
  return defaultOperator;
}
