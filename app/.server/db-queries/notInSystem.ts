import { db } from "../db";
import { notInSystem } from "../schema";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

export async function insertNotInSystem({
  quantity,
  balanceGroup,
  date,
  transformerSubstationId,
}: MetersValues) {
  await db.insert(notInSystem).values({
    quantity,
    balanceGroup,
    date,
    transformerSubstationId,
  });
}

export async function updateNotInSystem({
  quantity,
  balanceGroup,
  date,
  transformerSubstationId,
}: MetersValues) {
  const updatedAt = new Date();

  await db
    .update(notInSystem)
    .set({ quantity, updatedAt })
    .where(
      and(
        eq(notInSystem.transformerSubstationId, transformerSubstationId),
        eq(notInSystem.date, date),
        eq(notInSystem.balanceGroup, balanceGroup),
      ),
    );
}

export async function checkNotInSystem({
  balanceGroup,
  date,
  transformerSubstationId,
}: CheckRecordValues): Promise<number | undefined> {
  const record = await db
    .select({
      quantity: notInSystem.quantity,
    })
    .from(notInSystem)
    .where(
      and(
        eq(notInSystem.transformerSubstationId, transformerSubstationId),
        eq(notInSystem.date, date),
        eq(notInSystem.balanceGroup, balanceGroup),
      ),
    );

  return record[0]?.quantity;
}

export async function selectLastNotInSystem({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const record = await db
    .select({
      quantity: notInSystem.quantity,
    })
    .from(notInSystem)
    .where(
      and(
        eq(notInSystem.transformerSubstationId, transformerSubstationId),
        eq(notInSystem.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(notInSystem.date))
    .limit(1);

  return record[0]?.quantity;
}

export async function getLastNotInSystemId({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({
      id: notInSystem.id,
    })
    .from(notInSystem)
    .where(
      and(
        eq(notInSystem.transformerSubstationId, transformerSubstationId),
        eq(notInSystem.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(notInSystem.date))
    .limit(1);

  return recordId[0]?.id;
}

export async function updateNotInSystemOnId({ id, quantity }: UpdateOnIdType) {
  const updatedAt = new Date();

  await db
    .update(notInSystem)
    .set({ quantity, updatedAt })
    .where(eq(notInSystem.id, id));
}

export async function selectNotInSystemOnDate({
  balanceGroup,
  date,
  transformerSubstationId,
}: CheckRecordValues) {
  const record = await db
    .select({
      quantity: notInSystem.quantity,
    })
    .from(notInSystem)
    .where(
      and(
        eq(notInSystem.transformerSubstationId, transformerSubstationId),
        lte(notInSystem.date, date),
        eq(notInSystem.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(notInSystem.date))
    .limit(1);

  return record[0]?.quantity ?? 0;
}

export async function getNotInSystemIds({
  balanceGroup,
  date,
  transformerSubstationId,
}: CheckRecordValues) {
  const ids = await db
    .select({ id: notInSystem.id })
    .from(notInSystem)
    .where(
      and(
        gt(notInSystem.date, date),
        eq(notInSystem.balanceGroup, balanceGroup),
        eq(notInSystem.transformerSubstationId, transformerSubstationId),
      ),
    );

  return ids;
}

export async function getNotInSystemForInsert({
  transformerSubstationId,
  date,
  balanceGroup,
}: QuantityForInsert) {
  const record = await db
    .select({
      quantity: notInSystem.quantity,
    })
    .from(notInSystem)
    .where(
      and(
        eq(notInSystem.transformerSubstationId, transformerSubstationId),
        eq(notInSystem.balanceGroup, balanceGroup),
        lt(notInSystem.date, date),
      ),
    )
    .orderBy(desc(notInSystem.date))
    .limit(1);

  return record[0]?.quantity ?? 0;
}

export async function getNotInSystemOnID(id: number) {
  const record = await db
    .select({ quantity: notInSystem.quantity })
    .from(notInSystem)
    .where(eq(notInSystem.id, id));

  return record[0].quantity;
}
