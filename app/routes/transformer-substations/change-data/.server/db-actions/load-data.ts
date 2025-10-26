import { getTechnicalMeterStatsForSubstation } from "~/.server/db-queries/technical-meters";
import { getBatchedSubstationMeterReports } from "~/.server/db-queries/transformer-substations";

import { db } from "~/.server/db";

type MeterReport = Awaited<
  ReturnType<typeof getBatchedSubstationMeterReports>
>["Быт"];

/**
 * Retrieves batched meter reports for specified balance groups of a substation
 *
 * @param substationId - ID of the substation to retrieve data for
 * @param balanceGroups - Array of balance groups to include
 * @returns Promise resolving to an object keyed by balance group with meter
 *   reports
 */
export function loadAllSubstationMeterReports<Groups extends BalanceGroup>(
  substationId: number,
  balanceGroups: readonly Groups[],
): Promise<Record<Groups, MeterReport>> {
  const currentDate = new Date();
  const targetYear = currentDate.getFullYear();
  const targetMonth = String(currentDate.getMonth() + 1).padStart(2, "0");

  return getBatchedSubstationMeterReports(db, {
    substationId,
    targetMonth,
    targetYear,
    balanceGroups,
  });
}

interface TechnicalMeterReport {
  totalCount: number;
  underVoltageCount: number;
}

/**
 * Loads technical meter statistics for a substation
 *
 * @example
 *   const { totalCount, underVoltageCount } = await loadTechnicalMeters(42);
 *
 * @param substationId - ID of the substation to retrieve technical meters for
 * @returns Object containing: totalCount: Total quantity of technical meters
 *   underVoltageCount: Number of meters operating under voltage
 */
export async function loadTechnicalMeters(
  substationId: number,
): Promise<TechnicalMeterReport> {
  const techMeters = await getTechnicalMeterStatsForSubstation(substationId);

  return {
    totalCount: techMeters?.quantity ?? 0,
    underVoltageCount: techMeters?.underVoltage ?? 0,
  };
}
