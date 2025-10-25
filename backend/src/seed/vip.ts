/** biome-ignore-all lint/correctness/noInnerDeclarations: <explanation> */

import { randNumber } from '@ngneat/falso';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as schema from '../database/schema';
import { players, vipInfos } from '../database/schema';
import db from '../database/index';

const constRanks = [
  {
    id: 1,
    level: 1,
    name: 'Bronze',
    icon: '/images/vip/bronze_rank.avif',
    depositExp: 1000,
    minXp: 5000,
    uprankAward: 100,
    weekAward: 10,
    hasConcierge: false,
    hasVipLoungeAccess: false,
    isInvitationOnly: false,
    xpForNext: 20000,
    dailyBonusCoinPct: 1,
    hourlyBonusCoinPct: 1,
    levelUpBonusCoinPct: 1,
    purchaseBonusCoinPct: 1,
    wagerBonusCoinPct: 1,
    dailyCashbackMax: 5,
    monthlyCashbackMax: 7,
  },
  {
    id: 2,
    level: 2,
    name: 'Silver',
    icon: '/images/vip/silver_rank.avif',
    depositExp: 5000,
    hasVipLoungeAccess: false,
    isInvitationOnly: false,
    minXp: 25000,
    uprankAward: 500,
    purchaseBonusCoinPct: 1,
    dailyBonusCoinPct: 1,
    hasConcierge: false,
    hourlyBonusCoinPct: 1,
    wagerBonusCoinPct: 1,
    levelUpBonusCoinPct: 1,
    xpForNext: 80000,
    weekAward: 50,
    dailyCashbackMax: 5,
    monthlyCashbackMax: 7,
  },
  {
    level: 3,
    id: 3,
    name: 'Gold',
    depositExp: 20000,
    icon: '/images/vip/gold_rank.avif',
    purchaseBonusCoinPct: 1,
    hasVipLoungeAccess: false,
    isInvitationOnly: false,
    minXp: 100000,
    hasConcierge: false,
    dailyBonusCoinPct: 1,
    wagerBonusCoinPct: 1,
    hourlyBonusCoinPct: 1,
    levelUpBonusCoinPct: 1,
    uprankAward: 2000,
    xpForNext: 400000,

    dailyCashbackMax: 5,
    monthlyCashbackMax: 7,
  },
  {
    id: 4,
    level: 4,
    name: 'Platinum',
    purchaseBonusCoinPct: 1,
    hasVipLoungeAccess: false,
    isInvitationOnly: false,
    depositExp: 100000,
    hasConcierge: false,
    icon: '/images/vip/platinum_rank.avif',
    wagerBonusCoinPct: 1,
    dailyBonusCoinPct: 1,
    hourlyBonusCoinPct: 1,
    levelUpBonusCoinPct: 1,
    minXp: 500000,
    xpForNext: 2000000,

    uprankAward: 10000,
    weekAward: 1000,
    dailyCashbackMax: 5,
    monthlyCashbackMax: 7,
  },
  {
    level: 5,
    id: 5,
    name: 'Diamond',
    depositExp: 500000,
    hasVipLoungeAccess: false,
    wagerBonusCoinPct: 1,
    isInvitationOnly: false,
    dailyBonusCoinPct: 1,
    icon: '/images/vip/diamond_rank.avif',
    purchaseBonusCoinPct: 1,
    hasConcierge: false,
    hourlyBonusCoinPct: 1,
    levelUpBonusCoinPct: 1,
    minXp: 2500000,
    xpForNext: 9000000,
    uprankAward: 50000,
    weekAward: 5000,
    dailyCashbackMax: 5,
    monthlyCashbackMax: 7,
  },
];

// interface VipInfoSeed {
//   userId: string
//   level: number
//   depositExp: number
//   betExp: number
//   rankBetExp: number
//   rankDepositExp: number
//   freeSpinTimes: number
//   weekGift: number
//   monthGift: number
//   upgradeGift: number
//   nowCashBack: number
//   yesterdayCashBack: number
//   historyCashBack: number
// }

