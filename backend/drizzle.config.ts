import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: '../drizzle',
  dialect: 'postgresql',
  casing: 'camelCase',
  dbCredentials: {
    url: 'postgresql://user:asdfasdf@localhost:5439/newdb',
  },
});
