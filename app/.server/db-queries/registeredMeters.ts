import { db } from "../db";
import { registeredMeters } from "../schema";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

interface MetersQuery {
  registeredMeterCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  transformerSubstationId: number;
}

export async function insertNewMeters({
  registeredMeterCount,
  balanceGroup,
  date,
  transformerSubstationId,
}: MetersQuery) {
  await db.insert(registeredMeters).values({
    registeredMeterCount,
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
      registeredMeterCount: registeredMeters.registeredMeterCount,
    })
    .from(registeredMeters)
    .where(
      and(
        eq(registeredMeters.transformerSubstationId, transformerSubstationId),
        eq(registeredMeters.date, date),
        eq(registeredMeters.balanceGroup, balanceGroup),
      ),
    );

  return record[0]?.registeredMeterCount;
}

export async function updateMetersRecord({
  registeredMeterCount,
  balanceGroup,
  date,
  transformerSubstationId,
}: MetersQuery) {
  const updatedAt = new Date();

  await db
    .update(registeredMeters)
    .set({ registeredMeterCount, updatedAt })
    .where(
      and(
        eq(registeredMeters.transformerSubstationId, transformerSubstationId),
        eq(registeredMeters.date, date),
        eq(registeredMeters.balanceGroup, balanceGroup),
      ),
    );
}

export async function selectLastQuantity({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const metersQuantity = await db
    .select({
      registeredMeterCount: registeredMeters.registeredMeterCount,
    })
    .from(registeredMeters)
    .where(
      and(
        eq(registeredMeters.transformerSubstationId, transformerSubstationId),
        eq(registeredMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(registeredMeters.date))
    .limit(1);

  return metersQuantity[0]?.registeredMeterCount;
}

export async function getLastRecordId({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({ id: registeredMeters.id })
    .from(registeredMeters)
    .where(
      and(
        eq(registeredMeters.transformerSubstationId, transformerSubstationId),
        eq(registeredMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(registeredMeters.date))
    .limit(1);

  return recordId[0]?.id;
}

interface UpdateOnId {
  id: number;
  registeredMeterCount: number;
}

export async function updateRecordOnId({
  id,
  registeredMeterCount,
}: UpdateOnId) {
  const updatedAt = new Date();

  await db
    .update(registeredMeters)
    .set({ registeredMeterCount, updatedAt })
    .where(eq(registeredMeters.id, id));
}

export async function getRegisteredMeterCountAtDate({
  balanceGroup,
  targetDate,
  dateComparison,
  transformerSubstationId,
}: MeterCountQueryParams) {
  const result = await db.query.registeredMeters.findFirst({
    columns: {
      registeredMeterCount: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.transformerSubstationId, transformerSubstationId),
      dateComparison === "before"
        ? lt(registeredMeters.date, targetDate)
        : lte(registeredMeters.date, targetDate),
    ),
    orderBy: [desc(registeredMeters.date)],
  });

  return result ? result.registeredMeterCount : 0;
}

export async function getNewMetersIds({
  balanceGroup,
  date,
  transformerSubstationId,
}: MeterSelectionCriteria) {
  const ids = await db
    .select({ id: registeredMeters.id })
    .from(registeredMeters)
    .where(
      and(
        gt(registeredMeters.date, date),
        eq(registeredMeters.balanceGroup, balanceGroup),
        eq(registeredMeters.transformerSubstationId, transformerSubstationId),
      ),
    );

  return ids;
}

export async function getQuantityOnID(id: number) {
  const record = await db
    .select({ registeredMeterCount: registeredMeters.registeredMeterCount })
    .from(registeredMeters)
    .where(eq(registeredMeters.id, id));

  return record[0].registeredMeterCount;
}
