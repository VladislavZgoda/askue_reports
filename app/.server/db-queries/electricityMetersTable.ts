import { db } from "../db";
import { ElectricityMetersTable } from "../schema";
import type {
  MetersValues,
  CheckRecordValues,
  LastQuantity
} from "~/types";
import { eq, and, desc } from "drizzle-orm";

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
}: CheckRecordValues): Promise<number | undefined> => {
  const record = await db
    .select({
      quantity: ElectricityMetersTable.quantity
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

  return record[0]?.quantity;
};

export const updateMetersRecord = async ({
  quantity,
  type,
  date,
  transformerSubstationId
}: MetersValues) => {
  const updated_at = new Date();

  await db
    .update(ElectricityMetersTable)
    .set({ quantity, updated_at })
    .where(
      and(
        eq(ElectricityMetersTable.transformerSubstationId,
          transformerSubstationId),
        eq(ElectricityMetersTable.date, date),
        eq(ElectricityMetersTable.type, type)
      )
    );
};

export const selectLastQuantity = async ({
  transformerSubstationId,
  type
}: LastQuantity): Promise<number | undefined> => {
  const metersQuantity = await db
    .select({
      quantity: ElectricityMetersTable.quantity
    })
    .from(ElectricityMetersTable)
    .where(
      and(
        eq(ElectricityMetersTable.transformerSubstationId,
          transformerSubstationId),
        eq(ElectricityMetersTable.type, type)
      )
    )
    .orderBy(desc(ElectricityMetersTable.date))
    .limit(1);

  return metersQuantity[0]?.quantity;
};
