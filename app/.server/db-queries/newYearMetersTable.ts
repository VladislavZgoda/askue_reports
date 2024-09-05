import { db } from "../db";
import { NewYearMetersTable } from "../schema";
import type {
  YearMetersValues,
  SelectYearQuantity,
  LastYearQuantity,
  UpdateYearOnIdType
} from "~/types";
import { eq, and, desc, gt, lt, lte } from "drizzle-orm";

export async function insertYearMeters({
  quantity,
  added_to_system,
  type,
  date,
  transformerSubstationId,
  year
}: YearMetersValues){
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
}

export async function selectYearQuantity({
  type,
  date,
  transformerSubstationId,
  year
}: SelectYearQuantity){
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
}

export async function selectLastYearQuantity({
  type,
  transformerSubstationId,
  year
}: LastYearQuantity){
  const yearQuantity = await db
    .select({
      quantity: NewYearMetersTable.quantity,
      added_to_system: NewYearMetersTable.added_to_system
    })
    .from(NewYearMetersTable)
    .where(and(
      eq(NewYearMetersTable.type, type),
      eq(NewYearMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(NewYearMetersTable.year, year)
    ))
    .orderBy(desc(NewYearMetersTable.date))
    .limit(1);

  return yearQuantity;
}

export async function updateYearMeters({
  quantity,
  added_to_system,
  type,
  date,
  transformerSubstationId,
  year
}: YearMetersValues){
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
}

export async function getLastYearId({
  type,
  transformerSubstationId,
  year
}: LastYearQuantity): Promise<number | undefined>{
  const recordId = await db
    .select({ id: NewYearMetersTable.id })
    .from(NewYearMetersTable)
    .where(and(
      eq(NewYearMetersTable.type, type),
      eq(NewYearMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(NewYearMetersTable.year, year)
    ))
    .orderBy(desc(NewYearMetersTable.date))
    .limit(1);

  return recordId[0]?.id;
}

export async function updateYearOnId({
  id, quantity, added_to_system
}: UpdateYearOnIdType){
  const updated_at = new Date();

  await db
    .update(NewYearMetersTable)
    .set({ quantity, added_to_system, updated_at })
    .where(eq(NewYearMetersTable.id, id));
}

export async function getYearIds({
  type,
  date,
  transformerSubstationId,
  year
}: SelectYearQuantity) {
  const ids = await db
    .select({ id: NewYearMetersTable.id })
    .from(NewYearMetersTable)
    .where(and(
      gt(NewYearMetersTable.date, date),
      eq(NewYearMetersTable.type, type),
      eq(NewYearMetersTable.year, year),
      eq(NewYearMetersTable.transformerSubstationId,
        transformerSubstationId)
    ));

  return ids;
}

export async function getYearMetersOnID(id: number) {
  const record = await db
    .select({
      quantity: NewYearMetersTable.quantity,
      added_to_system: NewYearMetersTable.added_to_system
    })
    .from(NewYearMetersTable)
    .where(eq(
      NewYearMetersTable.id, id
    ));

  return record[0];
}

export async function getYearMetersForInsert({
  type,
  date,
  transformerSubstationId,
  year
}: SelectYearQuantity) {
  const record = await db
    .select({
      quantity: NewYearMetersTable.quantity,
      added_to_system: NewYearMetersTable.added_to_system
    })
    .from(NewYearMetersTable)
    .where(and(
      eq(NewYearMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(NewYearMetersTable.type, type),
      eq(NewYearMetersTable.year, year),
      lt(NewYearMetersTable.date, date)
    ))
    .orderBy(desc(NewYearMetersTable.date))
    .limit(1);

  return record;
}

export async function selectYearMetersOnDate({
  type,
  date,
  transformerSubstationId,
  year
}: SelectYearQuantity) {
  const record = await db
    .select({
      quantity: NewYearMetersTable.quantity,
      added_to_system: NewYearMetersTable.added_to_system
    })
    .from(NewYearMetersTable)
    .where(and(
      eq(NewYearMetersTable.transformerSubstationId,
        transformerSubstationId),
      lte(NewYearMetersTable.date, date),
      eq(NewYearMetersTable.type, type),
      eq(NewYearMetersTable.year, year)
    ))
    .orderBy(desc(NewYearMetersTable.date))
    .limit(1);

  return record[0];
}
