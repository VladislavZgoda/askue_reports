import { db } from "../db";
import { NotInSystem } from "../schema";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

export async function insertNotInSystem({
  quantity,
  balanceGroup,
  date,
  transformerSubstationId,
}: MetersValues) {
  await db.insert(NotInSystem).values({
    quantity,
    type: balanceGroup,
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
    .update(NotInSystem)
    .set({ quantity, updatedAt })
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        eq(NotInSystem.date, date),
        eq(NotInSystem.type, balanceGroup),
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
      quantity: NotInSystem.quantity,
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        eq(NotInSystem.date, date),
        eq(NotInSystem.type, balanceGroup),
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
      quantity: NotInSystem.quantity,
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        eq(NotInSystem.type, balanceGroup),
      ),
    )
    .orderBy(desc(NotInSystem.date))
    .limit(1);

  return record[0]?.quantity;
}

export async function getLastNotInSystemId({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({
      id: NotInSystem.id,
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        eq(NotInSystem.type, balanceGroup),
      ),
    )
    .orderBy(desc(NotInSystem.date))
    .limit(1);

  return recordId[0]?.id;
}

export async function updateNotInSystemOnId({ id, quantity }: UpdateOnIdType) {
  const updatedAt = new Date();

  await db
    .update(NotInSystem)
    .set({ quantity, updatedAt })
    .where(eq(NotInSystem.id, id));
}

export async function selectNotInSystemOnDate({
  balanceGroup,
  date,
  transformerSubstationId,
}: CheckRecordValues) {
  const record = await db
    .select({
      quantity: NotInSystem.quantity,
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        lte(NotInSystem.date, date),
        eq(NotInSystem.type, balanceGroup),
      ),
    )
    .orderBy(desc(NotInSystem.date))
    .limit(1);

  return record[0]?.quantity ?? 0;
}

export async function getNotInSystemIds({
  balanceGroup,
  date,
  transformerSubstationId,
}: CheckRecordValues) {
  const ids = await db
    .select({ id: NotInSystem.id })
    .from(NotInSystem)
    .where(
      and(
        gt(NotInSystem.date, date),
        eq(NotInSystem.type, balanceGroup),
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
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
      quantity: NotInSystem.quantity,
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        eq(NotInSystem.type, balanceGroup),
        lt(NotInSystem.date, date),
      ),
    )
    .orderBy(desc(NotInSystem.date))
    .limit(1);

  return record[0]?.quantity ?? 0;
}

export async function getNotInSystemOnID(id: number) {
  const record = await db
    .select({ quantity: NotInSystem.quantity })
    .from(NotInSystem)
    .where(eq(NotInSystem.id, id));

  return record[0].quantity;
}
