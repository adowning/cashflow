
import * as schema from '../database/schema';
import db from '@backend/database';
import
{
  randFirstName,
  randLastName
} from '@ngneat/falso';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';




const tableNames = ['affiliate_logs'];

const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;`;


export const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password);
};

export const isPasswordMatch = async (password: string, hash: string): Promise<boolean> => {
  return await Bun.password.verify(password, hash);
};



export const generateReferral = (length: number, numericOnly: boolean = false): string => {
  const chars = numericOnly ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function seedAffiliatesAndReferrals() {
  console.log('Seeding multi-level affiliates and referral codes...');
  await db.execute(sql.raw(truncateQuery));
    
  // ... (keep truncateQuery and hashPassword)

  const allUsers = await db.select().from(schema.users);
  if (allUsers.length < 10) {
    console.log('Not enough users to create a deep affiliate structure. Skipping.');
    return;
  }
  const newAffiliate = allUsers[Math.random() * allUsers.length + 1]
      await db.insert(schema.usersRoles).values({
      id: crypto.randomUUID(),
      userId: newAffiliate?.id,
      roleId: 'affiliate',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
      //.where(eq(schema.usersRoles.roleId,'affiliate'));
  const passwordHash = await hashPassword('affiliatepass');

  // Assign remaining users as players under the deepest affiliate
  for (let i = 3; i < allUsers.length; i++) {
    const user = allUsers[i];
    if (user) {
      await db.update(schema.players).set({
        invitorId: subAffiliate1.id,
      }).where(eq(schema.players.id, user.id));
    }
  }

  console.log('Multi-level affiliates and referrals seeded successfully.');
}

// export const createAffiliateLog = async (
//     log: z.infer<typeof CreateAffiliateLogSchema>
// ) =>
// {
//     return await db.insert(schema.affiliateLogs).values(log).returning();
// };

// seedAffiliatesAndReferrals()