import { getRegisteredMeterCountAtDate } from "~/.server/db-queries/registeredMeters";
import { getUnregisteredMeterCountAtDate } from "~/.server/db-queries/unregisteredMeters";
import { selectTechnicalMeters } from "~/.server/db-queries/technicalMeters";

interface LoadDataProps {
  id: number;
  privateDate: string;
  legalDate: string;
  odpuDate: string;
}

export default async function loadData({
  id,
  privateDate,
  legalDate,
  odpuDate,
}: LoadDataProps) {
  const [privateMeters, legalSims, legalP2, odpySims, odpyP2, techMeters] =
    await Promise.all([
      getDataFromDb(id, privateDate, "Быт"),
      getDataFromDb(id, legalDate, "ЮР Sims"),
      getDataFromDb(id, legalDate, "ЮР П2"),
      getDataFromDb(id, odpuDate, "ОДПУ Sims"),
      getDataFromDb(id, odpuDate, "ОДПУ П2"),
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

async function getDataFromDb(
  id: number,
  date: string,
  balanceGroup: BalanceGroup,
) {
  const [inSystem, notInSystem] = await Promise.all([
    getRegisteredMeterCountAtDate({
      balanceGroup,
      targetDate: date,
      dateComparison: "upTo",
      transformerSubstationId: id,
    }),
    getUnregisteredMeterCountAtDate({
      balanceGroup,
      targetDate: date,
      dateComparison: "upTo",
      transformerSubstationId: id,
    }),
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
