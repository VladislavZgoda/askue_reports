import { getSubstationMeterCountsAsOfDate } from "~/.server/db-queries/transformerSubstations";

interface CategoryDates {
  privateDate: string;
  legalDate: string;
  odpuDate: string;
}

export default async function getSubstationCategorySummary({
  privateDate,
  legalDate,
  odpuDate,
}: CategoryDates) {
  const [
    privateResults,
    legalSimsResults,
    legalP2Results,
    odpuSimsResults,
    odpuP2Results,
  ] = await Promise.all([
    getSubstationMeterCountsAsOfDate("Быт", privateDate),
    getSubstationMeterCountsAsOfDate("ЮР Sims", legalDate),
    getSubstationMeterCountsAsOfDate("ЮР П2", legalDate),
    getSubstationMeterCountsAsOfDate("ОДПУ Sims", odpuDate),
    getSubstationMeterCountsAsOfDate("ОДПУ П2", odpuDate),
  ]);

  const legalSummary = legalSimsResults.map((substation, i) => ({
    ...substation,
    registeredMeters:
      substation.registeredMeters + legalP2Results[i].registeredMeters,
    unregisteredMeters:
      substation.unregisteredMeters + legalP2Results[i].unregisteredMeters,
  }));

  const odpuSummary = odpuSimsResults.map((substation, i) => ({
    ...substation,
    registeredMeters:
      substation.registeredMeters + odpuP2Results[i].registeredMeters,
    unregisteredMeters:
      substation.unregisteredMeters + odpuP2Results[i].unregisteredMeters,
  }));

  const substationSummaries = privateResults.map((substation, i) => ({
    id: substation.id,
    name: substation.name,
    privateCounts: {
      registeredMeters: substation.registeredMeters,
      unregisteredMeters: substation.unregisteredMeters,
    },
    legalCounts: {
      registeredMeters: legalSummary[i].registeredMeters,
      unregisteredMeters: legalSummary[i].unregisteredMeters,
    },
    odpuCounts: {
      registeredMeters: odpuSummary[i].registeredMeters,
      unregisteredMeters: odpuSummary[i].unregisteredMeters,
    },
  }));

  return substationSummaries;
}
