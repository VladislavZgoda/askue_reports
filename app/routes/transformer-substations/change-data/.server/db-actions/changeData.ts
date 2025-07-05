import {
  getLastRecordId,
  insertRegisteredMeterRecord,
  updateRegisteredMeterRecordById,
} from "~/.server/db-queries/registeredMeters";
import {
  getLastNotInSystemId,
  updateNotInSystemOnId,
  insertUnregisteredMeters,
} from "~/.server/db-queries/unregisteredMeters";
import {
  getLastYearId,
  insertYearlyMeterInstallation,
  updateYearlyInstallationRecordById,
} from "~/.server/db-queries/yearlyMeterInstallations";
import {
  getLastMonthId,
  insertMonthlyInstallationRecord,
  updateMonthlyInstallationRecordById,
} from "~/.server/db-queries/monthlyMeterInstallations";
import loadData from "./loadData";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";

export default async function changeData(
  values: Record<string, FormDataEntryValue>,
) {
  const handledValues = handleValues(values);
  const prevData = await loadData(handledValues.id, handledValues.balanceGroup);

  await Promise.all([
    handleTotalMeters(handledValues, prevData),
    handleYearMeters(handledValues, prevData),
    handleMonthMeters(handledValues, prevData),
  ]);
}

function handleValues(values: Record<string, FormDataEntryValue>) {
  const date = new Date().toLocaleDateString("en-CA");
  const year = cutOutYear(date);
  const month = cutOutMonth(date);

  const handledValues = {
    balanceGroup: values.balanceGroup as BalanceGroup,
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

interface PrevData {
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
}

async function handleTotalMeters(
  handledValues: UpdateTotalMetersType,
  prevData: PrevData,
) {
  const { id, balanceGroup } = handledValues;

  const [lastMetersQuantityId, lastNotInSystemId] = await Promise.all([
    getLastRecordId({
      transformerSubstationId: id,
      balanceGroup,
    }),
    getLastNotInSystemId({
      transformerSubstationId: id,
      balanceGroup,
    }),
  ]);

  await Promise.all([
    handleMetersQuantity(lastMetersQuantityId, handledValues, prevData),
    handleNotInSystem(lastNotInSystemId, handledValues, prevData),
  ]);
}

async function handleMetersQuantity(
  lastMetersQuantityId: number | undefined,
  handledValues: UpdateTotalMetersType,
  prevData: PrevData,
) {
  const { inSystemTotal, id, date, balanceGroup } = handledValues;

  if (lastMetersQuantityId) {
    const prevQuantity = prevData.totalMeters.addedToSystem;

    if (!(prevQuantity === inSystemTotal)) {
      await updateRegisteredMeterRecordById({
        id: lastMetersQuantityId,
        registeredMeterCount: inSystemTotal,
      });
    }
  } else {
    await insertRegisteredMeterRecord({
      registeredMeterCount: inSystemTotal,
      substationId: id,
      date,
      balanceGroup,
    });
  }
}

async function handleNotInSystem(
  lastNotInSystemId: number | undefined,
  handledValues: UpdateTotalMetersType,
  prevData: PrevData,
) {
  const { totalMeters, inSystemTotal, id, date, balanceGroup } = handledValues;

  if (lastNotInSystemId) {
    const prevQuantity =
      prevData.totalMeters.quantity - prevData.totalMeters.addedToSystem;
    const actualQuantity = totalMeters - inSystemTotal;

    if (!(prevQuantity === actualQuantity)) {
      await updateNotInSystemOnId({
        id: lastNotInSystemId,
        unregisteredMeterCount: actualQuantity,
      });
    }
  } else {
    await insertUnregisteredMeters({
      substationId: id,
      unregisteredMeterCount: totalMeters - inSystemTotal,
      date,
      balanceGroup,
    });
  }
}

async function handleYearMeters(
  {
    id,
    balanceGroup,
    yearTotal,
    inSystemYear,
    date,
    year,
  }: UpdateTotalYearMetersType,
  prevData: PrevData,
) {
  const lastYearId = await getLastYearId({
    transformerSubstationId: id,
    balanceGroup,
    year,
  });

  if (lastYearId) {
    const prevValues = prevData.totalYearMeters;
    const isEqual =
      yearTotal === prevValues.quantity &&
      inSystemYear === prevValues.addedToSystem;

    if (!isEqual) {
      await updateYearlyInstallationRecordById({
        id: lastYearId,
        totalInstalled: yearTotal,
        registeredCount: inSystemYear,
      });
    }
  } else {
    await insertYearlyMeterInstallation({
      totalInstalled: yearTotal,
      registeredCount: inSystemYear,
      substationId: id,
      date,
      balanceGroup,
      year,
    });
  }
}

async function handleMonthMeters(
  {
    id,
    balanceGroup,
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
    balanceGroup,
    month,
    year,
  });

  if (lastMonthId) {
    const prevValues = prevData.totalMonthMeters;
    const isEqual =
      monthTotal === prevValues.quantity &&
      inSystemMonth === prevValues.addedToSystem;

    if (!isEqual) {
      await updateMonthlyInstallationRecordById({
        id: lastMonthId,
        totalInstalled: monthTotal,
        registeredCount: inSystemMonth,
      });
    }
  } else {
    await insertMonthlyInstallationRecord({
      totalInstalled: monthTotal,
      registeredCount: inSystemMonth,
      substationId: id,
      balanceGroup,
      date,
      year,
      month,
    });
  }
}
