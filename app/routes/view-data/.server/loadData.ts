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
  privateDate, legalDate, odpyDate
}: LoadDates) {
  const transSubs = await selectAllTransSubs();

  const data: DbData = {};

  for (const transSub of transSubs) {
    const transformerSubstationId = transSub.id;

    const privateMeters = await selectMetersOnDate({
      type: 'Быт',
      date: privateDate,
      transformerSubstationId
    });

    const legalMetersSims = await selectMetersOnDate({
      type: 'ЮР Sims',
      date: legalDate,
      transformerSubstationId
    });

    const legalMetersP2 = await selectMetersOnDate({
      type: 'ЮР П2',
      date: legalDate,
      transformerSubstationId
    });

    const odpyMetersSims = await selectMetersOnDate({
      type: 'ОДПУ Sims',
      date: odpyDate,
      transformerSubstationId
    });

    const odpyMetersP2 = await selectMetersOnDate({
      type: 'ОДПУ П2',
      date: odpyDate,
      transformerSubstationId
    });

    const notInSystemPrivate = await selectNotInSystemOnDate({
      type: 'Быт',
      date: privateDate,
      transformerSubstationId
    });

    const notInSystemLegalSims = await selectNotInSystemOnDate({
      type: 'ЮР Sims',
      date: legalDate,
      transformerSubstationId
    });

    const notInSystemLegalP2 = await selectNotInSystemOnDate({
      type: 'ЮР П2',
      date: legalDate,
      transformerSubstationId
    });

    const notInSystemOdpySims = await selectNotInSystemOnDate({
      type: 'ОДПУ Sims',
      date: odpyDate,
      transformerSubstationId
    });

    const notInSystemOdpyP2 = await selectNotInSystemOnDate({
      type: 'ОДПУ П2',
      date: odpyDate,
      transformerSubstationId
    });

    data[transSub.name] = {
      id: transSub.id,
      private: privateMeters,
      legal: legalMetersSims + legalMetersP2,
      odpy: odpyMetersSims + odpyMetersP2,
      notInSystem: notInSystemPrivate + notInSystemLegalSims
        + notInSystemLegalP2 + notInSystemOdpySims
        + notInSystemOdpyP2,
    };
  }

  return data;
}
