import {
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
  date
} from 'drizzle-orm/pg-core';

export const TransformerSubstationTable =
  pgTable('transformerSubstation', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 8 }).unique().notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  });

export const BalanceType = pgEnum('balanceType', [
  'Быт', 'ЮР Sims', 'ЮР П2', 'ОДПУ Sims', 'ОДПУ П2'
]);

export const ElectricityMetersTable =
  pgTable('electricityMeters', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    type: BalanceType('balanceType').notNull(),
    date: date('date', { mode: "string" }),
    transformerSubstationId: integer('transformerSubstation')
      .references(() => TransformerSubstationTable.id, {
        'onDelete': 'cascade'
      }).notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  });
