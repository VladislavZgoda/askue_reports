import { db } from "../db";
import { NotInSystem } from "../schema";
import type {
  MetersValues,
  CheckRecordValues,
  LastQuantity,
  UpdateOnIdType,
  QuantityForInsert,
} from "~/types";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

export async function insertNotInSystem({
  quantity,
  type,
  date,
  transformerSubstationId,
}: MetersValues) {
  await db.insert(NotInSystem).values({
    quantity,
    type,
    date,
    transformerSubstationId,
  });
}

export async function updateNotInSystem({
  quantity,
  type,
  date,
  transformerSubstationId,
}: MetersValues) {
  const updated_at = new Date();

  await db
    .update(NotInSystem)
    .set({ quantity, updated_at })
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        eq(NotInSystem.date, date),
        eq(NotInSystem.type, type),
      ),
    );
}

export async function checkNotInSystem({
  type,
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
        eq(NotInSystem.type, type),
      ),
    );

  return record[0]?.quantity;
}

export async function selectLastNotInSystem({
  transformerSubstationId,
  type,
}: LastQuantity): Promise<number | undefined> {
  const record = await db
    .select({
      quantity: NotInSystem.quantity,
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        eq(NotInSystem.type, type),
      ),
    )
    .orderBy(desc(NotInSystem.date))
    .limit(1);

  return record[0]?.quantity;
}

export async function getLastNotInSystemId({
  transformerSubstationId,
  type,
}: LastQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({
      id: NotInSystem.id,
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        eq(NotInSystem.type, type),
      ),
    )
    .orderBy(desc(NotInSystem.date))
    .limit(1);

  return recordId[0]?.id;
}

export async function updateNotInSystemOnId({ id, quantity }: UpdateOnIdType) {
  const updated_at = new Date();

  await db
    .update(NotInSystem)
    .set({ quantity, updated_at })
    .where(eq(NotInSystem.id, id));
}

export async function selectNotInSystemOnDate({
  type,
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
        eq(NotInSystem.type, type),
      ),
    )
    .orderBy(desc(NotInSystem.date))
    .limit(1);

  return record[0]?.quantity ?? 0;
}

export async function getNotInSystemIds({
  type,
  date,
  transformerSubstationId,
}: CheckRecordValues) {
  const ids = await db
    .select({ id: NotInSystem.id })
    .from(NotInSystem)
    .where(
      and(
        gt(NotInSystem.date, date),
        eq(NotInSystem.type, type),
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
      ),
    );

  return ids;
}

export async function getNotInSystemForInsert({
  transformerSubstationId,
  date,
  type,
}: QuantityForInsert) {
  const record = await db
    .select({
      quantity: NotInSystem.quantity,
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId, transformerSubstationId),
        eq(NotInSystem.type, type),
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
