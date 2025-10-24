import
{
  randNumber,
  randPassword,
  randPastDate,
  randUserName,
} from '@ngneat/falso';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import db from '../database/index';
import * as schema from '../database/_schema';
import { generateRandomVipInfo } from './vip';

export async function seedUsers(count: number, operatorId: string)
{
  const allAuthUsers = await db.select().from(schema.users);
  console.log(`🌱 Seeding ${allAuthUsers.length} random users, each with a wallet...`);

  const allAuthSessions = await db.select().from(schema.sessions);
  const allVipLevels = await db.select().from(schema.vipRanks);
  const allAffiliates = await db.select().from(schema.affiliates);

  if (allVipLevels.length === 0) {
    throw new Error('VIP levels must be seeded before users.');
  }
  console.log(allAuthSessions);

  for (let i = 0; i < allAuthUsers.length; i++) {
    
    const affiliateN = randNumber({ min: 0, max: allAffiliates.length });
    const affiliate = allAffiliates[affiliateN];
    // const refCode = affiliate?.referralCode;
    const username = randUserName();
    const password = randPassword();
    const hashedPassword = await Bun.password.hash(password);
    const createdAt = randPastDate({ years: 1 });
    const avatarN = randNumber({ min: 1, max: 9 });
    const playerAvatar = `avatar-0${avatarN}.webp`;

    // const userId = nanoid();
    const authUser = allAuthUsers[i];
    console.log(authUser);
    await db.transaction(async (tx) =>
    {
      const [newUser] = await tx
        .update(schema.players)
        .set({
          invitorId: affiliate?.id,
        })
        .where(eq(schema.players.id, authUser.playerId))
        .returning();

      if (!newUser) throw new Error('no new user');

      //  const [refInfo] = await tx
      //   .insert(schema.referralCodes)
      //   .values({
      //     id: nanoid(),
      //     code: generateReferral(8),
      //     name: affiliate?.username || `${username}'s Referral Code`,
      //     commissionRate: 0.1,
      //     updatedAt: new Date(),
      //     userId: newUser.id
      //   })
      //   .returning();

      const rawVipInfo = generateRandomVipInfo(newUser.id);

      const [vipInfo] = await tx
        .insert(schema.vipInfos)
        .values(rawVipInfo)
        .returning();

      if (!vipInfo) throw new Error('no new vipinfo');

      await tx
        .update(schema.players)
        .set({ vipInfoId: vipInfo.id })
        .where(sql`${schema.players.id} = ${newUser.id}`);

      const initialBalance = randNumber({ min: 1000, max: 20000 });

      const walletId = crypto.randomUUID();
      if(newUser.id === 'system')return;
      if(!newUser.id)return;
      const [newWallet] = await tx
        .insert(schema.wallets)
        .values({
          id: walletId,
          userId: authUser.id,
          balance: initialBalance,
          operatorId: operatorId,
          isActive: true,
        })
        .returning();

      if (!newWallet) {
        throw new Error(`Wallet not found for user ${newUser.id}`);
      }

      await tx
        .update(schema.players)
        .set({ activeWalletId: newWallet.id })
        .where(eq(schema.players.id, newUser.id));

      // Insert balance record for the wallet
      const balanceRecord = {
        id: nanoid(),
        playerId: newUser.id,
        currencyId: 'USD',
        walletId: newWallet.id,
        amount: initialBalance,
        bonus: 0,
        turnover: 0,
        withdrawable: initialBalance,
        pending: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await tx.insert(schema.balances).values(balanceRecord);
      // await tx.insert(schema.balances).values({
      //   userId: newUser.id,
      //   amount: initialBalance,
      //   availableBalance: initialBalance,
      // })
      // if(i < 4)
      const asess =  allAuthSessions[i];
      if(!asess)return;
      await tx.insert(schema.gameSessions).values({
        id: nanoid(),
        authSessionId: asess.id,
        playerId: newUser.id,
        status: 'ACTIVE',
      });

      console.log(
        `👤 Created user '${username}' (Password: ${password}) with an associated wallet and auth session.`
      );
    });
  }
}
export async function seedSystem(operatorId: string)
{
  console.log('🔒 Seeding hardcoded user \'asdf\' with a wallet...');
  const username = 'system';
  const password = 'systemasdfasdf';

  const [existingUser] = await db
    .select()
    .from(schema.players)
    .where(eq(schema.players.playername, username));

  if (existingUser) {
    console.log('✅ Hardcoded user \'asdf\' already exists.');
    return;
  }

  const hashedPassword = await Bun.password.hash(password);
  await db.transaction(async (tx) =>
  {
    const [newUser] = await tx
      .insert(schema.players)
      .values({
        id: 'system',
        playername: username,
        totalXpGained: 0,
        avatarUrl: 'avatar-01.webp',
        passwordHash: hashedPassword,
        // vipLevel: 1,
      })
      .returning();
    const walletId = crypto.randomUUID();
    if (!newUser.id) return;//throw new Error("no new user");
    const [newWallet] = await tx
      .insert(schema.wallets)
      .values({
        id: `wallet_${walletId}`,
        userId: newUser.id,
        operatorId: operatorId,
        playerId: newUser.id,
        balance: 50000,
        isActive: true,
      })
      .returning();

    if (!newWallet) throw new Error('no new user');

    console.log(newWallet);
    await tx
      .update(schema.players)
      .set({ activeWalletId: newWallet.id })
      .where(eq(schema.players.id, newUser.id));
    // await tx.insert(schema.balances).values({
    //   userId: newUser.id,
    //   amount: 50000,
    //   availableBalance: 50000,
    // })
    // Session creation is handled by better-auth.ts
  });

  console.log(`✅ Hardcoded user 'asdf' created. Password is '${password}'`);
}
export async function seedHardcodedUser(operatorId: string)
{
  console.log('🔒 Seeding hardcoded user \'asdf\' with a wallet...');
  const username = 'asdf';
  const password = 'asdfasdf';

  const [existingUser] = await db
    .select()
    .from(schema.players)
    .where(eq(schema.players.playername, username));

  if (existingUser) {
    console.log('✅ Hardcoded user \'asdf\' already exists.');
    return;
  }

  const hashedPassword = await Bun.password.hash(password);
  await db.transaction(async (tx) =>
  {
    const [newUser] = await tx
      .insert(schema.players)
      .values({
        playername: username,
        totalXpGained: 0,
        avatarUrl: 'avatar-01.webp',
        passwordHash: hashedPassword,
        // vipLevel: 1,
      })
      .returning();
    const walletId = crypto.randomUUID();

    if (!newUser.id) return;

    const [newWallet] = await tx
      .insert(schema.wallets)
      .values({
        id: `wallet_${walletId}`,
        userId: newUser.id,
        playerId: newUser.id,
        operatorId: operatorId,
        balance: 50000,
        isActive: true,
      })
      .returning();

    if (!newWallet) throw new Error('no new user');

    console.log(newWallet);
    await tx
      .update(schema.players)
      .set({ activeWalletId: newWallet.id })
      .where(eq(schema.players.id, newUser.id));
    // await tx.insert(schema.balances).values({
    //   userId: newUser.id,
    //   amount: 50000,
    //   availableBalance: 50000,
    // })
    const rawVipInfo = generateRandomVipInfo(newUser.id);
    rawVipInfo.level = 0;
    rawVipInfo.betExp = 0;
    rawVipInfo.depositExp = 0;

    const [vipInfo] = await tx
      .insert(schema.vipInfos)
      .values(rawVipInfo)
      .returning();

    if (!vipInfo) throw new Error('no new vipinfo');

    await tx
      .update(schema.players)
      .set({ vipInfoId: vipInfo.id })
      .where(sql`${schema.players.id} = ${newUser.id}`);
  });

  console.log(`✅ Hardcoded user 'asdf' created. Password is '${password}'`);
}
export async function seedWallets(operatorId: string)
{
  const users = await db.select().from(schema.users);
  for (const user of users) {

    const existingWallet = await db
      .select()
      .from(schema.wallets)
      .where(eq(schema.wallets.userId, user.id));

    if (!existingWallet.length) throw new Error('no existingWallet');
    const balances: (typeof schema.balances.$inferInsert)[] = [
      {
        playerId: user.playerId,
        walletId: existingWallet[0].id,
        id: nanoid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        pending: 0,
        amount: 2000,
        currencyId: 'USD',
        bonus: 500,
        turnover: 0,
        withdrawable: 0
      }
    ];

    await db
      .update(schema.players)
      .set({ activeWalletId: existingWallet[0].id })
      .where(eq(schema.players.id, user.playerId));
    console.log('✅ added activeWalletId to user ');

    // Insert balance record for the wallet
    const balanceRecord = {
      id: nanoid(),
      playerId: user.playerId,
      currencyId: 'USD',
      walletId: existingWallet[0].id,
      amount: existingWallet[0].balance,
      bonus: 0,
      turnover: 0,
      withdrawable: existingWallet[0].balance,
      pending: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(schema.balances).values(balanceRecord);
    console.log(`✅ added balance record for user ${user.id}`);

    const exisitngOperator = await db.select().from(schema.operators);

    if (!exisitngOperator.length) throw new Error('no existingOperator');


    // if (exisitngOperator.length > 0) {
    await db
      .update(schema.players)
      .set({ activeOperatorId: exisitngOperator[0].id })
      .where(eq(schema.players.id, user.playerId));
    console.log('✅ added operatorId to user ');
    // }
  }
}

// import
// {
//   randNumber,
//   randPassword,
//   randPastDate,
//   randUserName,
// } from '@ngneat/falso';
// import { eq, sql } from 'drizzle-orm';
// import { nanoid } from 'nanoid';
// import db from '../database/index';
// import * as schema from '../database/_schema';
// import { generateRandomVipInfo } from './vip';

// export async function seedUsers(count: number, operatorId: string)
// {
//   const allAuthUsers = await db.select().from(schema.users);
//   console.log(`🌱 Seeding ${allAuthUsers.length} random users, each with a wallet...`);

//   const allAuthSessions = await db.select().from(schema.sessions);
//   const allVipLevels = await db.select().from(schema.vipRanks);
//   const allAffiliates = await db.select().from(schema.affiliates);

//   if (allVipLevels.length === 0) {
//     throw new Error('VIP levels must be seeded before users.');
//   }
//   console.log(allAuthSessions);

//   for (let i = 0; i < allAuthUsers.length; i++) {
    
//     const affiliateN = randNumber({ min: 0, max: allAffiliates.length });
//     const affiliate = allAffiliates[affiliateN];
//     // const refCode = affiliate?.referralCode;
//     const username = randUserName();
//     const password = randPassword();
//     const hashedPassword = await Bun.password.hash(password);
//     const createdAt = randPastDate({ years: 1 });
//     const avatarN = randNumber({ min: 1, max: 9 });
//     const playerAvatar = `avatar-0${avatarN}.webp`;

//     // const userId = nanoid();
//     const authUser = allAuthUsers[i];
//     await db.transaction(async (tx) =>
//     {
//       const [newUser] = await tx
//         .update(schema.users)
//         .set({
//         //   id: authUser.id,
//         // name: username,
//         //    username,
//         //    name: username,
//         //   totalXpGained: 0,
//           invitorId: affiliate?.id,
//           updatedAt: sql`NOW()`
//           // passwordHash: hashedPassword,
//           // createdAt,
//           // avatarUrl: playerAvatar,

//           // vipInfoId: vipid
//           // vipLevel: rand(allVipLevels).level,
//         })
//         .returning();

//       if (!newUser) throw new Error('no new user');

//       //  const [refInfo] = await tx
//       //   .insert(schema.referralCodes)
//       //   .values({
//       //     id: nanoid(),
//       //     code: generateReferral(8),
//       //     name: affiliate?.username || `${username}'s Referral Code`,
//       //     commissionRate: 0.1,
//       //     updatedAt: new Date(),
//       //     userId: newUser.id
//       //   })
//       //   .returning();

//       const rawVipInfo = generateRandomVipInfo(newUser.id);

//       const [vipInfo] = await tx
//         .insert(schema.vipInfos)
//         .values(rawVipInfo)
//         .returning();

//       if (!vipInfo) throw new Error('no new vipinfo');

//       await tx
//         .update(schema.players)
//         .set({ vipInfoId: vipInfo.id })
//         .where(sql`${schema.players.id} = ${newUser.id}`);

//       const initialBalance = randNumber({ min: 1000, max: 20000 });

//       const walletId = crypto.randomUUID();
//       if(newUser.id === 'system')return;
//       if(!newUser.id)return;
//       const [newWallet] = await tx
//         .insert(schema.wallets)
//         .values({
//           id: walletId,
//           playerId: newUser.id,
//           balance: initialBalance,
//           operatorId: operatorId,
//           isActive: true,
//         })
//         .returning();

//       if (!newWallet) {
//         throw new Error(`Wallet not found for user ${newUser.id}`);
//       }

//       await tx
//         .update(schema.players)
//         .set({ activeWalletId: newWallet.id })
//         .where(eq(schema.players.id, newUser.id));

//       // Insert balance record for the wallet
//       const balanceRecord = {
//         id: nanoid(),
//         playerId: newUser.id,
//         currencyId: 'USD',
//         walletId: newWallet.id,
//         amount: initialBalance,
//         bonus: 0,
//         turnover: 0,
//         withdrawable: initialBalance,
//         pending: 0,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       await tx.insert(schema.balances).values(balanceRecord);
//       // await tx.insert(schema.balances).values({
//       //   userId: newUser.id,
//       //   amount: initialBalance,
//       //   availableBalance: initialBalance,
//       // })
//       // if(i < 4)
//       const asess =  allAuthSessions[i];
//       if(!asess)return;
//       await tx.insert(schema.gameSessions).values({
//         id: nanoid(),
//         authSessionId: asess.id,
//         playerId: newUser.id,
//         status: 'ACTIVE',
//       });

//       console.log(
//         `👤 Created user '${username}' (Password: ${password}) with an associated wallet and auth session.`
//       );
//     });
//   }
// }
// export async function seedSystem(operatorId: string)
// {
//   console.log('🔒 Seeding hardcoded user \'asdf\' with a wallet...');
//   const username = 'system';
//   const password = 'systemasdfasdf';

//   const [existingUser] = await db
//     .select()
//     .from(schema.players)
//     .where(eq(schema.players.playername, username));

//   if (existingUser) {
//     console.log('✅ Hardcoded user \'asdf\' already exists.');
//     return;
//   }

//   const hashedPassword = await Bun.password.hash(password);
//   await db.transaction(async (tx) =>
//   {
//     const [newUser] = await tx
//       .insert(schema.players)
//       .values({
//         id: 'system',
//         playername: username,
//         totalXpGained: 0,
//         avatarUrl: 'avatar-01.webp',
//         passwordHash: hashedPassword,
//         // vipLevel: 1,
//       })
//       .returning();
//     const walletId = crypto.randomUUID();
//     if (!newUser.id) return;//throw new Error("no new user");
//     const [newWallet] = await tx
//       .insert(schema.wallets)
//       .values({
//         id: `wallet_${walletId}`,
//         userId: newUser.id,
//         operatorId: operatorId,
//         playerId: newUser.id,
//         balance: 50000,
//         isActive: true,
//       })
//       .returning();

//     if (!newWallet) throw new Error('no new user');

//     console.log(newWallet);
//     await tx
//       .update(schema.players)
//       .set({ activeWalletId: newWallet.id })
//       .where(eq(schema.players.id, newUser.id));
//     // await tx.insert(schema.balances).values({
//     //   userId: newUser.id,
//     //   amount: 50000,
//     //   availableBalance: 50000,
//     // })
//     // Session creation is handled by better-auth.ts
//   });

//   console.log(`✅ Hardcoded user 'asdf' created. Password is '${password}'`);
// }
// export async function seedHardcodedUser(operatorId: string)
// {
//   console.log('🔒 Seeding hardcoded user \'asdf\' with a wallet...');
//   const username = 'asdf';
//   const password = 'asdfasdf';

//   const [existingUser] = await db
//     .select()
//     .from(schema.players)
//     .where(eq(schema.players.playername, username));

//   if (existingUser) {
//     console.log('✅ Hardcoded user \'asdf\' already exists.');
//     return;
//   }

//   const hashedPassword = await Bun.password.hash(password);
//   await db.transaction(async (tx) =>
//   {
//     const [newUser] = await tx
//       .insert(schema.players)
//       .values({
//         playername: username,
//         totalXpGained: 0,
//         avatarUrl: 'avatar-01.webp',
//         passwordHash: hashedPassword,
//         // vipLevel: 1,
//       })
//       .returning();
//     const walletId = crypto.randomUUID();

//     if (!newUser.id) return;

//     const [newWallet] = await tx
//       .insert(schema.wallets)
//       .values({
//         id: `wallet_${walletId}`,
//         userId: newUser.id,
//         playerId: newUser.id,
//         operatorId: operatorId,
//         balance: 50000,
//         isActive: true,
//       })
//       .returning();

//     if (!newWallet) throw new Error('no new user');

//     console.log(newWallet);
//     await tx
//       .update(schema.players)
//       .set({ activeWalletId: newWallet.id })
//       .where(eq(schema.players.id, newUser.id));
//     // await tx.insert(schema.balances).values({
//     //   userId: newUser.id,
//     //   amount: 50000,
//     //   availableBalance: 50000,
//     // })
//     const rawVipInfo = generateRandomVipInfo(newUser.id);
//     rawVipInfo.level = 0;
//     rawVipInfo.betExp = 0;
//     rawVipInfo.depositExp = 0;

//     const [vipInfo] = await tx
//       .insert(schema.vipInfos)
//       .values(rawVipInfo)
//       .returning();

//     if (!vipInfo) throw new Error('no new vipinfo');

//     await tx
//       .update(schema.players)
//       .set({ vipInfoId: vipInfo.id })
//       .where(sql`${schema.players.id} = ${newUser.id}`);
//   });

//   console.log(`✅ Hardcoded user 'asdf' created. Password is '${password}'`);
// }
// export async function seedWallets(operatorId: string)
// {
//   const users = await db.select().from(schema.users);
//   for (const user of users) {

//     const existingWallet = await db
//       .select()
//       .from(schema.wallets)
//       .where(eq(schema.wallets.playerId, user.id));

//     if (!existingWallet.length) throw new Error('no existingWallet');
//     const balances: (typeof schema.balances.$inferInsert)[] = [
//       {
//         playerId: user.id,
//         walletId: existingWallet[0].id,
//         id: nanoid(),
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         pending: 0,
//         amount: 2000,
//         currencyId: 'USD',
//         bonus: 500,
//         turnover: 0,
//         withdrawable: 0
//       }
//     ];

//     await db
//       .update(schema.players)
//       .set({ activeWalletId: existingWallet[0].id })
//       .where(eq(schema.players.id, user.id));
//     console.log('✅ added activeWalletId to user ');

//     // Insert balance record for the wallet
//     const balanceRecord = {
//       id: nanoid(),
//       playerId: user.id,
//       currencyId: 'USD',
//       walletId: existingWallet[0].id,
//       amount: existingWallet[0].balance,
//       bonus: 0,
//       turnover: 0,
//       withdrawable: existingWallet[0].balance,
//       pending: 0,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
//     await db.insert(schema.balances).values(balanceRecord);
//     console.log(`✅ added balance record for user ${user.id}`);

//     const exisitngOperator = await db.select().from(schema.operators);

//     if (!exisitngOperator.length) throw new Error('no existingOperator');


//     // if (exisitngOperator.length > 0) {
//     await db
//       .update(schema.players)
//       .set({ activeOperatorId: exisitngOperator[0].id })
//       .where(eq(schema.players.id, user.id));
//     console.log('✅ added operatorId to user ');
//     // }
//   }
// }
