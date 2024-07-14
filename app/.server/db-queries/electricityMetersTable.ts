import { db } from "../db";
import { ElectricityMetersTable } from "../schema";
import type {
  MetersValues,
  CheckRecordValues
} from "~/types";
import { eq, and } from "drizzle-orm";

export const insertNewMeters = async ({
  quantity,
  type,
  date,
  transformerSubstationId
 }: MetersValues) => {
  await db
    .insert(ElectricityMetersTable)
    .values({ quantity, type, date, transformerSubstationId })
 };

export const checkMetersRecord = async ({
  type,
  date,
  transformerSubstationId
}: CheckRecordValues) => {
  const record = await db
    .select({
      quantity: ElectricityMetersTable.quantity,
      transformerSubstationId:
        ElectricityMetersTable.transformerSubstationId,
      date: ElectricityMetersTable.date,
      type: ElectricityMetersTable.type
    })
    .from(ElectricityMetersTable)
    .where(
      and(
        eq(ElectricityMetersTable.transformerSubstationId,
          transformerSubstationId),
        eq(ElectricityMetersTable.date, date),
        eq(ElectricityMetersTable.type, type)
      )
  );

  return record;
};

export const updateMetersRecord = async ({
  quantity,
  type,
  date,
  transformerSubstationId
}: MetersValues) => {
  await db
    .update(ElectricityMetersTable)
    .set({ quantity })
    .where(
      and(
        eq(ElectricityMetersTable.transformerSubstationId,
          transformerSubstationId),
        eq(ElectricityMetersTable.date, date),
        eq(ElectricityMetersTable.type, type)
      )
    );
};