export function generateRandomVipInfo(userId: string)
{

  const level = randNumber({ min: 1, max: 5 });
  const baseExp = level * 1000;
  const depositExp = randNumber({ min: baseExp, max: baseExp * 10 });
  const betExp = randNumber({ min: baseExp * 5, max: baseExp * 50 });
  const id = nanoid();
  return {
    id,
    playerId: userId,
    level,
    depositExp,
    betExp,
    xp: 0,
    totalXp: 0,
    rankBetExp: randNumber({ min: 0, max: betExp }),
    rankDepositExp: randNumber({ min: 0, max: depositExp }),
    freeSpinTimes: randNumber({ min: 0, max: 20 }),
    weekGift: randNumber({ min: 0, max: 2 }),
    monthGift: randNumber({ min: 0, max: 1 }),
    upgradeGift: randNumber({ min: 0, max: 1 }),
    nowCashBack: randNumber({ min: 0, max: 1000 }),
    yesterdayCashBack: randNumber({ min: 0, max: 1000 }),
    historyCashBack: randNumber({ min: 0, max: 5000 }),
  };
}

export async function seedVipLevels()
{
  // const vipLevel = vipLevels
  const tableNames = ['vip_levels', 'vip_ranks'];
  console.log('💎 Seeding VIP levels...');
 const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;`;

  try {
    await db.execute(sql.raw(truncateQuery));
    console.log('✅ Database reset successfully.');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
  // const savedRanks = await db
  //   .insert(vipRanks)
  //   .values(ranks)
  //   .onConflictDoNothing()
  //   .returning();
  const levels: any[] = [];

  // console.log("savedRanks ", savedRanks);
  // await db.insert(schema.settings).values({ id: '1', updatedAt: new Date(), createdAt: new Date() })
  const setting = await db.query.settings.findMany({ limit: 1 });

  for (let n = 0; n <= 6; n++) {
    const cr = constRanks[n];
    // console.log(cr);
    var r: any;
    if (cr) r = await db.insert(schema.vipRanks).values(cr).returning();
    if (!r) throw new Error('Failed to insert VIP rank');
    if (!r[0]) throw new Error('Failed to get inserted VIP rank ID');
    // console.log(r);
    for (let i = 1; i <= 10; i++) {
      const level = {
        parentId: r[0].id,
        minXpNeeded: 0, //         Int?     @default(0) @map("min_xp_needed")
        levelNumber: i, //         Int?     @default(0) @map("level_number")
        levelName: `${r[0].name} ${i}`, //           String   @map("level_name")
        // parent              VipRank  @relation(fields: [parentId], references: [id])
        spinBonusMultiplier: 1, // Float?   @default(0.1) @map("spin_bonus_multiplier_id")
        settingId: setting.id,
        id: nanoid(),
        levelUpBonusAmount: 0,
      };
      levels.push(level);
      await db.insert(schema.vipLevels).values(level);
    }
    // await db.insert(vipLevels).values(levels);
  }

  console.log('✅ VIP levels seeded.');

  console.log('💎 Seeding VIP info for users...');
  // Get all users who don't have vipInfo yet
  const usersWithoutVipInfo = await db
    .select({ id: players.id })
    .from(players)
    .leftJoin(vipInfos, sql`${players.id} = ${vipInfos.playerId}`)
    .where(sql`${vipInfos.playerId} IS NULL`);

  console.log(`Found ${usersWithoutVipInfo.length} users without VIP info`);

  // Generate and insert vipInfo for each user
  const vipInfoRecords = usersWithoutVipInfo.map((user) =>
    generateRandomVipInfo(user.id)
  );

  if (vipInfoRecords.length > 0) {
    await db.insert(vipInfos).values(vipInfoRecords);
    console.log(`✅ VIP info created for ${vipInfoRecords.length} users`);
  } else {
    console.log('ℹ️  All users already have VIP info');
  }
  for (const record of vipInfoRecords) {
    // const [userVipInfo] = await db.select().from(schema.vipInfos).where(eq(schema.vipInfos.userId, newUser.id))
    await db
      .update(players)
      .set({ vipInfoId: record.id })
      .where(eq(players.id, record.playerId));
  }
  // Update existing users with random data (optional, uncomment if needed)
  // const allUsers = await db.select().from(users)
  // const updatePromises = allUsers.map((user) =>
  //   db.update(vipInfo)
  //     .set(generateRandomVipInfo(user.id))
  //     .where(sql`${vipInfo.userId} = ${user.id}`)
  // )
  // await Promise.all(updatePromises)
  // console.log(`✅ VIP info updated for ${allUsers.length} users`)

  return constRanks;
}
