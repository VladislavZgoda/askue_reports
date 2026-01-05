import {
  findLatestMeterCountsId,
  createMeterCountsRecord,
  updateMeterCountsRecord,
} from "~/.server/db-queries/meter-counts";

import {
  getLatestYearlyInstallationId,
  createYearlyMeterInstallation,
  updateYearlyInstallationRecordById,
} from "~/.server/db-queries/yearly-meter-installations";

import {
  getLatestMonthlyInstallationId,
  createMonthlyInstallationRecord,
  updateMonthlyInstallationRecordById,
} from "~/.server/db-queries/monthly-meter-installations";

import { db } from "~/.server/db";
import { getBatchedSubstationMeterReports } from "~/.server/db-queries/transformer-substations";
import { cutOutMonth, cutOutYear } from "~/utils/date-functions";
import { validateInstallationParams } from "~/utils/installation-params";

import type { BillingFormData } from "../../validation/billing-form.schema";

type BillingMetersParams = BillingFormData & { substationId: number };

/**
 * Coordinates atomic upsert of all billing meter records
 *
 * @remarks
 *   Performs in a single transaction:
 *
 *   1. Upserts registered/unregistered meter aggregates
 *   2. Upserts yearly installation records
 *   3. Upserts monthly installation records
 *
 *   Only updates records when values actually change
 * @example
 *   await upsertBillingMeterRecords({
 *     substationId: 42,
 *     balanceGroup: "ЮР П2",
 *     totalCount: 15,
 *     registeredCount: 12,
 *     // ... other params
 *   });
 *
 * @param params - Billing meter data
 * @param params.totalCount - Total meters installed
 * @param params.registeredCount - Meters registered in system
 * @param params.yearlyTotalInstalled - Yearly installed meters
 * @param params.yearlyRegisteredCount - Yearly registered meters
 * @param params.monthlyTotalInstalled - Monthly installed meters
 * @param params.monthlyRegisteredCount - Monthly registered meters
 * @param params.balanceGroup - Balance group category
 * @param params.substationId - Associated substation ID
 */
export default async function upsertBillingMeterRecords(
  params: BillingMetersParams,
): Promise<void> {
  const {
    totalCount,
    registeredCount,
    yearlyTotalInstalled,
    yearlyRegisteredCount,
    monthlyTotalInstalled,
    monthlyRegisteredCount,
    balanceGroup,
    substationId,
  } = params;

  const currentDate = new Date().toLocaleDateString("en-CA");
  const year = cutOutYear(currentDate);
  const month = cutOutMonth(currentDate);

  await db.transaction(async (tx) => {
    const existingStats = await getBatchedSubstationMeterReports(tx, {
      substationId,
      targetYear: year,
      targetMonth: month,
      balanceGroups: [balanceGroup],
    });

    const meterReport = existingStats[balanceGroup];

    await Promise.all([
      processMeterCountUpdate(tx, {
        totalCount,
        registeredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        existingRegistered: meterReport.registeredMeters,
        existingUnregistered: meterReport.unregisteredMeters,
      }),
      upsertYearlyInstallationRecord(tx, {
        newTotal: yearlyTotalInstalled,
        newRegistered: yearlyRegisteredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        year,
        existingStats: meterReport.yearlyInstallation,
      }),
      upsertMonthlyInstallationRecord(tx, {
        newTotal: monthlyTotalInstalled,
        newRegistered: monthlyRegisteredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        month,
        year,
        existingStats: meterReport.monthlyInstallation,
      }),
    ]);
  });
}

interface MeterCountParams {
  totalCount: number;
  registeredCount: number;
  substationId: number;
  balanceGroup: BalanceGroup;
  date: string;
  existingRegistered: number;
  existingUnregistered: number;
}

/**
 * Processes aggregated meter data to update or create meter count records
 *
 * Takes aggregated meter data (total and registered counts) and ensures the
 * corresponding meter counts record exists and is up-to-date. Calculates
 * unregistered count from total, finds the latest record, and decides whether
 * to update it or create a new one based on comparison with existing counts.
 *
 * @param executor - Database executor for transactional operations
 * @param params - Aggregated meter data and context
 * @param params.totalCount - Total number of meters (registered + unregistered)
 * @param params.registeredCount - Number of registered meters
 * @param params.substationId - Transformer substation identifier
 * @param params.balanceGroup - Balance group identifier
 * @param params.date - Date for the record (as string)
 * @param params.existingRegistered - Current registered count in the latest
 *   record
 * @param params.existingUnregistered - Current unregistered count in the latest
 *   record
 * @throws {Error} If registeredCount exceeds totalCount
 */
async function processMeterCountUpdate(
  executor: Executor,
  params: MeterCountParams,
): Promise<void> {
  const {
    totalCount,
    registeredCount,
    substationId,
    balanceGroup,
    date,
    existingRegistered,
    existingUnregistered,
  } = params;

  validateInstallationParams({
    totalInstalled: totalCount,
    registeredCount,
  });

  const unregisteredCount = totalCount - registeredCount;

  const latestMeterCountsId = await findLatestMeterCountsId(
    executor,
    balanceGroup,
    substationId,
  );

  await upsertMeterCountsRecord(executor, {
    latestRecordId: latestMeterCountsId,
    newRegistered: registeredCount,
    newUnregistered: unregisteredCount,
    existingRegistered: existingRegistered,
    existingUnregistered: existingUnregistered,
    balanceGroup,
    date,
    substationId,
  });
}

