import { getLatestMeterCountsForSubstation } from "~/.server/db-queries/transformer-substations";
import { getTechnicalMeterStatsForSubstation } from "~/.server/db-queries/technical-meters";

interface SubstationMeterDataParams {
  substationId: number;
  privateDate: string;
  legalDate: string;
  odpuDate: string;
}

export default async function getSubstationMeterSummary({
  substationId,
  privateDate,
  legalDate,
  odpuDate,
}: SubstationMeterDataParams) {
  const [
    privateMeters,
    legalSimsMeters,
    legalP2Meters,
    odpuSimsMeters,
    odpuP2Meters,
    technicalMeters,
  ] = await Promise.all([
    getLatestMeterCountsForSubstation({
      balanceGroup: "Быт",
      asOfDate: privateDate,
      substationId,
    }),
    getLatestMeterCountsForSubstation({
      balanceGroup: "ЮР Sims",
      asOfDate: legalDate,
      substationId,
    }),
    getLatestMeterCountsForSubstation({
      balanceGroup: "ЮР П2",
      asOfDate: legalDate,
      substationId,
    }),
    getLatestMeterCountsForSubstation({
      balanceGroup: "ОДПУ Sims",
      asOfDate: odpuDate,
      substationId,
    }),
    getLatestMeterCountsForSubstation({
      balanceGroup: "ОДПУ П2",
      asOfDate: odpuDate,
      substationId,
    }),
    getTechnicalMeterStats(substationId),
  ]);

  return {
    privateMeters,
    legalSimsMeters,
    legalP2Meters,
    odpuSimsMeters,
    odpuP2Meters,
    technicalMeters,
  };
}

async function getTechnicalMeterStats(substationId: number) {
  const stats = await getTechnicalMeterStatsForSubstation(substationId);

  return {
    quantity: stats?.quantity ?? 0,
    underVoltage: stats?.underVoltage ?? 0,
  };
}
