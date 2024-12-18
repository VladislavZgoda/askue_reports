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
  const data = {
    private: await getDataFromDb(id, privateDate, "Быт"),
    legalSims: await getDataFromDb(id, legalDate, "ЮР Sims"),
    legalP2: await getDataFromDb(id, legalDate, "ЮР П2"),
    odpySims: await getDataFromDb(id, odpyDate, "ОДПУ Sims"),
    odpyP2: await getDataFromDb(id, odpyDate, "ОДПУ П2"),
    techMeters: await getTechMetersFromDb(id),
  };

  return data;
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

  const data: DbData = {
    inSystem: await selectMetersOnDate(values),
    notInSystem: await selectNotInSystemOnDate(values),
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
