import { db } from "~/.server/db";
import { sql, and, eq, gt, lt, desc, inArray } from "drizzle-orm";
import { registeredMeters } from "~/.server/schema";
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
type RegisteredMeters = typeof registeredMeters.$inferSelect;

interface MeterCountQueryParams {
  balanceGroup: BalanceGroup;
  targetDate: string;
  dateComparison: "before" | "upTo";
  substationId: number;
}

async function getRegisteredMeterCountAtDate({
  balanceGroup,
  targetDate,
  dateComparison,
  substationId,
}: MeterCountQueryParams) {
  const result = await db.query.registeredMeters.findFirst({
    columns: {
      registeredMeterCount: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.transformerSubstationId, substationId),
      dateComparison === "before"
        ? lt(registeredMeters.date, targetDate)
        : lte(registeredMeters.date, targetDate),
    ),
    orderBy: [desc(registeredMeters.date)],
  });

  return result ? result.registeredMeterCount : 0;
}

interface RegisteredMeterInput {
  registeredMeterCount: RegisteredMeters["registeredMeterCount"];
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

async function createRegisteredMeterRecord({
  registeredMeterCount,
  balanceGroup,
  date,
  substationId,
}: RegisteredMeterInput) {
  await db.insert(registeredMeters).values({
    registeredMeterCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}

interface AccumulatedRegisteredInput {
  newRegisteredCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  substationId: number;
}

async function createAccumulatedRegisteredRecord({
  newRegisteredCount,
  balanceGroup,
  date,
  substationId,
}: AccumulatedRegisteredInput) {
  const currentRegisteredCount = await getRegisteredMeterCountAtDate({
    balanceGroup,
    targetDate: date,
    dateComparison: "before",
    substationId,
  });

  const totalRegistered = newRegisteredCount + currentRegisteredCount;

  await createRegisteredMeterRecord({
    registeredMeterCount: totalRegistered,
    balanceGroup,
    date,
    substationId,
  });
}

interface RegisteredMeterLookupParams {
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

async function getRegisteredMeterCount({
  balanceGroup,
  date,
  substationId,
}: RegisteredMeterLookupParams): Promise<number | undefined> {
  const result = await db.query.registeredMeters.findFirst({
    columns: {
      registeredMeterCount: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.date, date),
      eq(registeredMeters.transformerSubstationId, substationId),
    ),
  });

  return result?.registeredMeterCount;
}

interface RegisteredMeterCountUpdate {
  registeredMeterCount: RegisteredMeters["registeredMeterCount"];
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

async function updateRegisteredMeterCount({
  registeredMeterCount,
  balanceGroup,
  date,
  substationId,
}: RegisteredMeterCountUpdate) {
  const updatedAt = new Date();

  const [updatedRecord] = await db
    .update(registeredMeters)
    .set({ registeredMeterCount, updatedAt })
    .where(
      and(
        eq(registeredMeters.transformerSubstationId, substationId),
        eq(registeredMeters.date, date),
        eq(registeredMeters.balanceGroup, balanceGroup),
      ),
    )
    .returning();

  if (!updatedRecord) {
    throw new Error("No matching registered meter record found to update");
  }
}

interface RegisteredMeterIdsQueryParams {
  balanceGroup: RegisteredMeters["balanceGroup"];
  startDate: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

async function getRegisteredMeterRecordIdsAfterDate({
  balanceGroup,
  startDate,
  substationId,
}: RegisteredMeterIdsQueryParams): Promise<number[]> {
  const result = await db
    .select({ id: registeredMeters.id })
    .from(registeredMeters)
    .where(
      and(
        gt(registeredMeters.date, startDate),
        eq(registeredMeters.balanceGroup, balanceGroup),
        eq(registeredMeters.transformerSubstationId, substationId),
      ),
    );

  const transformedResult = result.map((r) => r.id);

  return transformedResult;
}

export default async function processRegisteredMeters(formData: FormData) {
  const { registeredCount } = formData;

  if (registeredCount > 0) {
    const currentRegisteredCount = await getRegisteredMeterCount({
      balanceGroup: formData.balanceGroup,
      date: formData.date,
      substationId: formData.substationId,
    });

    if (currentRegisteredCount) {
      await updateRegisteredMeterCount({
        registeredMeterCount: formData.totalCount + currentRegisteredCount,
        balanceGroup: formData.balanceGroup,
        date: formData.date,
        substationId: formData.substationId,
      });
    } else {
      await createAccumulatedRegisteredRecord({
        newRegisteredCount: formData.totalCount,
        balanceGroup: formData.balanceGroup,
        date: formData.date,
        substationId: formData.substationId,
      });
    }

    const futureRecordIds = await getRegisteredMeterRecordIdsAfterDate({
      balanceGroup: formData.balanceGroup,
      startDate: formData.date,
      substationId: formData.substationId,
    });

    for (const id of futureRecordIds) {
      const currentCount = await getRegisteredMeterCountByRecordId(id);

      await updateRegisteredMeterRecordById({
        id,
        registeredMeterCount: currentCount + formData.totalCount,
      });
    }
  }
}
