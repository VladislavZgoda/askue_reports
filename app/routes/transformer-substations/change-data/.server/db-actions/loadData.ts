import { selectLastQuantity } from "~/.server/db-queries/electricityMeters";
import { selectLastNotInSystem } from "~/.server/db-queries/notInSystemTable";
import { selectLastYearQuantity } from "~/.server/db-queries/newYearMetersTable";
import { selectLastMonthQuantity } from "~/.server/db-queries/newMonthMetersTable";

export default async function loadData(id: number, type: BalanceType) {
  const year = new Date().getFullYear();

  const argsObj: LastQuantity = {
    transformerSubstationId: id,
    type,
  };

  const [metersQuantity, metersNotInSystem, yearMeters, monthMeters] =
    await Promise.all([
      selectLastQuantity(argsObj),
      selectLastNotInSystem(argsObj),
      handleYearMeters(id, year, type),
      handleMonthMeters(id, year, type),
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

async function handleYearMeters(id: number, year: number, type: BalanceType) {
  const argsObj: LastYearQuantity = {
    transformerSubstationId: id,
    type,
    year,
  };

  const yearData = await selectLastYearQuantity(argsObj);

  const yearQuantity = {
    quantity: yearData[0]?.quantity ?? 0,
    addedToSystem: yearData[0]?.added_to_system ?? 0,
  };

  return yearQuantity;
}

async function handleMonthMeters(id: number, year: number, type: BalanceType) {
  let month = String(new Date().getMonth() + 1);

  if (month.length === 1) {
    month = "0" + month;
  }

  const argsObj: LastMonthQuantity = {
    transformerSubstationId: id,
    type,
    month,
    year,
  };

  const monthData = await selectLastMonthQuantity(argsObj);

  const monthQuantity = {
    quantity: monthData[0]?.quantity ?? 0,
    addedToSystem: monthData[0]?.added_to_system ?? 0,
  };

  return monthQuantity;
}