interface MeterCountsUpsertParams {
  latestRecordId: number | undefined;
  newRegistered: number;
  newUnregistered: number;
  existingRegistered: number;
  existingUnregistered: number;
  balanceGroup: BalanceGroup;
  date: string;
  substationId: number;
}

/**
 * Updates or creates a meter counts record based on comparison with existing
 * data
 *
 * Compares new counts with existing counts and:
 *
 * 1. If a latestRecordId exists AND counts differ → Updates the existing record
 * 2. If no latestRecordId exists → Creates a new record
 * 3. If counts are identical → No action (idempotent)
 *
 * @param executor - Database executor
 * @param params - Parameters for update/create decision
 * @param params.latestRecordId - ID of most recent existing record, or
 *   undefined
 * @param params.newRegistered - New registered count to apply
 * @param params.newUnregistered - New unregistered count to apply
 * @param params.existingRegistered - Current registered count (for comparison)
 * @param params.existingUnregistered - Current unregistered count (for
 *   comparison)
 * @param params.balanceGroup - Balance group identifier
 * @param params.date - Date for the record
 * @param params.substationId - Transformer substation identifier
 */
async function upsertMeterCountsRecord(
  executor: Executor,
  params: MeterCountsUpsertParams,
): Promise<void> {
  const {
    latestRecordId,
    newRegistered,
    newUnregistered,
    existingRegistered,
    existingUnregistered,
    balanceGroup,
    date,
    substationId,
  } = params;

  if (latestRecordId) {
    if (
      existingRegistered !== newRegistered ||
      existingUnregistered !== newUnregistered
    ) {
      await updateMeterCountsRecord(executor, {
        id: latestRecordId,
        registeredCount: newRegistered,
        unregisteredCount: newUnregistered,
      });
    }
  } else {
    await createMeterCountsRecord(executor, {
      registeredCount: newRegistered,
      unregisteredCount: newUnregistered,
      balanceGroup,
      date,
      substationId,
    });
  }
}

interface YearlyInstallationUpsertParams {
  newTotal: number;
  newRegistered: number;
  balanceGroup: BalanceGroup;
  substationId: number;
  date: string;
  year: number;
  existingStats: {
    totalInstalled: number;
    registeredCount: number;
  };
}

/**
 * Upserts yearly installation record
 *
 * @param executor - Database executor
 * @param params - Upsert parameters
 * @note Only updates if values changed
 */
async function upsertYearlyInstallationRecord(
  executor: Executor,
  params: YearlyInstallationUpsertParams,
): Promise<void> {
  const {
    newTotal,
    newRegistered,
    existingStats,
    balanceGroup,
    substationId,
    date,
    year,
  } = params;

  const latestRecordId = await getLatestYearlyInstallationId(executor, {
    balanceGroup,
    substationId,
    year,
  });

  if (latestRecordId) {
    const valuesChanged =
      newTotal !== existingStats.totalInstalled ||
      newRegistered !== existingStats.registeredCount;

    if (valuesChanged) {
      await updateYearlyInstallationRecordById(executor, {
        id: latestRecordId,
        totalInstalled: newTotal,
        registeredCount: newRegistered,
      });
    }
  } else {
    await createYearlyMeterInstallation(executor, {
      totalInstalled: newTotal,
      registeredCount: newRegistered,
      substationId,
      date,
      balanceGroup,
      year,
    });
  }
}

interface MonthlyInstallationUpsertParams {
  newTotal: number;
  newRegistered: number;
  balanceGroup: BalanceGroup;
  substationId: number;
  date: string;
  month: string;
  year: number;
  existingStats: {
    totalInstalled: number;
    registeredCount: number;
  };
}

/**
 * Upserts monthly installation record
 *
 * @param executor - Database executor
 * @param params - Upsert parameters
 * @note Only updates if values changed
 */
async function upsertMonthlyInstallationRecord(
  executor: Executor,
  params: MonthlyInstallationUpsertParams,
): Promise<void> {
  const {
    newTotal,
    newRegistered,
    existingStats,
    balanceGroup,
    substationId,
    date,
    month,
    year,
  } = params;

  const latestRecordId = await getLatestMonthlyInstallationId(executor, {
    balanceGroup,
    substationId,
    month,
    year,
  });

  if (latestRecordId) {
    const valuesChanged =
      newTotal !== existingStats.totalInstalled ||
      newRegistered !== existingStats.registeredCount;

    if (valuesChanged) {
      await updateMonthlyInstallationRecordById(executor, {
        id: latestRecordId,
        totalInstalled: newTotal,
        registeredCount: newRegistered,
      });
    }
  } else {
    await createMonthlyInstallationRecord(executor, {
      totalInstalled: newTotal,
      registeredCount: newRegistered,
      balanceGroup,
      substationId,
      date,
      month,
      year,
    });
  }
}
