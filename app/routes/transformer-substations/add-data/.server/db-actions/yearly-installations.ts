import { db } from "~/.server/db";
import { sql, and, eq, gt, lt, desc, inArray } from "drizzle-orm";
import { yearlyMeterInstallations } from "~/.server/schema";
import { cutOutYear } from "~/utils/dateFunctions";
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
type YearlyMeterInstallations = typeof yearlyMeterInstallations.$inferSelect;

interface YearlyMeterInstallationsStatsParams {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  year: YearlyMeterInstallations["year"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
}

async function getYearlyMeterInstallationsStats(
  executor: Executor,
  {
    balanceGroup,
    date,
    substationId,
    year,
  }: YearlyMeterInstallationsStatsParams,
): Promise<
  | {
      totalInstalled: number;
      registeredCount: number;
    }
  | undefined
> {
  const result = await executor.query.yearlyMeterInstallations.findFirst({
    columns: { totalInstalled: true, registeredCount: true },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.date, date),
      eq(yearlyMeterInstallations.year, year),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
    ),
  });

  return result;
}

interface YearlyInstallationSummaryQuery {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  cutoffDate: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

async function getYearlyInstallationSummaryBeforeCutoff(
  executor: Executor,
  {
    balanceGroup,
    cutoffDate,
    substationId,
    year,
  }: YearlyInstallationSummaryQuery,
): Promise<{
  totalInstalled: number;
  registeredCount: number;
}> {
  const result = await executor.query.yearlyMeterInstallations.findFirst({
    columns: { totalInstalled: true, registeredCount: true },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.year, year),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
      lt(yearlyMeterInstallations.date, cutoffDate),
    ),
    orderBy: [desc(yearlyMeterInstallations.date)],
  });

  return result ?? { totalInstalled: 0, registeredCount: 0 };
}

interface YearlyMeterInstallationUpdateParams {
  totalInstalled: YearlyMeterInstallations["totalInstalled"];
  registeredCount: YearlyMeterInstallations["registeredCount"];
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

async function updateYearlyMeterInstallation(
  executor: Executor,
  {
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    substationId,
    year,
  }: YearlyMeterInstallationUpdateParams,
) {
  if (registeredCount > totalInstalled) {
    throw new Error("Registered count cannot exceed total installed");
  }

  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(yearlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(yearlyMeterInstallations.date, date),
        eq(yearlyMeterInstallations.transformerSubstationId, substationId),
        eq(yearlyMeterInstallations.year, year),
      ),
    )
    .returning();

  if (!updatedRecord) {
    throw new Error("Yearly installation record not found");
  }
}

interface YearlyInstallationRecordQuery {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  startDate: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

async function getYearlyInstallationRecordsAfterDate(
  executor: Executor,
  {
    balanceGroup,
    startDate,
    substationId,
    year,
  }: YearlyInstallationRecordQuery,
): Promise<number[]> {
  const result = await executor.query.yearlyMeterInstallations.findMany({
    columns: { id: true },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      gt(yearlyMeterInstallations.date, startDate),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
      eq(yearlyMeterInstallations.year, year),
    ),
  });

  return result.map((r) => r.id);
}

async function incrementYearlyInstallationRecords(
  executor: Executor,
  ids: number[],
  totalIncrement: number,
  registeredIncrement: number,
): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await executor
    .update(yearlyMeterInstallations)
    .set({
      totalInstalled: sql`${yearlyMeterInstallations.totalInstalled} + ${totalIncrement}`,
      registeredCount: sql`${yearlyMeterInstallations.registeredCount} + ${registeredIncrement}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(yearlyMeterInstallations.id, ids),
        sql`${yearlyMeterInstallations.registeredCount} + ${registeredIncrement}
            <= ${yearlyMeterInstallations.totalInstalled} + ${totalIncrement}`,
      ),
    )
    .returning();

  return result.length;
}

interface YearlyMeterInstallationInput {
  totalInstalled: YearlyMeterInstallations["totalInstalled"];
  registeredCount: YearlyMeterInstallations["registeredCount"];
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

async function createYearlyMeterInstallation(
  executor: Executor,
  {
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    substationId,
    year,
  }: YearlyMeterInstallationInput,
) {
  if (registeredCount > totalInstalled) {
    throw new Error("Registered count cannot exceed total installed");
  }

  await executor.insert(yearlyMeterInstallations).values({
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
    year,
  });
}

type YearlyMeterStats = Awaited<
  ReturnType<typeof getYearlyMeterInstallationsStats>
>;

async function updateYearlyMeterAccumulations(
  executor: Executor,
  formData: FormData,
  currentYearStats: NonNullable<YearlyMeterStats>,
  targetYear: number,
) {
  const accumulatedTotalInstallations =
    formData.totalCount + currentYearStats.totalInstalled;
  const accumulatedRegisteredMeters =
    formData.registeredCount + currentYearStats.registeredCount;

  await updateYearlyMeterInstallation(executor, {
    totalInstalled: accumulatedTotalInstallations,
    registeredCount: accumulatedRegisteredMeters,
    balanceGroup: formData.balanceGroup,
    substationId: formData.substationId,
    date: formData.date,
    year: targetYear,
  });
}

async function createAccumulatedYearlyInstallation(
  executor: Executor,
  formData: FormData,
  targetYear: number,
) {
  const currentYearSummary = await getYearlyInstallationSummaryBeforeCutoff(
    executor,
    {
      balanceGroup: formData.balanceGroup,
      cutoffDate: formData.date,
      substationId: formData.substationId,
      year: targetYear,
    },
  );

  const accumulatedTotalInstallations =
    formData.totalCount + currentYearSummary.totalInstalled;
  const accumulatedRegisteredMeters =
    formData.registeredCount + currentYearSummary.registeredCount;

  await createYearlyMeterInstallation(executor, {
    totalInstalled: accumulatedTotalInstallations,
    registeredCount: accumulatedRegisteredMeters,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    substationId: formData.substationId,
    year: targetYear,
  });
}

// ===== Main Processing Function =====
/**
 * Processes yearly meter installation data atomically
 */
export default async function processYearlyInstallations(formData: FormData) {
  const year = cutOutYear(formData.date);

  await db.transaction(async (tx) => {
    // 1. Get current stats (transactional)
    const currentYearStats = await getYearlyMeterInstallationsStats(tx, {
      balanceGroup: formData.balanceGroup,
      date: formData.date,
      substationId: formData.substationId,
      year,
    });

    // 2. Update or create accumulation (transactional)
    if (currentYearStats) {
      await updateYearlyMeterAccumulations(
        tx,
        formData,
        currentYearStats,
        year,
      );
    } else {
      await createAccumulatedYearlyInstallation(tx, formData, year);
    }

    // 3. Get future records (transactional)
    const futureRecordIds = await getYearlyInstallationRecordsAfterDate(tx, {
      balanceGroup: formData.balanceGroup,
      startDate: formData.date,
      substationId: formData.substationId,
      year,
    });

    // 4. Batch update future records (transactional)
    if (futureRecordIds.length > 0) {
      const updatedCount = await incrementYearlyInstallationRecords(
        tx,
        futureRecordIds,
        formData.totalCount,
        formData.registeredCount,
      );

      if (updatedCount !== futureRecordIds.length) {
        const failedCount = futureRecordIds.length - updatedCount;
        throw new Error(
          `Failed to update ${failedCount} records. ` +
            "Update would violate registered_count <= total_installed constraint.",
        );
      }
    }
  });
}
