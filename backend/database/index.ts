import { drizzle } from "drizzle-orm/bun-sql";
// import './schema';
import { PGlite } from "@electric-sql/pglite";

import * as schema from "./schema";
import postgres from "postgres";
import { SQL } from "bun";
// export { users } from './schema';
// export * from './interfaces';
// export * from './_schema';

// export const users = user;
// const db = drizzle('postg/res://user:asdfasdf@localhost:5439/allnew', schema);
// const db = drizzle({ client, schema });
// const db = drizzle({ connection: 'postgres://user:asdfasdf@127.0.0.1:5439/newdb', schema });
// const db = pgliteDrizzle({
//   connection: "../db",
//   schema,
// });
// const db = drizzle({
//   connection:
//     "postgresql://postgres:crqbazcsrncvbnapuxcp@db.crqbazcsrncvbnapuxcp.supabase.co:5432/postgres",
//   schema,
// });
// const client = postgres(
//   //   "postgresql://postgres:crqbazcsrncvbnapuxcp@db.crqbazcsrncvbnapuxcp.supabase.co:5432/postgres"
//   "postgresql://postgres.crqbazcsrncvbnapuxcp:crqbazcsrncvbnapuxcp@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
// );
const client = new SQL(
  // "postgresql://postgres:crqbazcsrncvbnapuxcp@db.crqbazcsrncvbnapuxcp.supabase.co:5432/postgres"
  "postgresql://postgres.crqbazcsrncvbnapuxcp:crqbazcsrncvbnapuxcp@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
);

export const db = drizzle({ client, schema });
// const userTest = await db.query.players.findFirst();
// console.log("userTest: ", userTest?.playername);
// const connection = new PGlite();
// const db = drizzle({ connection, schema });
// // await db.select().from(schema);
// const p = await db.query.players.findMany();
// console.log(p);
const p = await db.select().from(schema.players);
console.log(p);
// import type { PGlite } from "@electric-sql/pglite";
export default db;

// import { configurationManager } from "../config/config";
// import { type DrizzleConfig } from "drizzle-orm";
// import {
//   type NodePgClient,
//   drizzle as pgDrizzle,
// } from "drizzle-orm/node-postgres";
// import type { PgDatabase } from "drizzle-orm/pg-core";
// import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";

// /**
//  * Database configuration for Drizzle ORM.
//  */
// export const dbConfig: DrizzleConfig = {
//   logger: configurationManager.debug,
//   casing: "snake_case",
// };

// /**
//  * Migration configuration for Drizzle ORM.
//  */
// export const migrateConfig = {
//   migrationsFolder: "drizzle",
//   migrationsSchema: "drizzle-backend",
// };

// /**
//  * Database connection configuration.
//  */
// const connection = (() => {
//   if (process.env.AVOID_DB_CONNECTION === "true") return {};

//   if (env.PGLITE) {
//     if (process.env.NODE_ENV === "test") return {}; // In-memory database for tests

//     // PGLite for quick local development
//     return { dataDir: "./.db" };
//   }

//   // Regular Postgres connection
//   return {
//     // connectionString: `file:`,
//     connectionTimeoutMillis: 10000,
//   };
// })();

// // biome-ignore lint/suspicious/noExplicitAny: Can be two different types
// type DB = PgDatabase<any> & { $client: PGlite | NodePgClient };

// /**
//  * The database client.
//  */
// export let db: DB;

// if (process.env.SKIP_DB === "1") db = {} as DB;
// else
//   db = (
//     env.PGLITE
//       ? pgliteDrizzle({ connection, ...dbConfig })
//       : pgDrizzle({ connection, ...dbConfig })
//   ) as DB;
