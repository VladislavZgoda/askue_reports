import { db } from "../db";
import { NotInSystem } from "../schema";
import type {
  MetersValues,
  CheckRecordValues,
  LastQuantity,
  UpdateOnIdType
} from "~/types";
import { eq, and, desc } from "drizzle-orm";

export const insertNotInSystem = async ({
  quantity,
  type,
  date,
  transformerSubstationId
}: MetersValues) => {
  await db
    .insert(NotInSystem)
    .values({
      quantity,
      type,
      date,
      transformerSubstationId
    });
};

export const updateNotInSystem = async ({
  quantity,
  type,
  date,
  transformerSubstationId
}: MetersValues) => {
  const updated_at = new Date();

  await db
    .update(NotInSystem)
    .set({ quantity, updated_at })
    .where(
      and(
        eq(NotInSystem.transformerSubstationId,
          transformerSubstationId),
        eq(NotInSystem.date, date),
        eq(NotInSystem.type, type)
      )
    );
};

export const checkNotInSystem = async ({
  type,
  date,
  transformerSubstationId
}: CheckRecordValues): Promise<number | undefined> => {
  const record = await db
    .select({
      quantity: NotInSystem.quantity
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId,
          transformerSubstationId),
        eq(NotInSystem.date, date),
        eq(NotInSystem.type, type)
      )
    );

  return record[0]?.quantity;
};

export const selectLastNotInSystem = async ({
  transformerSubstationId,
  type
}: LastQuantity): Promise<number | undefined> => {
  const record = await db
    .select({
      quantity: NotInSystem.quantity
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId,
          transformerSubstationId),
        eq(NotInSystem.type, type)
      )
    )
    .orderBy(desc(NotInSystem.date))
    .limit(1);

  return record[0]?.quantity;
};

export const getLastNotInSystemId = async({
  transformerSubstationId,
  type
}: LastQuantity): Promise<number | undefined> => {
  const recordId = await db
    .select({
      id: NotInSystem.id
    })
    .from(NotInSystem)
    .where(
      and(
        eq(NotInSystem.transformerSubstationId,
          transformerSubstationId),
        eq(NotInSystem.type, type)
      )
    )
    .orderBy(desc(NotInSystem.date))
    .limit(1);

  return recordId[0]?.id;
};

export const updateNotInSystemOnId = async ({
  id, quantity
 }: UpdateOnIdType) => {
  const updated_at = new Date();

  await db
    .update(NotInSystem)
    .set({ quantity, updated_at })
    .where(
      eq(NotInSystem.id, id)
    );
};
