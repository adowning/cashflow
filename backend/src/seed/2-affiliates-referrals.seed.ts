//@ts-nocheck

import * as schema from "../types";
import db from "@backend/database";
import
{
    rand,
    randBoolean,
    randFirstName,
    randLastName
} from "@ngneat/falso";
import { nanoid } from "nanoid";
import type z from "zod";
import { sql } from 'drizzle-orm'
import { rand,  } from "@ngneat/falso";
import { referralCodes } from '../database/schema';




const tableNames = ['affiliates', 'affiliate_logs']

  const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(", ")} RESTART IDENTITY CASCADE;`;


export const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password)
}

export const isPasswordMatch = async (password: string, hash: string): Promise<boolean> => {
  return await Bun.password.verify(password, hash)
}



export const generateReferral = (length: number, numericOnly: boolean = false): string => {
    const chars = numericOnly ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
export async function seedAffiliatesAndReferrals()
{

    
    console.log("Seeding affiliates and referral codes...");
    await db.execute(sql.raw(truncateQuery));

    const allUsers = await db.select().from(schema.users);
    if (allUsers.length === 0) {
        console.log("No users found to create affiliates from.");
        return;
    }

    
    const passwordHash = await hashPassword("affiliatepass");
    
    var x =5
        console.log(allUsers.length)
    const master = allUsers[x]

    // Create a master affiliate
    const masterAffiliate = {
        id: master.id,
        username: master.name,
        playername: master.name,
        firstName: "Master",
        lastName: "Affiliate",
        status: "active",
        email: "master@affiliate.com",
        role: "OPERATOR",
        referralCode: "MASTERCODE",
        password: passwordHash,
            updatedAt: new Date()

    };
    await db.insert(schema.affiliates).values(masterAffiliate);

    // Create sub-affiliates
    for (let i = 0; i < 2; i++) {
        const user = allUsers[x + i + 1]
        console.log(user.name)
        const subAffiliate = {
            id: user.id,
            playername: user.name,
            firstName: randFirstName(),
            lastName: randLastName(),
            status: rand(["active", "inactive"]),
            email: `sub${i}@affiliate.com`,
            role: "USER",
            referralCode: generateReferral(8),
            parentId: masterAffiliate.id,
            path: [masterAffiliate.id],
            password: passwordHash,
            updatedAt: new Date()
        };
        await db.insert(schema.affiliates).values(subAffiliate);
    }
    console.log('finished with affialites')
    const allAffiliates = await db.select().from(schema.affiliates);
    // Assign referral codes to users
        const affIds = []
        allAffiliates.forEach(af => affIds.push(af.id))
  
    for (const user of allUsers) {
        console.log('starting player update')
        const affiliate = rand(allAffiliates)
        const code = affiliate.referralCode
        console.log('affiliate ', affiliate.playerName)
        console.log('code ', code)  
        console.log(affIds)
        console.log(user.id)
        if (randBoolean() && !affIds.includes(user.id)) {
            await db.insert(schema.referralCodes).values({
                id: nanoid(),
                code: affiliate.referralCode + '-'+ generateReferral(4),
                name: `${user.username}'s Code`,
                playerId: user.id,
                invitorId: affiliate.id,
                commissionRate: 0.1,
                userId: user.id,
            updatedAt: new Date()
            });
                 await db.update(schema.players).set({
                inviteCode: affiliate.referralCode ,
                invitorId: affiliate.id,
                updatedAt: new Date()
            }).where(sql`${schema.players.id} = ${user.id}`);
        }
    }

    console.log("Affiliates and referral codes seeded successfully.");
}


export const createAffiliateLog = async (
    log: z.infer<typeof CreateAffiliateLogSchema>
) =>
{
    return await db.insert(affiliateLogs).values(log).returning();
};

// seedAffiliatesAndReferrals()