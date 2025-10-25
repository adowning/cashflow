import { users, sessions, accounts, roles, usersRoles } from '@backend/database/schema'
import { eq, inArray } from 'drizzle-orm'
import * as crypto from 'crypto'
import db from '@backend/database'
import { v4 as uuidv4 } from 'uuid'
import chalk from 'chalk'
import { auth } from '@/lib/auth'
import { apiKey } from 'better-auth/plugins'
import { randUserName } from '@ngneat/falso'
/**
 * A standalone script to create static and dynamic users, simulate login,
 * and create session records in the database.
 */
export const seedAndLoginUsers = async () => {
  try {
    console.log(chalk.blue('🌱 Starting user creation and login simulation...'))

    const defaultRoles = [
      { name: 'admin', description: 'Administrator with full access' },
      { name: 'affiliate', description: 'Affiliate with limited access, to certain users' },
      { name: 'user', description: 'Default user role' }
    ]

    for (const roleData of defaultRoles) {
      const existingRole = await db.query.roles.findFirst({
        where: eq(roles.name, roleData.name)
      })

      if (!existingRole) {
        await db.insert(roles).values({
          id: crypto.randomUUID(),
          name: roleData.name,
          description: roleData.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log(`✓ Created role: ${roleData.name}`)
      } else {
        console.log(`✓ Role already exists: ${roleData.name}`)
      }
    }
    // --- Define Users to Create ---
    const staticUsers = [
      { name: 'house', username: 'house', password: 'systemasdfasdf', email: 'house@example.com' },
      { name: 'asdf', username: 'asdf', password: 'asdfasdf', email: 'asdf@example.com' }
    ]

    const TOTAL_DYNAMIC_USERS = 4
    const username = randUserName({ withAccents: false }).replaceAll('_', '').replaceAll('-', '')
    const name = username

    const dynamicUsers = Array.from({ length: TOTAL_DYNAMIC_USERS }, (_, i) => ({
      // name: `Test User ${i + 1}`,
      name,
      username,
      password: `asdfasdf`,
      email: `user${i + 1}@example.com`,
    }))

    const allUsersToProcess = [...staticUsers, ...dynamicUsers]
    // const allUserEmails = allUsersToProcess.map(u => u.email);

    // --- Step 1: Reset existing users and their sessions ---
    console.log(chalk.yellow('- Deleting any existing test users and their sessions...', allUsersToProcess.length))

    // if (allUserEmails.length > 0) {
    // Find the IDs of the users we are about to delete
    // const usersToDelete = await db.select({ id: users.id }).from(users).where(inArray(users.email, allUserEmails));
    // const userIdsToDelete = usersToDelete.map(u => u.id);

    // // If users were found, delete their sessions first to avoid foreign key issues
    // if (userIdsToDelete.length > 0) {
    //   await db.delete(sessions).where(inArray(sessions.userId, userIdsToDelete));
    //   console.log(chalk.gray(`  - Cleared ${userIdsToDelete.length} old session(s).`));
    // }

    // Now, delete the users
    // const deleteResult = await db.delete(users).where(inArray(users.email, allUserEmails));
    // console.log(chalk.gray(`  - Deleted ${deleteResult.rowCount} user(s).`));
    // // }
    // console.log(chalk.green('- Previous test users and sessions cleared.'));


    // --- Step 2: Create all new users ---
    console.log(chalk.yellow(`\n- Creating ${allUsersToProcess.length} new users...`))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdUsersWithPasswords: any[] = []

    for (const user of allUsersToProcess) {
      user.username = user.name
      const passwordHash = await Bun.password.hash(user.password)
      const now = new Date()
      // const [newUser] = await db
      //   .insert(users)
      //   .values({
      //     name: user.name,
      //     email: user.email,
      //     emailVerified: true,
      //     image: null,
      //     passwordHash: passwordHash,
      //     createdAt: now,
      //     updatedAt: now,
      //   })
      //   .returning();
      const newUser = await auth.api.signUpEmail({
        body: {
          password: user.password,
          username: user.username,
          email: user.email,
          // operatorId: 'house',
          name: user.name,
          // playerId,
          // created_at: createdAt,
          // createdAt,
          // updatedAt: createdAt
        }
      })
    if (user.name === 'house' || user.name === 'asdf') {
      console.log(`🔧 Assigning admin role to hardcoded user: ${user.name}`)
      const adminRole = await db.query.roles.findFirst({
        where: eq(roles.name, 'admin')
      })
      if (adminRole) {
        await db.insert(usersRoles).values({
          id: crypto.randomUUID(),
          userId: newUser.user?.id,
          roleId: adminRole.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log(`✅ Assigned admin role to user: ${newUser.user?.email}`)
      } else {
        console.log('⚠️ Admin role not found')
      }
    }

      // console.log(chalk.cyan(`  - Created user: ${newUser.user?.email}`))

      // Create corresponding account entry
      // await db.insert(accounts).values({
      //   id: crypto.randomUUID(),
      //   accountId: user.email,
      //   providerId: 'credential',
      //   userId: newUser.user?.id,
      //   accessToken: null,
      //   refreshToken: null,
      //   password: passwordHash,
      //   createdAt: now,
      //   updatedAt: now,
      // });

      // console.log(chalk.cyan(`  - Created account for user: ${newUser.user?.email}`))

      // Store the plain password temporarily for session creation
      // createdUsersWithPasswords.push({ ...newUser.user, plainPassword: user.password })
    }
    console.log(chalk.green('- User creation complete.'))


    // --- Step 3: Simulate a login and create a session for each user ---
    console.log(chalk.yellow('\n- Simulating login and creating database sessions...'))
    for (const user of createdUsersWithPasswords) {
      if (!user || !user.plainPassword) {
        console.error(chalk.red(`  ❌ Critical error: User object for ${user?.email} is invalid.`))
        continue
      }

      // const isPasswordCorrect = await Bun.password.verify(user.plainPassword, user.passwordHash);


      // if (isPasswordCorrect) {
      const sessionToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

      await auth.api.signInUsername({
        body: {
          username: user.name,
          password: user.plainPassword
        }
      })


      console.log(chalk.magenta(`  ✅ Login successful for: ${user.email}. Session created.`))
      // } else {
      //   console.error(chalk.red(`  ❌ Login FAILED for: ${user.email} (Password mismatch)`));
      // }
    }
    console.log(chalk.green('- Session creation simulation .'))

    // process.exit(1);
  } catch (e) {
    console.error(chalk.red('🔴 An error occurred during the seeding process:'))

    console.log(e)
  }
  console.log(chalk.blue('\n✨ Process finished successfully!'))


}
