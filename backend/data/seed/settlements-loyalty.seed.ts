/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import db from '../database/index';
import * as schema from '../database/schema';
import { rand, randNumber, randRecentDate } from '@ngneat/falso';
import { sql } from 'drizzle-orm';
import { endOfWeek, startOfWeek, subWeeks } from 'date-fns';
import { nanoid } from 'nanoid';

const tableNames = [ 'affiliate_logs'];

const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;`;

  
export async function seed()
{
  console.log('Seeding operator settlements and loyalty fund transactions...');
  await db.execute(sql.raw(truncateQuery));

  const allOperators = await db.select().from(schema.operators);
  const allUsers = await db.select().from(schema.users);

  if (allOperators.length === 0 || allUsers.length === 0) {
    console.log('Cannot seed settlements without operators and users.');
    return;
  }

  const settlementsToCreate: any[] = [];
  const loyaltyTxsToCreate: any[] = [];

  for (const operator of allOperators) {
    for (let i = 0; i < 52; i++) {
      // Seed for the last 52 weeks
      const weekEndDate = endOfWeek(subWeeks(new Date(), i));
      const weekStartDate = startOfWeek(subWeeks(new Date(), i));

      const totalTurnover = randNumber({ min: 5000000, max: 20000000 });
      const totalPayouts = totalTurnover * randNumber({ min: 0.85, max: 0.95 });
      const grossGamingRevenue = totalTurnover - totalPayouts;
      const platformFee =
        grossGamingRevenue * parseFloat(operator.platformFeeRate);
      const loyaltyFundContribution =
        grossGamingRevenue * parseFloat(operator.loyaltyContributionRate);
      const netToOperator =
        grossGamingRevenue - platformFee - loyaltyFundContribution;

      settlementsToCreate.push({
        id: nanoid(),
        operatorId: operator.id,
        weekStartDate,
        weekEndDate,
        totalTurnover: totalTurnover.toFixed(2),
        totalPayouts: totalPayouts.toFixed(2),
        grossGamingRevenue: grossGamingRevenue.toFixed(2),
        platformFee: platformFee.toFixed(2),
        loyaltyFundContribution: loyaltyFundContribution.toFixed(2),
        netToOperator: netToOperator.toFixed(2),
      });

      loyaltyTxsToCreate.push({
        id: nanoid(),
        type: 'CONTRIBUTION',
        amount: loyaltyFundContribution.toFixed(2),
        description: `Weekly settlement for ${operator.name}`,
        operatorId: operator.id,
        createdAt: weekEndDate,
      });
    }
  }

  for (let i = 0; i < 50; i++) {
    // Seed 50 random loyalty payouts
    const user = rand(allUsers);
    loyaltyTxsToCreate.push({
      id: nanoid(),
      type: 'PAYOUT',
      amount: randNumber({ min: 500, max: 10000 }).toFixed(2),
      description: rand([
        'Daily Cashback',
        'Level Up Bonus',
        'Special Promotion',
      ]),
      userId: user.id,
      createdAt: randRecentDate({ days: 7 }),
    });
  }
  for (let i = 0; i < 200; i++) {
    // Seed 50 random loyalty payouts
    const user = rand(allUsers);
    loyaltyTxsToCreate.push({
      id: nanoid(),
      type: 'PAYOUT',
      amount: randNumber({ min: 500, max: 10000 }).toFixed(2),
      description: rand([
        'Daily Cashback',
        'Level Up Bonus',
        'Special Promotion',
      ]),
      userId: user.id,
      createdAt: randRecentDate({ days: 30 }),
    });
  }
  await db.insert(schema.operatorSettlements).values(settlementsToCreate);
  await db.insert(schema.loyaltyFundTransactions).values(loyaltyTxsToCreate);

  console.log(
    'Operator settlements and loyalty fund transactions seeded successfully.'
  );
}
