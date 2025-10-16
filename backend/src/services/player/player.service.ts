
import db, { type Player } from '@backend/database'
import { eq, ilike, or } from "drizzle-orm";
import { players, users } from '@backend/types'

export function findManyUser(
    limit?: number,
    offset?: number,
    filter?: { username?: string; email?: string }
)
{
    const query = db.select().from(players);

    if (filter) {
        const { username, email } = filter;
        if (username || email) {
            query.where(
                or(
                    username ? ilike(players.playername, `%${username}%`) : undefined,
                    email ? ilike(players.email, `%${email}%`) : undefined
                )
            );
        }
    }

    if (limit) {
        query.limit(limit);
    }

    if (offset) {
        query.offset(offset);
    }

    return query;
}


export function findUserById(id: string)
{
    return db.select().from(players).where(eq(players.id, id));
}

export function updateUser(id: string, data: Partial<Player>)
{
    console.log('updateUser called with id:', id);
    console.log('updateUser data before filtering:', JSON.stringify(data, null, 2));

    // Filter out null values to match Drizzle's expectations for non-nullable columns
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== null)
    );

    console.log('updateUser data after filtering nulls:', JSON.stringify(filteredData, null, 2));

    return db.update(players).set(filteredData).where(eq(players.id, id)).returning();
}

export function deleteUser(id: string)
{
    return db.delete(players).where(eq(players.id, id)).returning();
}

// From Pinia Store & HAR files

export function checkUser(userId: string)
{
    // Assuming a simple check that returns the user if they exist
    return findUserById(userId);
}

export function sendEmailVerification(userId: string)
{
    // Placeholder for sending a verification email
    console.log(`Sending verification email to user`, userId);
    return { status: "ok", time: Date.now() };
}

export function getUserInfo(userId: string)
{
    return findUserById(userId);
}

export function getVipInfo(userId: string)
{
    // Assuming vip info is part of the users table for now
    return db
        .select({ vipInfo: players.vipInfoId })
        .from(players)
        .where(eq(players.id, userId));
}

// New Routes
export function getUserAmount()
{
    // Placeholder, you will need to implement the actual logic
    return {
        amount: 1000,
        currency: { fiat: true, name: "USD", symbol: "$", type: "fiat" },
        withdraw: 500,
        rate: 1,
    };
}
export function setUserRTGSettings(time: number, userId: string)
{
    console.log(time);
    console.log(userId);
    return db
        .update(players)
        .set({ rtgBlockTime: time })
        .where(eq(players.id, userId))
        .returning();
}