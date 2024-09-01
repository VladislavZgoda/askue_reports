import { selectAllTransSubs } from "~/.server/db-queries/transformerSubstationTable";
import { selectMetersOnDate } from "~/.server/db-queries/electricityMetersTable";
import { selectNotInSystemOnDate } from "~/.server/db-queries/notInSystemTable";

type LoadDates = {
  privateDate: string;
  legalDate: string;
  odpyDate: string;
};

type DataType = {
  [k: string]: {
    [k: string]: number
  }
 };

export default async function loadData({
  privateDate, legalDate, odpyDate
}: LoadDates) {
  const transSubs = await selectAllTransSubs();

  const data: DataType = {};

  await Promise.all(transSubs.map(async ({ id, name }) => {
    const transformerSubstationId = id;

    const privateMeters = selectMetersOnDate({
      type: 'Быт',
      date: privateDate,
      transformerSubstationId
    });

    const legalMetersSims = selectMetersOnDate({
      type: 'ЮР Sims',
      date: legalDate,
      transformerSubstationId
    });

    const legalMetersP2 = selectMetersOnDate({
      type: 'ЮР П2',
      date: legalDate,
      transformerSubstationId
    });

    const odpyMetersSims = selectMetersOnDate({
      type: 'ОДПУ Sims',
      date: odpyDate,
      transformerSubstationId
    });

    const odpyMetersP2 = selectMetersOnDate({
      type: 'ОДПУ П2',
      date: odpyDate,
      transformerSubstationId
    });

    const notInSystemPrivate = selectNotInSystemOnDate({
      type: 'Быт',
      date: privateDate,
      transformerSubstationId
    });

    const notInSystemLegalSims = selectNotInSystemOnDate({
      type: 'ЮР Sims',
      date: legalDate,
      transformerSubstationId
    });

    const notInSystemLegalP2 = selectNotInSystemOnDate({
      type: 'ЮР П2',
      date: legalDate,
      transformerSubstationId
    });

    const notInSystemOdpySims = selectNotInSystemOnDate({
      type: 'ОДПУ Sims',
      date: odpyDate,
      transformerSubstationId
    });

    const notInSystemOdpyP2 = selectNotInSystemOnDate({
      type: 'ОДПУ П2',
      date: odpyDate,
      transformerSubstationId
    });

    data[name] = {
      private: await privateMeters,
      legal: await legalMetersSims + await legalMetersP2,
      odpy: await odpyMetersSims + await odpyMetersP2,
      notInSystem: await notInSystemPrivate + await notInSystemLegalSims
        + await notInSystemLegalP2 + await notInSystemOdpySims
        + await notInSystemOdpyP2
    };
  }));

  return data;
}
