import type { BalanceType, DbData } from "~/types";
import { selectMetersOnDate } from "~/.server/db-queries/electricityMetersTable";
import { selectNotInSystemOnDate } from "~/.server/db-queries/notInSystemTable";
import { selectTechnicalMeters } from "~/.server/db-queries/technicalMetersTable";

type LoadData = {
  id: number;
  privateDate: string;
  legalDate: string;
  odpyDate: string;
};

export default async function loadData({
  id,
  privateDate,
  legalDate,
  odpyDate,
}: LoadData) {
  const [privateMeters, legalSims, legalP2, odpySims, odpyP2, techMeters] =
    await Promise.all([
      getDataFromDb(id, privateDate, "Быт"),
      getDataFromDb(id, legalDate, "ЮР Sims"),
      getDataFromDb(id, legalDate, "ЮР П2"),
      getDataFromDb(id, odpyDate, "ОДПУ Sims"),
      getDataFromDb(id, odpyDate, "ОДПУ П2"),
      getTechMetersFromDb(id),
    ]);

  return {
    privateMeters,
    legalSims,
    legalP2,
    odpySims,
    odpyP2,
    techMeters,
  };
}

function handleValues(id: number, date: string, type: BalanceType) {
  return {
    transformerSubstationId: id,
    date,
    type,
  };
}

async function getDataFromDb(id: number, date: string, type: BalanceType) {
  const values = handleValues(id, date, type);

  const [inSystem, notInSystem] = await Promise.all([
    selectMetersOnDate(values),
    selectNotInSystemOnDate(values),
  ]);

  const data: DbData = {
    inSystem,
    notInSystem,
  };

  return data;
}

async function getTechMetersFromDb(id: number) {
  const data = await selectTechnicalMeters(id);

  return {
    quantity: data[0]?.quantity ?? 0,
    underVoltage: data[0]?.underVoltage ?? 0,
  };
}
