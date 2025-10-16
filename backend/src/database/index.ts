import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./schema";
export * from './interfaces'
// const db = drizzle('postg/res://user:asdfasdf@localhost:5439/allnew', schema);
// const db = drizzle({ client, schema });
const db = drizzle({ connection: 'postgres://user:asdfasdf@127.0.0.1:5439/newdb', casing: 'camelCase', schema })
export default db;
