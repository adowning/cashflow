/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import chalk from "chalk";
// import { seedAffiliatesAndReferrals } from "./2-affiliates-referrals.seed";
import { seedGameSpins } from "./gameSpins"; // 1. Import the new seeder
import { seedGames } from "./games";
import { seedOperator } from "./operator";
import { seedProducts } from "./products";
import { resetDatabase } from "./reset";
import { seed as settlements } from "./settlements-loyalty.seed";
import
{
  seedHardcodedUser,
  seedSystem,
  seedUsers,
  seedWallets
} from "./users";
import { seedVipLevels } from "./vip";
import { seedAndLoginUsers } from './better-auth'
import { seedBonuses } from "./bonuses.seed";
import { seedAffiliatesAndReferrals } from './2-affiliates-referrals.seed'
import { seedSettings } from "./settings.seed";

// --- Script Configuration ---
const RESET_DATABASE = false;
const USER_COUNT = 1;
// Number of users to seed, adjust as needed
// --- End Configuration ---

async function main()
{
  console.log(chalk.blue("🚀 Starting database seeding process..."));
  const startTime = Date.now();

  try {
    if (RESET_DATABASE) {
      await resetDatabase();
    }

    const operator = await seedOperator();
    
    // await seedVipLevels();
    // await seedGames();
    // await seedProducts(operator.id);
    // await seedAndLoginUsers()
    // await seedBonuses();
    // await seedSettings();
    // await seedUsers(USER_COUNT, operator.id);
    // // await seedHardcodedUser(operator.id);
    // // await seedSystem(operator.id);
    // // await seedWallets(operator.id);
    // await seedAffiliatesAndReferrals();
    await seedGameSpins(operator.id); // 2. Call the new seeder function

    await settlements();
    // await seedChat();
    // await appVersions();
  } catch (error) {
    console.error("❌ An error occurred during the seeding process:");
    console.error(error);
    process.exit(1);
  }
  // finally {
  //   // Ensure the database connection is closed to prevent hanging processes
  //   // await connection.
  //   console.log(chalk.blue('seeding complete'))
  // }

  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000;
  console.log(`\n✅ Seeding complete in ${duration.toFixed(2)} seconds.`);
  process.exit(0);
}

main();
