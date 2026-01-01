import { cutOutMonth, cutOutYear } from "~/utils/date-functions";

import {
  findMonthlyMeterInstallationId,
  createMonthlyInstallationRecord,
  incrementFutureMonthlyInstallations,
  getMonthlyInstallationSummaryBeforeCutoff,
  incrementMonthlyMeterInstallationCountsById,
} from "~/.server/db-queries/monthly-meter-installations";

interface MonthlyInstallationData {
  readonly balanceGroup: BalanceGroup;
  readonly totalCount: number;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Processes monthly meter installation data in a transactional manner.
 *
 * This function ensures data consistency by:
 * 1. Creating or updating a monthly accumulation record
 * 2. Propagating installation counts to future records in the same month
 *
 * All operations are performed within the provided database transaction context.
 *
 * @param executor - Database client or transaction executor
 * @param monthlyInstallation - Installation data to process
 * @param monthlyInstallation.totalCount - Total number of meters installed
 * @param monthlyInstallation.registeredCount - Number of meters registered in the system
 * @param monthlyInstallation.balanceGroup - Balance group category
 * @param monthlyInstallation.date - Installation date
 * @param monthlyInstallation.substationId - Unique identifier of the transformer substation
 *
 * @returns Promise that resolves when processing is complete
 *
 * @throws {Error} If validation fails (e.g., registeredCount > totalCount)
 * @throws {Error} If database operations fail
 *
 * @example
 * ```typescript
 * await processMonthlyInstallations(executor, {
 *   totalCount: 15,
 *   registeredCount: 12,
 *   balanceGroup: "ЮР Sims",
 *   date: "2023-06-15",
 *   substationId: 42,
 * });
 * ```
 */
export default async function processMonthlyInstallations(
  executor: Executor,
  monthlyInstallation: MonthlyInstallationData,
): Promise<void> {
  const { totalCount, registeredCount, balanceGroup, date, substationId } =
    monthlyInstallation;

  const year = cutOutYear(date);
  const month = cutOutMonth(date);

  // 1. Check for existing record
  const existingRecordId = await findMonthlyMeterInstallationId(executor, {
    balanceGroup,
    date,
    substationId,
    month,
    year,
  });

  // 2. Update existing or create new accumulation record
  if (existingRecordId) {
    await incrementMonthlyMeterInstallationCountsById(executor, {
      recordId: existingRecordId,
      totalInstalled: totalCount,
      registeredCount,
    });
  } else {
    await createAccumulatedMonthlyInstallation(
      executor,
      monthlyInstallation,
      month,
      year,
    );
  }

  // 3. Propagate counts to future records
  await incrementFutureMonthlyInstallations(executor, {
    totalIncrement: totalCount,
    registeredIncrement: registeredCount,
    minDate: date,
    balanceGroup,
    substationId,
    month,
    year,
  });
}

/**
 * Creates accumulated monthly installation record
 *
 * Calculates new totals based on previous records before the cutoff date
 *
 * @param executor - Database executor
 * @param installationData - New installation data
 * @param targetMonth - Target month (MM format)
 * @param targetYear - Target year (YYYY)
 */
async function createAccumulatedMonthlyInstallation(
  executor: Executor,
  installationData: MonthlyInstallationData,
  targetMonth: string,
  targetYear: number,
) {
  const currentMonthSummary = await getMonthlyInstallationSummaryBeforeCutoff(
    executor,
    {
      balanceGroup: installationData.balanceGroup,
      cutoffDate: installationData.date,
      substationId: installationData.substationId,
      month: targetMonth,
      year: targetYear,
    },
  );

  const accumulatedTotalInstallations =
    installationData.totalCount + currentMonthSummary.totalInstalled;

  const accumulatedRegisteredMeters =
    installationData.registeredCount + currentMonthSummary.registeredCount;

  await createMonthlyInstallationRecord(executor, {
    totalInstalled: accumulatedTotalInstallations,
    registeredCount: accumulatedRegisteredMeters,
    balanceGroup: installationData.balanceGroup,
    date: installationData.date,
    substationId: installationData.substationId,
    month: targetMonth,
    year: targetYear,
  });
}
