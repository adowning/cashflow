import { defineConfig } from "drizzle-kit";

// export default defineConfig({
//   schema: "./src/db//index.ts",
//   out: "./src/db/migrations",
//   dialect: "sqlite",
//   driver: "turso",
//   dbCredentials: {
//     url: env.DATABASE_URL,
//     authToken: env.DATABASE_AUTH_TOKEN,
//   },
// });
export default defineConfig({
  schema: "./backend/src/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "camelCase",
  dbCredentials: {
    url: "postgresql://user:asdfasdf@localhost:5439/allnew",
  },
});
