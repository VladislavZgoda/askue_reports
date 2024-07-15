import { db } from "../db";
import { NewYearMetersTable } from "../schema";
import type { 
  YearMetersValues,
  SelectYearQuantity
} from "~/types";
import { eq, and } from "drizzle-orm";

export const insertYearMeters = async ({
  quantity,
  added_to_system,
  type,
  date,
  transformerSubstationId,
  year
}: YearMetersValues) => {
  await db
  .insert(NewYearMetersTable)
  .values({
    quantity,
    added_to_system,
    type,
    date,
    transformerSubstationId,
    year
  });
};

export const selectYearQuantity = async ({
  type,
  date,
  transformerSubstationId,
  year
}: SelectYearQuantity) => {
  const yearQuantity = await db
  .select({
    quantity: NewYearMetersTable.quantity,
    added_to_system:  NewYearMetersTable.added_to_system
  })
  .from(NewYearMetersTable)
  .where(and(
    eq(NewYearMetersTable.type, type),
    eq(NewYearMetersTable.date, date),
    eq(NewYearMetersTable.transformerSubstationId,
       transformerSubstationId),
    eq(NewYearMetersTable.year, year)
  ));

  return yearQuantity;
};

export const updateYearMeters = async ({
  quantity,
  added_to_system,
  type,
  date,
  transformerSubstationId,
  year
}: YearMetersValues) => {
  const updated_at = new Date();

  await db
    .update(NewYearMetersTable)
    .set({ quantity, added_to_system, updated_at })
    .where(and(
      eq(NewYearMetersTable.type, type),
      eq(NewYearMetersTable.date, date),
      eq(NewYearMetersTable.transformerSubstationId,
       transformerSubstationId),
      eq(NewYearMetersTable.year, year)
    ));
};