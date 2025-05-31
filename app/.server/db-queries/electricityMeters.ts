import { db } from "../db";
import { electricityMeters } from "../schema";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

export async function insertNewMeters({
  quantity,
  balanceGroup,
  date,
  transformerSubstationId,
}: MetersValues) {
  await db.insert(electricityMeters).values({
    quantity,
    balanceGroup,
    date,
    transformerSubstationId,
  });
}

export async function checkMetersRecord({
  balanceGroup,
  date,
  transformerSubstationId,
}: MeterSelectionCriteria): Promise<number | undefined> {
  const record = await db
    .select({
      quantity: electricityMeters.quantity,
    })
    .from(electricityMeters)
    .where(
      and(
        eq(electricityMeters.transformerSubstationId, transformerSubstationId),
        eq(electricityMeters.date, date),
        eq(electricityMeters.balanceGroup, balanceGroup),
      ),
    );

  return record[0]?.quantity;
}

export async function updateMetersRecord({
  quantity,
  balanceGroup,
  date,
  transformerSubstationId,
}: MetersValues) {
  const updatedAt = new Date();

  await db
    .update(electricityMeters)
    .set({ quantity, updatedAt })
    .where(
      and(
        eq(electricityMeters.transformerSubstationId, transformerSubstationId),
        eq(electricityMeters.date, date),
        eq(electricityMeters.balanceGroup, balanceGroup),
      ),
    );
}

export async function selectLastQuantity({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const metersQuantity = await db
    .select({
      quantity: electricityMeters.quantity,
    })
    .from(electricityMeters)
    .where(
      and(
        eq(electricityMeters.transformerSubstationId, transformerSubstationId),
        eq(electricityMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(electricityMeters.date))
    .limit(1);

  return metersQuantity[0]?.quantity;
}

export async function getLastRecordId({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({ id: electricityMeters.id })
    .from(electricityMeters)
    .where(
      and(
        eq(electricityMeters.transformerSubstationId, transformerSubstationId),
        eq(electricityMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(electricityMeters.date))
    .limit(1);

  return recordId[0]?.id;
}

export async function updateRecordOnId({ id, quantity }: UpdateOnIdType) {
  const updatedAt = new Date();

  await db
    .update(electricityMeters)
    .set({ quantity, updatedAt })
    .where(eq(electricityMeters.id, id));
}

export async function selectMetersOnDate({
  balanceGroup,
  date,
  transformerSubstationId,
}: MeterSelectionCriteria) {
  const record = await db
    .select({
      quantity: electricityMeters.quantity,
    })
    .from(electricityMeters)
    .where(
      and(
        eq(electricityMeters.transformerSubstationId, transformerSubstationId),
        lte(electricityMeters.date, date),
        eq(electricityMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(electricityMeters.date))
    .limit(1);

  return record[0]?.quantity ?? 0;
}

export async function getNewMetersIds({
  balanceGroup,
  date,
  transformerSubstationId,
}: MeterSelectionCriteria) {
  const ids = await db
    .select({ id: electricityMeters.id })
    .from(electricityMeters)
    .where(
      and(
        gt(electricityMeters.date, date),
        eq(electricityMeters.balanceGroup, balanceGroup),
        eq(electricityMeters.transformerSubstationId, transformerSubstationId),
      ),
    );

  return ids;
}

export async function getQuantityForInsert({
  transformerSubstationId,
  date,
  balanceGroup,
}: QuantityForInsert) {
  const record = await db
    .select({
      quantity: electricityMeters.quantity,
    })
    .from(electricityMeters)
    .where(
      and(
        eq(electricityMeters.transformerSubstationId, transformerSubstationId),
        eq(electricityMeters.balanceGroup, balanceGroup),
        lt(electricityMeters.date, date),
      ),
    )
    .orderBy(desc(electricityMeters.date))
    .limit(1);

  return record[0]?.quantity ?? 0;
}

export async function getQuantityOnID(id: number) {
  const record = await db
    .select({ quantity: electricityMeters.quantity })
    .from(electricityMeters)
    .where(eq(electricityMeters.id, id));

  return record[0].quantity;
}
