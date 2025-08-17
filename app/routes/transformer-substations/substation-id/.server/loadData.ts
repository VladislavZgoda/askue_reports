import { getRegisteredMeterCountAtDate } from "~/.server/db-queries/registered-meters";
import { getUnregisteredMeterCountAtDate } from "~/.server/db-queries/unregisteredMeters";
import { getTechnicalMeterStatsForSubstation } from "~/.server/db-queries/technicalMeters";

import { db } from "~/.server/db";

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
    getMeterCountsByGroup(substationId, privateDate, "Быт"),
    getMeterCountsByGroup(substationId, legalDate, "ЮР Sims"),
    getMeterCountsByGroup(substationId, legalDate, "ЮР П2"),
    getMeterCountsByGroup(substationId, odpuDate, "ОДПУ Sims"),
    getMeterCountsByGroup(substationId, odpuDate, "ОДПУ П2"),
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

async function getMeterCountsByGroup(
  substationId: number,
  date: string,
  balanceGroup: BalanceGroup,
) {
  const [registeredCount, unregisteredCount] = await Promise.all([
    getRegisteredMeterCountAtDate(db, {
      balanceGroup,
      targetDate: date,
      dateComparison: "upTo",
      substationId,
    }),
    getUnregisteredMeterCountAtDate(db, {
      balanceGroup,
      targetDate: date,
      dateComparison: "upTo",
      substationId,
    }),
  ]);

  const meterStats = {
    registeredMeterCount: registeredCount,
    unregisteredMeterCount: unregisteredCount,
  };

  return meterStats;
}

async function getTechnicalMeterStats(substationId: number) {
  const stats = await getTechnicalMeterStatsForSubstation(substationId);

  return {
    quantity: stats?.quantity ?? 0,
    underVoltage: stats?.underVoltage ?? 0,
  };
}
