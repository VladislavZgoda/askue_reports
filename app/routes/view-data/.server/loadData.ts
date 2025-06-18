import { getSubstationMeterCountsAsOfDate } from "~/.server/db-queries/transformerSubstations";

interface CategoryDates {
  privateDate: string;
  legalDate: string;
  odpuDate: string;
}

export default async function fetchMeterCountsByCategory({
  privateDate,
  legalDate,
  odpuDate,
}: CategoryDates) {
  const [
    privateCounts,
    legalSimsCounts,
    legalP2Counts,
    odpuSimsCounts,
    odpuP2Counts,
  ] = await Promise.all([
    getSubstationMeterCountsAsOfDate("Быт", privateDate),
    getSubstationMeterCountsAsOfDate("ЮР Sims", legalDate),
    getSubstationMeterCountsAsOfDate("ЮР П2", legalDate),
    getSubstationMeterCountsAsOfDate("ОДПУ Sims", odpuDate),
    getSubstationMeterCountsAsOfDate("ОДПУ П2", odpuDate),
  ]);

  const combinedLegalCounts = legalSimsCounts.map((substation, i) => ({
    ...substation,
    registeredMeters:
      substation.registeredMeters + legalP2Counts[i].registeredMeters,
    unregisteredMeters:
      substation.unregisteredMeters + legalP2Counts[i].unregisteredMeters,
  }));

  const combinedOdpuCounts = odpuSimsCounts.map((substation, i) => ({
    ...substation,
    registeredMeters:
      substation.registeredMeters + odpuP2Counts[i].registeredMeters,
    unregisteredMeters:
      substation.unregisteredMeters + odpuP2Counts[i].unregisteredMeters,
  }));

  return {
    privateCounts,
    legalCounts: combinedLegalCounts,
    odpuCounts: combinedOdpuCounts,
  } as const;
}
