import { db } from "../db";
import { NewMonthMetersTable } from "../schema";
import { eq, and, desc } from "drizzle-orm";
import type { 
  MonthMetersValues,
  SelectMonthQuantity,
  LastMonthQuantity
} from "~/types";

export const insertMonthMeters = async ({
  quantity,
  added_to_system,
  type,
  date,
  transformerSubstationId,
  month,
  year
}: MonthMetersValues) => {
  await db
  .insert(NewMonthMetersTable)
  .values({
    quantity,
    added_to_system,
    type,
    date,
    transformerSubstationId,
    month,
    year
  });
};

export const selectMonthQuantity = async ({
  type,
  date,
  transformerSubstationId,
  month,
  year
}: SelectMonthQuantity) => {
  const monthQuantity = await db
  .select({
    quantity: NewMonthMetersTable.quantity,
    added_to_system: NewMonthMetersTable.added_to_system
  })
  .from(NewMonthMetersTable)
  .where(and(
    eq(NewMonthMetersTable.type, type),
    eq(NewMonthMetersTable.date, date),
    eq(NewMonthMetersTable.transformerSubstationId,
       transformerSubstationId),
    eq(NewMonthMetersTable.month, month),
    eq(NewMonthMetersTable.year, year)
  ));

  return monthQuantity;
};

export const selectLastMonthQuantity = async ({
  type,
  transformerSubstationId,
  month,
  year
}: LastMonthQuantity) => {
  const monthQuantity = await db
    .select({
      quantity: NewMonthMetersTable.quantity,
      added_to_system: NewMonthMetersTable.added_to_system
    })
    .from(NewMonthMetersTable)
    .where(and(
      eq(NewMonthMetersTable.type, type),
      eq(NewMonthMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(NewMonthMetersTable.month, month),
      eq(NewMonthMetersTable.year, year)
    ))
    .orderBy(desc(NewMonthMetersTable.date))
    .limit(1);

  return monthQuantity;
};

export const updateMonthMeters = async ({
  quantity,
  added_to_system,
  type,
  date,
  transformerSubstationId,
  month,
  year
}: MonthMetersValues) => {
  const updated_at = new Date();

  await db
    .update(NewMonthMetersTable)
    .set({ quantity, added_to_system, updated_at })
    .where(and(
      eq(NewMonthMetersTable.type, type),
      eq(NewMonthMetersTable.date, date),
      eq(NewMonthMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(NewMonthMetersTable.month, month),
      eq(NewMonthMetersTable.year, year)
    ));
};
