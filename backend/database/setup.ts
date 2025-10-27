import { count, eq } from "drizzle-orm";
import db from ".";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { randEmail, randRecentDate, randUserName } from "@ngneat/falso";
import assert from "assert";
import { roles, operators, usersRoles, users, games } from "./schema";
import { seedGames } from "@/database/games";

import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://crqbazcsrncvbnapuxcp.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycWJhemNzcm5jdmJuYXB1eGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDk1MDYsImV4cCI6MjA3Njg4NTUwNn0.AQdRVvPqeK8l8NtTwhZhXKnjPIIcv_4dRU-bSZkVPs8";
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAuth() {
  try {
    // Create default roless if they don't exist
    const defaultroless = [
      { name: "admin", description: "Administrator with full access" },
      {
        name: "affiliate",
        description: "Affiliate with limited access, to certain users",
      },
      { name: "user", description: "Default user roles" },
    ];

    for (const rolesData of defaultroless) {
      const existingroles = await db.query.roles.findFirst({
        where: eq(roles.name, rolesData.name),
      });

      if (!existingroles) {
        await db.insert(roles).values({
          id: crypto.randomUUID(),
          name: rolesData.name,
          description: rolesData.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✓ Created roles: ${rolesData.name}`);
      } else {
        console.log(`✓ roles already exists: ${rolesData.name}`);
      }
    }

    // Ensure environment variables are set
    if (!process.env.BETTER_AUTH_SECRET) {
      console.warn(
        "⚠️  BETTER_AUTH_SECRET not set. Using default for development."
      );
    }

    if (!process.env.BETTER_AUTH_URL) {
      console.warn(
        "⚠️  BETTER_AUTH_URL not set. Using default for development."
      );
    }

    console.log("✓ Authentication setup complete");
    return true;
  } catch (error) {
    console.error("✗ Authentication setup failed:", error);
    return false;
  }
}

async function setupOperators() {
  try {
    const existingOperator = await db.query.operators.findFirst({
      where: eq(operators.id, "house"),
    });
    if (!existingOperator) {
      console.log("setting up operator");

      const _products = await fetch(
        "https://configs.cashflowcasino.com/house/bonuses.seed.json"
      );
      const products = await _products.json();

      const defaultOperator = {
        id: "house",
        name: "The House",
        slotsBalance: 100000,
        arcadeBalance: 100000,
        currentFloat: 0,
        isActive: true,
        ownerId: "superadmin",
        products,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(operators).values(defaultOperator);

      console.log("✓ BonusData, Settings, Games and Operator setup complete");
      return true;
    }
  } catch (error) {
    console.error(
      "✗ BonusData, Settings, Games and Operator setup failed:",
      error
    );
    return false;
  }
}
// Generate a random password for the admin account
const generateRandomPassword = () => {
  return randomBytes(16).toString("hex");
};

const adminEmail = "adminuser@cashflowcasino.com";
const adminName = "adminuser";
const randomPassword = generateRandomPassword();

// Create an admin account if it doesn't exist, and create two sample posts
export const setupAccounts = async () => {
  let ownerId: string;

  try {
    // Try to create admin account using Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: randomPassword,
        name: adminName,
        username: adminName,
        // displayName: adminName,
      },
    });
    const u = await supabase.auth.signUp({
      email: adminEmail,
      password: randomPassword,
    });
    if (result) {
      // Get the created user
      const userRecord = await db.query.users.findFirst({
        where: eq(users.email, adminEmail),
      });

      if (userRecord) {
        ownerId = userRecord.id;

        // Create admin roles if it doesn't exist
        let adminroles = await db.query.roles.findFirst({
          where: eq(roles.name, "admin"),
        });

        if (!adminroles) {
          const newroles = await db
            .insert(roles)
            .values({
              id: crypto.randomUUID(),
              name: "admin",
              description: "Administrator roles",
            })
            .returning();
          adminroles = newroles[0];
        }

        // Assign admin roles to user
        if (adminroles) {
          await db.insert(usersRoles).values({
            id: crypto.randomUUID(),
            userId: userRecord.id,
            roleId: adminroles.id,
          });
        }

        // Verify the admin account email
        await db
          .update(users)
          .set({ emailVerified: true })
          .where(eq(users.id, userRecord.id));

        console.log(
          `Admin account created with email: ${adminEmail} and password: ${randomPassword}`
        );
      } else {
        throw new Error("Failed to find created user");
      }
    } else {
      throw new Error("Failed to create admin account");
    }
  } catch (error: unknown) {
    // Account might already exist, try to get existing user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (existingUser) {
      console.log(`Admin account already exists with email: ${adminEmail}`);
      ownerId = existingUser.id;
    } else {
      console.error("Error creating admin account:", error);
      throw error;
    }
  }
};

// Create 10 users using Better Auth
const setupUsers = async () => {
  console.log("Starting user creation...");

  try {
    // Check existing users with affiliate roles
    const affiliateroles = await db.query.roles.findFirst({
      where: eq(roles.name, "affiliate"),
    });

    if (!affiliateroles) {
      throw new Error("Affiliate roles not found. Please run setup first.");
    }

    const existingAffiliateUsers = await db
      .select({ count: count() })
      .from(usersRoles)
      .where(eq(usersRoles.roleId, affiliateroles.id));

    const affiliateUserCount = existingAffiliateUsers[0]?.count || 0;
    console.log(
      `Found ${affiliateUserCount} existing users with affiliate roles`
    );

    const usersToCreate: any[] = [];
    const createdUsers: any[] = [];

    // Create 10 users
    for (let i = 0; i < 10; i++) {
      const email = randEmail();
      const name = randUserName({ withAccents: false })
        .replaceAll("-", "")
        .replaceAll("_", "");
      const password = generateRandomPassword();
      const createdAt = randRecentDate({ days: 60 });

      try {
        // Create user using Better Auth
        const result = await auth.api.signUpEmail({
          body: {
            email,
            password,
            name,
            username: name,
            // displayName: name,
          },
        });
        await supabase.auth.signUp({
          email,
          password,
        });
        if (result) {
          // Get the created user
          const userRecord = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (userRecord) {
            // Update createdAt date
            await db
              .update(users)
              .set({ createdAt })
              .where(eq(users.id, userRecord.id));

            // Bypass email verification
            await db
              .update(users)
              .set({ emailVerified: true })
              .where(eq(users.id, userRecord.id));

            // Check if we should assign affiliate roles (if < 3 total)
            if (affiliateUserCount + createdUsers.length < 3) {
              await db.insert(usersRoles).values({
                id: crypto.randomUUID(),
                userId: userRecord.id,
                roleId: affiliateroles.id,
              });
              console.log(`✓ Assigned affiliate roles to user: ${email}`);
            }

            createdUsers.push(userRecord);
            console.log(`✓ Created user: ${email} with password: ${password}`);
          } else {
            throw new Error(`Failed to find created user: ${email}`);
          }
        } else {
          throw new Error(`Failed to create user: ${email}`);
        }
      } catch (error: unknown) {
        console.error(`✗ Failed to create user ${email}:`, error);
        // Continue with next user
      }
    }

    console.log(`Successfully created ${createdUsers.length} users`);
    assert(createdUsers.length > 0, "No users were created");

    console.log("User creation completed successfully!");
    return createdUsers;
  } catch (error: unknown) {
    console.error("Error during user creation:", error);
    throw error;
  }
};

export async function setupDatabase() {
  const existingPlayers = await db.query.players.findMany();
  if (existingPlayers && existingPlayers?.length < 3) {
    await setupAuth();
    await setupOperators();
    await setupAccounts();
    await setupUsers();
  }
  const existingGames = await db.query.games.findMany();
  if (existingGames && existingGames?.length < 2) {
    await seedGames();
  }
}
