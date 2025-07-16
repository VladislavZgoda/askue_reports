import { db } from "~/.server/db";
import { sql, and, eq, gt, lt, desc, inArray } from "drizzle-orm";
import { unregisteredMeters } from "~/.server/schema";
import * as schema from "app/.server/schema";

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { BillingValidationForm } from "../../validation/billing-form-schema";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { Database } from "~/.server/db";

type Executor =
  | Database
  | PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;

type FormData = BillingValidationForm & { readonly substationId: number };

interface MeterCountQueryParams {
  balanceGroup: UnregisteredMeters["balanceGroup"];
  targetDate: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

async function getUnregisteredMeterCountBeforeCutoff(
  executor: Executor,
  { balanceGroup, targetDate, substationId }: MeterCountQueryParams,
): Promise<number> {
  const result = await executor.query.unregisteredMeters.findFirst({
    columns: {
      unregisteredMeterCount: true,
    },
    where: and(
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
      lt(unregisteredMeters.date, targetDate),
    ),
    orderBy: [desc(unregisteredMeters.date)],
  });

  return result ? result.unregisteredMeterCount : 0;
}

type UnregisteredMeters = typeof unregisteredMeters.$inferSelect;

interface UnregisteredMeterRecordInput {
  unregisteredMeterCount: UnregisteredMeters["unregisteredMeterCount"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  date: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

async function createUnregisteredMeterRecord(
  executor: Executor,
  {
    unregisteredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: UnregisteredMeterRecordInput,
) {
  await executor.insert(unregisteredMeters).values({
    unregisteredMeterCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}

interface AccumulatedUnrecordedInput {
  newUnregisteredCount: UnregisteredMeters["unregisteredMeterCount"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  date: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

async function createAccumulatedUnregisteredRecord(
  executor: Executor,
  {
    newUnregisteredCount,
    balanceGroup,
    date,
    substationId,
  }: AccumulatedUnrecordedInput,
) {
  const currentUnregistered = await getUnregisteredMeterCountBeforeCutoff(
    executor,
    {
      balanceGroup: balanceGroup,
      targetDate: date,
      substationId,
    },
  );

  const accumulatedUnregistered = newUnregisteredCount + currentUnregistered;

  await createUnregisteredMeterRecord(executor, {
    unregisteredMeterCount: accumulatedUnregistered,
    balanceGroup: balanceGroup,
    date: date,
    substationId: substationId,
  });
}

interface UnregisteredMeterRecordInput {
  unregisteredMeterCount: UnregisteredMeters["unregisteredMeterCount"];
  balanceGroup: UnregisteredMeters["balanceGroup"];
  date: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

async function updateUnregisteredMeterRecordByCompositeKey(
  executor: Executor,
  {
    unregisteredMeterCount,
    balanceGroup,
    date,
    substationId,
  }: UnregisteredMeterRecordInput,
) {
  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(unregisteredMeters)
    .set({ unregisteredMeterCount, updatedAt })
    .where(
      and(
        eq(unregisteredMeters.transformerSubstationId, substationId),
        eq(unregisteredMeters.date, date),
        eq(unregisteredMeters.balanceGroup, balanceGroup),
      ),
    )
    .returning();

  if (!updatedRecord) {
    throw new Error("No matching unregistered meter record found");
  }
}

interface UnregisteredMeterQuery {
  balanceGroup: UnregisteredMeters["balanceGroup"];
  substationId: UnregisteredMeters["transformerSubstationId"];
  date: UnregisteredMeters["date"];
}

async function getUnregisteredMeterCount(
  executor: Executor,
  { balanceGroup, substationId, date }: UnregisteredMeterQuery,
): Promise<number | undefined> {
  const result = await executor.query.unregisteredMeters.findFirst({
    columns: {
      unregisteredMeterCount: true,
    },
    where: and(
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
      eq(unregisteredMeters.date, date),
    ),
  });

  return result?.unregisteredMeterCount;
}

interface UnregisteredMeterQueryParams {
  balanceGroup: UnregisteredMeters["balanceGroup"];
  startDate: UnregisteredMeters["date"];
  substationId: UnregisteredMeters["transformerSubstationId"];
}

async function getUnregisteredMeterRecordIdsAfterDate(
  executor: Executor,
  { balanceGroup, startDate, substationId }: UnregisteredMeterQueryParams,
): Promise<number[]> {
  const result = await executor.query.unregisteredMeters.findMany({
    columns: {
      id: true,
    },
    where: and(
      gt(unregisteredMeters.date, startDate),
      eq(unregisteredMeters.balanceGroup, balanceGroup),
      eq(unregisteredMeters.transformerSubstationId, substationId),
    ),
  });

  const transformedResult = result.map((r) => r.id);

  return transformedResult;
}

async function incrementUnregisteredMetersRecords(
  executor: Executor,
  ids: number[],
  newUnregisteredCount: number,
): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await executor
    .update(unregisteredMeters)
    .set({
      unregisteredMeterCount: sql`${unregisteredMeters.unregisteredMeterCount} + ${newUnregisteredCount}`,
      updatedAt: new Date(),
    })
    .where(and(inArray(unregisteredMeters.id, ids)))
    .returning();

  return result.length;
}

export default async function processUnregisteredMeters(formData: FormData) {
  const { totalCount, registeredCount } = formData;
  const newUnregisteredCount = totalCount - registeredCount;

  await db.transaction(async (tx) => {
    // 1. Get current count (transactional)
    const currentUnregistered = await getUnregisteredMeterCount(tx, {
      balanceGroup: formData.balanceGroup,
      substationId: formData.substationId,
      date: formData.date,
    });

    // 2. Update or create accumulation (transactional)
    if (currentUnregistered) {
      await updateUnregisteredMeterRecordByCompositeKey(tx, {
        unregisteredMeterCount: newUnregisteredCount + currentUnregistered,
        balanceGroup: formData.balanceGroup,
        date: formData.date,
        substationId: formData.substationId,
      });
    } else {
      await createAccumulatedUnregisteredRecord(tx, {
        newUnregisteredCount,
        balanceGroup: formData.balanceGroup,
        date: formData.date,
        substationId: formData.substationId,
      });
    }

    // 3. Get future records (transactional)
    const futureRecordIds = await getUnregisteredMeterRecordIdsAfterDate(tx, {
      balanceGroup: formData.balanceGroup,
      startDate: formData.date,
      substationId: formData.substationId,
    });

    // 4. Batch update future records (transactional)
    if (futureRecordIds.length > 0) {
      const updatedCount = await incrementUnregisteredMetersRecords(
        tx,
        futureRecordIds,
        newUnregisteredCount,
      );

      if (updatedCount !== futureRecordIds.length) {
        const failedCount = futureRecordIds.length - updatedCount;
        throw new Error(`Failed to update ${failedCount} records.`);
      }
    }
  });
}
