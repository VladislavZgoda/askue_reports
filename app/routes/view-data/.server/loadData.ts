import { selectAllSubstations } from "~/.server/db-queries/transformerSubstations";
import { getMeterQuantityAtDate } from "~/.server/db-queries/electricityMeters";
import { getUnregisteredMeterCountAtDate } from "~/.server/db-queries/notInSystem";
import type { DbDataType } from "../view-data.types";

interface LoadDates {
  privateDate: string;
  legalDate: string;
  odpyDate: string;
}

export default async function loadData({
  privateDate,
  legalDate,
  odpyDate,
}: LoadDates) {
  const transSubs = await selectAllSubstations();

  const data: DbDataType = {};

  for (const transSub of transSubs) {
    const transformerSubstationId = transSub.id;

    const [
      privateMeters,
      legalMetersSims,
      legalMetersP2,
      odpyMetersSims,
      odpyMetersP2,
      notInSystemPrivate,
      notInSystemLegalSims,
      notInSystemLegalP2,
      notInSystemOdpySims,
      notInSystemOdpyP2,
    ] = await Promise.all([
      getMeterQuantityAtDate({
        balanceGroup: "Быт",
        targetDate: privateDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
      getMeterQuantityAtDate({
        balanceGroup: "ЮР Sims",
        targetDate: legalDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
      getMeterQuantityAtDate({
        balanceGroup: "ЮР П2",
        targetDate: legalDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
      getMeterQuantityAtDate({
        balanceGroup: "ОДПУ Sims",
        targetDate: odpyDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
      getMeterQuantityAtDate({
        balanceGroup: "ОДПУ П2",
        targetDate: odpyDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
      getUnregisteredMeterCountAtDate({
        balanceGroup: "Быт",
        targetDate: privateDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
      getUnregisteredMeterCountAtDate({
        balanceGroup: "ЮР Sims",
        targetDate: legalDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
      getUnregisteredMeterCountAtDate({
        balanceGroup: "ЮР П2",
        targetDate: legalDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
      getUnregisteredMeterCountAtDate({
        balanceGroup: "ОДПУ Sims",
        targetDate: odpyDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
      getUnregisteredMeterCountAtDate({
        balanceGroup: "ОДПУ П2",
        targetDate: odpyDate,
        dateComparison: "upTo",
        transformerSubstationId,
      }),
    ]);

    data[transSub.name] = {
      id: transSub.id,
      private: privateMeters,
      legal: legalMetersSims + legalMetersP2,
      odpy: odpyMetersSims + odpyMetersP2,
      notInSystem:
        notInSystemPrivate +
        notInSystemLegalSims +
        notInSystemLegalP2 +
        notInSystemOdpySims +
        notInSystemOdpyP2,
    };
  }

  return data;
}
