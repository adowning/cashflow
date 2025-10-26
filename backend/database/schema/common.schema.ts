import { text, timestamp, boolean, integer, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

// Zod base schema for type safety
export const baseSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().default('system'),
  version: z.number().default(1),
  isActive: z.boolean().default(true),
});

// Utility to extend base schema
export const withBase = (schema: z.ZodObject<any>) => baseSchema.merge(schema);

// Drizzle base columns
export const baseColumns = {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedBy: text('updated_by').default('system').notNull(),
  version: integer('version').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
};

// Reusable columns
export const createdAt = timestamp('created_at', { mode: 'date', precision: 3 })
  .defaultNow()
  .notNull();
export const updatedAt = timestamp('updated_at', { mode: 'date', precision: 3 })
  .defaultNow()
  .notNull()
  .$onUpdate(() => sql`now()`);
export const id = text('id')
  .$defaultFn(() => createId())
  .primaryKey();

// Custom type for representing amounts in cents (integer)
export const cents = customType<{ data: number }>({
  dataType() {
    return 'integer';
  },
  toDriver(value: number): number {
    return Math.round(value); // Ensure it's an integer
  },
  fromDriver(value: unknown): number {
    return value as number; // Type assertion since DB value is integer
  },
});
