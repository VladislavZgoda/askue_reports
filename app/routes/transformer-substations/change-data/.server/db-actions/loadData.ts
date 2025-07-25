import { selectLastQuantity } from "~/.server/db-queries/registeredMeters";
import { selectLastNotInSystem } from "~/.server/db-queries/unregisteredMeters";
import { selectLastYearQuantity } from "~/.server/db-queries/yearlyMeterInstallations";
import { selectLastMonthQuantity } from "~/.server/db-queries/monthlyMeterInstallations";

export default async function loadData(id: number, balanceGroup: BalanceGroup) {
  const year = new Date().getFullYear();

  const argsObj: LastQuantity = {
    transformerSubstationId: id,
    balanceGroup,
  };

  const [metersQuantity, metersNotInSystem, yearMeters, monthMeters] =
    await Promise.all([
      selectLastQuantity(argsObj),
      selectLastNotInSystem(argsObj),
      handleYearMeters(id, year, balanceGroup),
      handleMonthMeters(id, year, balanceGroup),
    ]);

  const data = {
    totalMeters: {
      quantity: (metersQuantity ?? 0) + (metersNotInSystem ?? 0),
      addedToSystem: metersQuantity ?? 0,
    },
    totalYearMeters: yearMeters,
    totalMonthMeters: monthMeters,
  };

  return data;
}

async function handleYearMeters(
  id: number,
  year: number,
  balanceGroup: BalanceGroup,
) {
  const argsObj: LastYearQuantity = {
    transformerSubstationId: id,
    balanceGroup,
    year,
  };

  const yearData = await selectLastYearQuantity(argsObj);

  const yearQuantity = {
    quantity: yearData[0]?.totalInstalled ?? 0,
    addedToSystem: yearData[0]?.registeredCount ?? 0,
  };

  return yearQuantity;
}

async function handleMonthMeters(
  id: number,
  year: number,
  balanceGroup: BalanceGroup,
) {
  let month = String(new Date().getMonth() + 1);

  if (month.length === 1) {
    month = "0" + month;
  }

  const argsObj: LastMonthQuantity = {
    transformerSubstationId: id,
    balanceGroup,
    month,
    year,
  };

  const monthData = await selectLastMonthQuantity(argsObj);

  const monthQuantity = {
    quantity: monthData[0]?.totalInstalled ?? 0,
    addedToSystem: monthData[0]?.registeredCount ?? 0,
  };

  return monthQuantity;
}
