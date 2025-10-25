import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: '../drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://user:asdfasdf@localhost:5439/newdb',
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
//   },
//   driver: "pglite",
// } satisfies Config