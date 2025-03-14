import { selectAllTransSubs } from "~/.server/db-queries/transformerSubstationTable";
import { selectMetersOnDate } from "~/.server/db-queries/electricityMetersTable";
import { selectNotInSystemOnDate } from "~/.server/db-queries/notInSystemTable";
import type { DbData } from "../view-data.types";

type LoadDates = {
  privateDate: string;
  legalDate: string;
  odpyDate: string;
};

export default async function loadData({
  privateDate,
  legalDate,
  odpyDate,
}: LoadDates) {
  const transSubs = await selectAllTransSubs();

  const data: DbData = {};

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
        type: "Быт",
        date: privateDate,
        transformerSubstationId,
      }),
      selectMetersOnDate({
        type: "ЮР Sims",
        date: legalDate,
        transformerSubstationId,
      }),
      selectMetersOnDate({
        type: "ЮР П2",
        date: legalDate,
        transformerSubstationId,
      }),
      selectMetersOnDate({
        type: "ОДПУ Sims",
        date: odpyDate,
        transformerSubstationId,
      }),
      selectMetersOnDate({
        type: "ОДПУ П2",
        date: odpyDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        type: "Быт",
        date: privateDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        type: "ЮР Sims",
        date: legalDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        type: "ЮР П2",
        date: legalDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        type: "ОДПУ Sims",
        date: odpyDate,
        transformerSubstationId,
      }),
      selectNotInSystemOnDate({
        type: "ОДПУ П2",
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
