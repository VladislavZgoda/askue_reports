import type {
  BalanceType,
  UpdateTotalMetersType,
  UpdateTotalYearMetersType,
  UpdateTotalMonthMetersType,
} from "~/types";
import {
  getLastRecordId,
  updateRecordOnId,
  insertNewMeters,
} from "~/.server/db-queries/electricityMetersTable";
import {
  getLastNotInSystemId,
  updateNotInSystemOnId,
  insertNotInSystem,
} from "~/.server/db-queries/notInSystemTable";
import {
  getLastYearId,
  updateYearOnId,
  insertYearMeters,
} from "~/.server/db-queries/newYearMetersTable";
import {
  getLastMonthId,
  updateMonthOnId,
  insertMonthMeters,
} from "~/.server/db-queries/newMothMetersTable";
import loadData from "./loadData";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";

export default async function changeData(values: {
  [k: string]: FormDataEntryValue;
}) {
  const handledValues = handleValues(values);
  const prevData = await loadData(handledValues.id, handledValues.type);
  await handleTotalMeters(handledValues, prevData);
  await handleYearMeters(handledValues, prevData);
  await handleMonthMeters(handledValues, prevData);
}

function handleValues(values: { [k: string]: FormDataEntryValue }) {
  const date = new Date().toLocaleDateString("en-CA");
  const year = cutOutYear(date);
  const month = cutOutMonth(date);

  const handledValues = {
    type: values.type as BalanceType,
    totalMeters: Number(values.totalMeters),
    inSystemTotal: Number(values.inSystemTotal),
    yearTotal: Number(values.yearTotal),
    inSystemYear: Number(values.inSystemYear),
    monthTotal: Number(values.monthTotal),
    inSystemMonth: Number(values.inSystemMonth),
    failedMeters: Number(values.failedMeters),
    id: Number(values.id),
    date,
    year,
    month,
  };

  return handledValues;
}

type PrevData = {
  totalMeters: {
    quantity: number;
    addedToSystem: number;
  };
  totalYearMeters: {
    quantity: number;
    addedToSystem: number;
  };
  totalMonthMeters: {
    quantity: number;
    addedToSystem: number;
  };
};

async function handleTotalMeters(
  { id, type, totalMeters, inSystemTotal, date }: UpdateTotalMetersType,
  prevData: PrevData,
) {
  const lastMetersQuantityId = await getLastRecordId({
    transformerSubstationId: id,
    type,
  });

  if (lastMetersQuantityId) {
    const prevQuantity = prevData.totalMeters.addedToSystem;

    if (!(prevQuantity === inSystemTotal)) {
      await updateRecordOnId({
        id: lastMetersQuantityId,
        quantity: inSystemTotal,
      });
    }
  } else {
    await insertNewMeters({
      quantity: inSystemTotal,
      transformerSubstationId: id,
      date,
      type,
    });
  }

  const lastNotInSystemId = await getLastNotInSystemId({
    transformerSubstationId: id,
    type,
  });

  if (lastNotInSystemId) {
    const prevQuantity =
      prevData.totalMeters.quantity - prevData.totalMeters.addedToSystem;
    const actualQuantity = totalMeters - inSystemTotal;

    if (!(prevQuantity === actualQuantity)) {
      await updateNotInSystemOnId({
        id: lastNotInSystemId,
        quantity: actualQuantity,
      });
    }
  } else {
    await insertNotInSystem({
      transformerSubstationId: id,
      quantity: totalMeters - inSystemTotal,
      date,
      type,
    });
  }
}

async function handleYearMeters(
  { id, type, yearTotal, inSystemYear, date, year }: UpdateTotalYearMetersType,
  prevData: PrevData,
) {
  const lastYearId = await getLastYearId({
    transformerSubstationId: id,
    type,
    year,
  });

  if (lastYearId) {
    const prevValues = prevData.totalYearMeters;
    const isEqual =
      yearTotal === prevValues.quantity &&
      inSystemYear === prevValues.addedToSystem;

    if (!isEqual) {
      await updateYearOnId({
        id: lastYearId,
        quantity: yearTotal,
        added_to_system: inSystemYear,
      });
    }
  } else {
    await insertYearMeters({
      quantity: yearTotal,
      added_to_system: inSystemYear,
      transformerSubstationId: id,
      date,
      type,
      year,
    });
  }
}

async function handleMonthMeters(
  {
    id,
    type,
    monthTotal,
    inSystemMonth,
    date,
    year,
    month,
  }: UpdateTotalMonthMetersType,
  prevData: PrevData,
) {
  const lastMonthId = await getLastMonthId({
    transformerSubstationId: id,
    type,
    month,
    year,
  });

  if (lastMonthId) {
    const prevValues = prevData.totalMonthMeters;
    const isEqual =
      monthTotal === prevValues.quantity &&
      inSystemMonth === prevValues.addedToSystem;

    if (!isEqual) {
      await updateMonthOnId({
        id: lastMonthId,
        quantity: monthTotal,
        added_to_system: inSystemMonth,
      });
    }
  } else {
    await insertMonthMeters({
      quantity: monthTotal,
      added_to_system: inSystemMonth,
      transformerSubstationId: id,
      type,
      date,
      year,
      month,
    });
  }
}
