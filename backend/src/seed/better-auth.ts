import { users, sessions } from '@backend/database/schema';
import { eq, inArray } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import db from '@backend/database';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

/**
 * A standalone script to create static and dynamic users, simulate login,
 * and create session records in the database.
 */
export const seedAndLoginUsers = async () => {
  try {
    console.log(chalk.blue('🌱 Starting user creation and login simulation...'));

    // --- Define Users to Create ---
    const staticUsers = [
      { name: "system", password: "systemasdfasdf", email: "system@example.com" },
      { name: "asdf", password: "asdfasdf", email: "asdf@example.com" }
    ];

    const TOTAL_DYNAMIC_USERS = 10;
    const dynamicUsers = Array.from({ length: TOTAL_DYNAMIC_USERS }, (_, i) => ({
      name: `Test User ${i + 1}`,
      password: `Password-is-secret-${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));

    const allUsersToProcess = [...staticUsers, ...dynamicUsers];
    const allUserEmails = allUsersToProcess.map(u => u.email);

    // --- Step 1: Reset existing users and their sessions ---
    console.log(chalk.yellow('- Deleting any existing test users and their sessions...'));

    if (allUserEmails.length > 0) {
      // Find the IDs of the users we are about to delete
      const usersToDelete = await db.select({ id: users.id }).from(users).where(inArray(users.email, allUserEmails));
      const userIdsToDelete = usersToDelete.map(u => u.id);

      // If users were found, delete their sessions first to avoid foreign key issues
      if (userIdsToDelete.length > 0) {
        await db.delete(sessions).where(inArray(sessions.userId, userIdsToDelete));
        console.log(chalk.gray(`  - Cleared ${userIdsToDelete.length} old session(s).`));
      }

      // Now, delete the users
      const deleteResult = await db.delete(users).where(inArray(users.email, allUserEmails));
      console.log(chalk.gray(`  - Deleted ${deleteResult.rowCount} user(s).`));
    }
    console.log(chalk.green('- Previous test users and sessions cleared.'));


    // --- Step 2: Create all new users ---
    console.log(chalk.yellow(`\n- Creating ${allUsersToProcess.length} new users...`));
    const createdUsersWithPasswords = [];

    for (const user of allUsersToProcess) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(user.password, salt);
      const now = new Date();

      const [newUser] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          name: user.name,
          email: user.email,
          emailVerified: true,
          image: null,
          passwordHash: passwordHash,
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          id: users.id,
          email: users.email,
          passwordHash: users.passwordHash,
        });

      console.log(chalk.cyan(`  - Created user: ${newUser.email}`));
      // Store the plain password temporarily for session creation
      createdUsersWithPasswords.push({ ...newUser, plainPassword: user.password });
    }
    console.log(chalk.green('- User creation complete.'));


    // --- Step 3: Simulate a login and create a session for each user ---
    console.log(chalk.yellow('\n- Simulating login and creating database sessions...'));
    for (const user of createdUsersWithPasswords) {
      if (!user || !user.passwordHash) {
        console.error(chalk.red(`  ❌ Critical error: User object for ${user?.email} is invalid.`));
        continue;
      }

      const isPasswordCorrect = await bcrypt.compare(
        user.plainPassword,
        user.passwordHash
      );

      if (isPasswordCorrect) {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

        await db.insert(sessions).values({
          id: uuidv4(),
          userId: user.id,
          // Assuming playerId is the same as userId for this seeding purpose
          playerId: user.id, 
          sessionToken: sessionToken,
          token: sessionToken, // Depending on schema, you might have one or both
          expiresAt: expiresAt,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(chalk.magenta(`  ✅ Login successful for: ${user.email}. Session created.`));
      } else {
        console.error(chalk.red(`  ❌ Login FAILED for: ${user.email} (Password mismatch)`));
      }
    }
    console.log(chalk.green('- Session creation simulation complete.'));

    console.log(chalk.blue('\n✨ Process finished successfully!'));
  } catch (error) {
    console.error(chalk.red('🔴 An error occurred during the seeding process:'));
    console.error(error);
    process.exit(1);
  }
};
