import {
  getLastRecordId,
  createRegisteredMeterRecord,
  updateRegisteredMeterRecordById,
} from "~/.server/db-queries/registeredMeters";
import {
  getLastNotInSystemId,
  createUnregisteredMeterRecord,
  updateUnregisteredMeterRecordById,
} from "~/.server/db-queries/unregisteredMeters";
import {
  getLastYearId,
  createYearlyMeterInstallation,
  updateYearlyInstallationRecordById,
} from "~/.server/db-queries/yearlyMeterInstallations";
import {
  getLastMonthId,
  createMonthlyInstallationRecord,
  updateMonthlyInstallationRecordById,
} from "~/.server/db-queries/monthlyMeterInstallations";
import { loadAllSubstationMeterReports } from "./load-data";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";

export default async function changeData(
  values: Record<string, FormDataEntryValue>,
) {
  const handledValues = handleValues(values);

  const prevData = await loadAllSubstationMeterReports(handledValues.id, [
    handledValues.balanceGroup,
  ]);

  await Promise.all([
    handleTotalMeters(handledValues, prevData[handledValues.balanceGroup]),
    handleYearMeters(handledValues, prevData[handledValues.balanceGroup]),
    handleMonthMeters(handledValues, prevData[handledValues.balanceGroup]),
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

interface PreviousData {
  registeredMeters: number;
  unregisteredMeters: number;
  yearlyInstallation: {
    totalInstalled: number;
    registeredCount: number;
  };
  monthlyInstallation: {
    totalInstalled: number;
    registeredCount: number;
  };
}

async function handleTotalMeters(
  handledValues: UpdateTotalMetersType,
  prevData: PreviousData,
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
  prevData: PreviousData,
) {
  const { inSystemTotal, id, date, balanceGroup } = handledValues;

  if (lastMetersQuantityId) {
    if (!(prevData.registeredMeters === inSystemTotal)) {
      await updateRegisteredMeterRecordById({
        id: lastMetersQuantityId,
        registeredMeterCount: inSystemTotal,
      });
    }
  } else {
    await createRegisteredMeterRecord({
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
  prevData: PreviousData,
) {
  const { totalMeters, inSystemTotal, id, date, balanceGroup } = handledValues;

  if (lastNotInSystemId) {
    const actualQuantity = totalMeters - inSystemTotal;

    if (!(prevData.unregisteredMeters === actualQuantity)) {
      await updateUnregisteredMeterRecordById({
        id: lastNotInSystemId,
        unregisteredMeterCount: actualQuantity,
      });
    }
  } else {
    await createUnregisteredMeterRecord({
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
  prevData: PreviousData,
) {
  const lastYearId = await getLastYearId({
    transformerSubstationId: id,
    balanceGroup,
    year,
  });

  if (lastYearId) {
    const isEqual =
      yearTotal === prevData.yearlyInstallation.totalInstalled &&
      inSystemYear === prevData.yearlyInstallation.registeredCount;

    if (!isEqual) {
      await updateYearlyInstallationRecordById({
        id: lastYearId,
        totalInstalled: yearTotal,
        registeredCount: inSystemYear,
      });
    }
  } else {
    await createYearlyMeterInstallation({
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
  prevData: PreviousData,
) {
  const lastMonthId = await getLastMonthId({
    transformerSubstationId: id,
    balanceGroup,
    month,
    year,
  });

  if (lastMonthId) {
    const isEqual =
      monthTotal === prevData.monthlyInstallation.totalInstalled &&
      inSystemMonth === prevData.monthlyInstallation.registeredCount;

    if (!isEqual) {
      await updateMonthlyInstallationRecordById({
        id: lastMonthId,
        totalInstalled: monthTotal,
        registeredCount: inSystemMonth,
      });
    }
  } else {
    await createMonthlyInstallationRecord({
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
