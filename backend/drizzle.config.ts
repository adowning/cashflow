import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./database/schema",
  out: "../drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // url: "postgresql://user:asdfasdf@localhost:5439/newdb",
    url: "postgresql://postgres.crqbazcsrncvbnapuxcp:crqbazcsrncvbnapuxcp@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  },
});
// import 'dotenv/config';
// import { Config } from 'drizzle-kit'

// export default {
//   out: `../drizzle`,
//   schema: './src/database/schema.ts',
//   breakpoints: true,
//   dialect: 'postgresql',
//   dbCredentials: {
//     url: "../data",
//   },DDD
//   driver: "pglite",
// } satisfies Config
