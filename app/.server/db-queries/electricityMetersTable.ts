import { db } from "../db";
import { ElectricityMetersTable } from "../schema";
import type {
  MetersValues,
  CheckRecordValues,
  LastQuantity,
  UpdateOnIdType,
  BalanceType
} from "~/types";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

export async function insertNewMeters({
  quantity,
  type,
  date,
  transformerSubstationId
 }: MetersValues) {
  await db
    .insert(ElectricityMetersTable)
    .values({
      quantity,
      type,
      date,
      transformerSubstationId
    });
}

export async function checkMetersRecord({
  type,
  date,
  transformerSubstationId
}: CheckRecordValues): Promise<number | undefined> {
  const record = await db
    .select({
      quantity: ElectricityMetersTable.quantity
    })
    .from(ElectricityMetersTable)
    .where(and(
      eq(ElectricityMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(ElectricityMetersTable.date, date),
      eq(ElectricityMetersTable.type, type)
    ));

  return record[0]?.quantity;
}

export async function updateMetersRecord({
  quantity,
  type,
  date,
  transformerSubstationId
}: MetersValues) {
  const updated_at = new Date();

  await db
    .update(ElectricityMetersTable)
    .set({ quantity, updated_at })
    .where(and(
      eq(ElectricityMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(ElectricityMetersTable.date, date),
      eq(ElectricityMetersTable.type, type)
    ));
}

export async function selectLastQuantity({
  transformerSubstationId,
  type
}: LastQuantity): Promise<number | undefined> {
  const metersQuantity = await db
    .select({
      quantity: ElectricityMetersTable.quantity
    })
    .from(ElectricityMetersTable)
    .where(and(
      eq(ElectricityMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(ElectricityMetersTable.type, type)
    ))
    .orderBy(desc(ElectricityMetersTable.date))
    .limit(1);

  return metersQuantity[0]?.quantity;
}

export async function getLastRecordId({
  transformerSubstationId,
  type
}: LastQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({ id: ElectricityMetersTable.id })
    .from(ElectricityMetersTable)
    .where(and(
      eq(ElectricityMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(ElectricityMetersTable.type, type)
    ))
    .orderBy(desc(ElectricityMetersTable.date))
    .limit(1);

  return recordId[0]?.id;
}

export async function updateRecordOnId({
  id, quantity
}: UpdateOnIdType) {
  const updated_at = new Date();

  await db
    .update(ElectricityMetersTable)
    .set({ quantity, updated_at })
    .where(
      eq(ElectricityMetersTable.id, id),
    );
}

export async function selectMetersOnDate ({
  type,
  date,
  transformerSubstationId
}: CheckRecordValues) {
  const record = await db
    .select({
      quantity: ElectricityMetersTable.quantity
    })
    .from(ElectricityMetersTable)
    .where(and(
      eq(ElectricityMetersTable.transformerSubstationId,
        transformerSubstationId),
      lte(ElectricityMetersTable.date, date),
      eq(ElectricityMetersTable.type, type)
    ))
    .orderBy(desc(ElectricityMetersTable.date))
    .limit(1);

  return record[0]?.quantity ?? 0;
}

export async function getNewMetersIds({
  type,
  date,
  transformerSubstationId
}: CheckRecordValues) {
  const ids = await db
    .select({ id: ElectricityMetersTable.id })
    .from(ElectricityMetersTable)
    .where(and(
      gt(ElectricityMetersTable.date, date),
      eq(ElectricityMetersTable.type, type),
      eq(ElectricityMetersTable.transformerSubstationId,
        transformerSubstationId)
    ));

  return ids;
}

type QuantityForInsert = {
  transformerSubstationId: number;
  type: BalanceType;
  date: string;
};

export async function getQuantityForInsert ({
  transformerSubstationId,
  date,
  type
}: QuantityForInsert) {
  const record = await db
    .select({
      quantity: ElectricityMetersTable.quantity
    })
    .from(ElectricityMetersTable)
    .where(and(
      eq(ElectricityMetersTable.transformerSubstationId,
        transformerSubstationId),
      eq(ElectricityMetersTable.type, type),
      lt(ElectricityMetersTable.date, date)
    ))
    .orderBy(desc(ElectricityMetersTable.date))
    .limit(1);

  return record[0]?.quantity ?? 0;
}

export async function getQuantityOnID(id: number) {
  const record = await db
    .select({ quantity: ElectricityMetersTable.quantity })
    .from(ElectricityMetersTable)
    .where(eq(
      ElectricityMetersTable.id, id
    ));

  return record[0].quantity;
}
