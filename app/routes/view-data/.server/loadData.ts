import { selectAllSubstations } from "~/.server/db-queries/transformerSubstations";
import { selectMetersOnDate } from "~/.server/db-queries/electricityMeters";
import { selectNotInSystemOnDate } from "~/.server/db-queries/notInSystem";
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
      selectMetersOnDate({
        balanceGroup: "Быт",
        date: privateDate,
        transformerSubstationId,
      }),
      selectMetersOnDate({
        balanceGroup: "ЮР Sims",
        date: legalDate,
        transformerSubstationId,
      }),
      selectMetersOnDate({
        balanceGroup: "ЮР П2",
        date: legalDate,
        transformerSubstationId,
      }),
      selectMetersOnDate({
        balanceGroup: "ОДПУ Sims",
        date: odpyDate,
        transformerSubstationId,
      }),
      selectMetersOnDate({
        balanceGroup: "ОДПУ П2",
        date: odpyDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        balanceGroup: "Быт",
        date: privateDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        balanceGroup: "ЮР Sims",
        date: legalDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        balanceGroup: "ЮР П2",
        date: legalDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        balanceGroup: "ОДПУ Sims",
        date: odpyDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        balanceGroup: "ОДПУ П2",
        date: odpyDate,
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
