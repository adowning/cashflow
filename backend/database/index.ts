import { drizzle } from 'drizzle-orm/bun-sql';
// import './schema';
import * as schema from './schema';
// export { users } from './schema';
// export * from './interfaces';
// export * from './_schema';

// export const users = user;
// const db = drizzle('postg/res://user:asdfasdf@localhost:5439/allnew', schema);
// const db = drizzle({ client, schema });
const db = drizzle({ connection: 'postgres://user:asdfasdf@127.0.0.1:5439/newdb', schema });
// const db = drizzle({ connection: 'postgresql://postgres:crqbazcsrncvbnapuxcp@db.crqbazcsrncvbnapuxcp.supabase.co:5432/postgres',  schema });
const userTest = await db.query.players.findFirst();
console.log('userTest: ', userTest?.playername);
export default db;
