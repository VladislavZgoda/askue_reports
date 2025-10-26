import { getAllMeterCountsForSubstation } from "~/.server/db-queries/transformer-substations";
import { getTechnicalMeterStatsForSubstation } from "~/.server/db-queries/technical-meters";

type TechnicalMeterStats = NonNullable<
  Awaited<ReturnType<typeof getTechnicalMeterStatsForSubstation>>
>;

type SubstationMeterSummary = Awaited<
  ReturnType<typeof getAllMeterCountsForSubstation>
> & { technicalMeters: TechnicalMeterStats };

/**
 * Retrieves a comprehensive meter summary for a substation including all
 * balance groups and technical meter statistics
 *
 * @example
 *   const summary = await getSubstationMeterSummary({
 *     privateDate: "2025-08-24",
 *     legalDate: "2025-08-20",
 *     odpuDate: "2025-08-24",
 *     substationId: 42,
 *   });
 *
 * @param params - Query parameters
 * @param params.privateDate - Cutoff date for household meters (YYYY-MM-DD)
 * @param params.legalDate - Cutoff date for commercial meters (YYYY-MM-DD)
 * @param params.odpuDate - Cutoff date for ODPU meters (YYYY-MM-DD)
 * @param params.substationId - Substation ID
 * @returns Combined meter counts and technical statistics
 */
export default async function getSubstationMeterSummary({
  privateDate,
  legalDate,
  odpuDate,
  substationId,
}: SubstationMeterDataParams): Promise<SubstationMeterSummary> {
  const [meterCounts, technicalMeters] = await Promise.all([
    getAllMeterCountsForSubstation({
      privateDate,
      legalDate,
      odpuDate,
      substationId,
    }),
    getTechnicalMeterStats(substationId),
  ]);

  return {
    ...meterCounts,
    technicalMeters,
  };
}

async function getTechnicalMeterStats(
  substationId: number,
): Promise<TechnicalMeterStats> {
  const stats = await getTechnicalMeterStatsForSubstation(substationId);

  return {
    quantity: stats?.quantity ?? 0,
    underVoltage: stats?.underVoltage ?? 0,
  };
}
