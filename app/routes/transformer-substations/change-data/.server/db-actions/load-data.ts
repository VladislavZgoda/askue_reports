import { getLatestSubstationMeterReport } from "~/.server/db-queries/transformerSubstations";

type MeterReport = ReturnType<typeof getLatestSubstationMeterReport>;

/**
 * Fetches the latest meter report for a substation in the current period
 *
 * @param substationId - ID of the substation to retrieve data for
 * @param balanceGroup - Balance group category to filter by
 * @returns Promise resolving to the latest meter report
 *
 * @example
 * const report = await fetchCurrentSubstationMeterReport(42, 'ЮР П2');
 */
export default function fetchCurrentSubstationMeterReport(
  substationId: number,
  balanceGroup: BalanceGroup,
): MeterReport {
  const currentDate = new Date();
  const targetYear = currentDate.getFullYear();
  const targetMonth = String(currentDate.getMonth() + 1).padStart(2, "0");

  return getLatestSubstationMeterReport({
    balanceGroup,
    substationId,
    targetMonth,
    targetYear,
  });
}
