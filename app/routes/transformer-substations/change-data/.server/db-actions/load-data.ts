import { getBatchedSubstationMeterReports } from "~/.server/db-queries/transformerSubstations";

type MeterReport = Awaited<
  ReturnType<typeof getBatchedSubstationMeterReports>
>["Быт"];

/**
 * Retrieves batched meter reports for specified balance groups of a substation
 *
 * @param substationId - ID of the substation to retrieve data for
 * @param balanceGroups - Array of balance groups to include
 * @returns Promise resolving to an object keyed by balance group with meter reports
 */
export default function loadAllSubstationMeterReports<
  Groups extends BalanceGroup,
>(
  substationId: number,
  balanceGroups: readonly Groups[],
): Promise<Record<Groups, MeterReport>> {
  const currentDate = new Date();
  const targetYear = currentDate.getFullYear();
  const targetMonth = String(currentDate.getMonth() + 1).padStart(2, "0");

  return getBatchedSubstationMeterReports({
    substationId,
    targetMonth,
    targetYear,
    balanceGroups,
  });
}
