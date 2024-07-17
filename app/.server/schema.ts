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
    date: date('date', { mode: "string" }).notNull(),
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

export const NewYearMetersTable = 
  pgTable('newYearMetersTable', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    added_to_system: integer('added_to_system').notNull(),
    type: BalanceType('balanceType').notNull(),
    year: integer('year').notNull(),
    date: date('date', { mode: "string" }).notNull(),
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

export const NewMonthMetersTable = 
  pgTable('newMonthMetersTable', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    added_to_system: integer('added_to_system').notNull(),
    type: BalanceType('balanceType').notNull(),
    month: varchar('month', { length: 2 }).notNull(),
    year: integer('year').notNull(),
    date: date('date', { mode: "string" }).notNull(),
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

export const NotInSystem = 
  pgTable('notInSystem', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    type: BalanceType('balanceType').notNull(),
    date: date('date', { mode: "string" }).notNull(),
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