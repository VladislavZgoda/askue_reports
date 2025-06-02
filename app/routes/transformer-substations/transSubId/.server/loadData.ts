import { getMeterQuantityAtDate } from "~/.server/db-queries/electricityMeters";
import { getUnregisteredMeterCountAtDate } from "~/.server/db-queries/notInSystem";
import { selectTechnicalMeters } from "~/.server/db-queries/technicalMeters";

interface LoadDataProps {
  id: number;
  privateDate: string;
  legalDate: string;
  odpyDate: string;
}

export default async function loadData({
  id,
  privateDate,
  legalDate,
  odpyDate,
}: LoadDataProps) {
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

async function getDataFromDb(
  id: number,
  date: string,
  balanceGroup: BalanceGroup,
) {
  const [inSystem, notInSystem] = await Promise.all([
    getMeterQuantityAtDate({
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
