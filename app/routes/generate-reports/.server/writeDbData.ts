import exceljs from 'exceljs';
import { selectAllTransSubs } from '~/.server/db-queries/transformerSubstationTable';
import { selectMetersOnDate } from '~/.server/db-queries/electricityMetersTable';
import { selectNotInSystemOnDate } from '~/.server/db-queries/notInSystemTable';
import { selectYearMetersOnDate } from '~/.server/db-queries/newYearMetersTable';
import { selectMonthMetersOnDate } from '~/.server/db-queries/newMothMetersTable';
import type { BalanceType, CheckRecordValues } from '~/types';
import { cutOutMonth, cutOutYear } from '~/.server/helpers/stringFunctions';

type FormDates = {
  [k: string]: FormDataEntryValue;
};

export default async function writeDbData(dates: FormDates) {
  const excel = new exceljs.Workbook();
  const path = 'app/routes/generate-reports/.server/';

  const transSubs = await selectAllTransSubs();

  const privateMeters = await selectMeters({
    transSubs,
    type: 'Быт',
    date: dates.privateDate,
    func: selectMetersOnDate
  });

  const legalMeters = await selectLegalMeters(
    transSubs, dates.legalDate
  );

  const odpy = await calculateOdpy(dates.odpyDate, transSubs);

  await handlePrivateSector(path, privateMeters, excel);

  await handleReport({
    path, privateMeters, legalMeters,
    transSubs, dates, odpy, excel
  });

  await handleSupplementThree({
    path, privateMeters, odpy, excel,
    legalMeters, transSubs, dates
  });
}

async function handlePrivateSector(
  path: string,
  privateMeters: Meters,
  excel: exceljs.Workbook
) {
  const templatePath = path + 'workbooks/private_sector.xlsx';
  const savePath = path + 'filled-reports/private_sector.xlsx';

  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  ws.getColumn('A').eachCell(
    (cell, rowNumber) => {
      const transSub = String(cell.value).trim();

      if (!transSub.startsWith('ТП')) return;

      ws.getCell('B' + rowNumber).value = privateMeters[transSub] ?? 0;
    }
  );

  resetResult(ws, 155);

  // Без этой строки файл будет повреждён.
  ws.removeConditionalFormatting('');
  await excel.xlsx.writeFile(savePath);
}

type ReportType = {
  path: string;
  privateMeters: Meters;
  legalMeters: DifferentMeters;
  transSubs: TransSubs;
  dates: FormDates;
  odpy: Odpy;
  excel: exceljs.Workbook;
}

async function handleReport({
  path, privateMeters, legalMeters, 
  transSubs, dates, odpy, excel
}: ReportType) {
  const templatePath = path + 'workbooks/report.xlsx';
  const savePath = path + 'filled-reports/report.xlsx';

  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  const notInSystem = await selectNotInSystem(
    transSubs, dates
  );

  const yearMeters = await selectPeriodMeters({
    transSubs, dates,
  });

  const monthMeters = await selectPeriodMeters({
    transSubs, dates,
    periodType: 'month'
  });

  ws.getColumn('B').eachCell(
    (cell, rowNumber) => {
      const transSub = String(cell.value).trim();

      if (!transSub.startsWith('ТП')) return;

      const privateM = privateMeters[transSub] ?? 0;

      const legalM = (legalMeters['sims'][transSub]
        + legalMeters['p2'][transSub]) || 0;

      const p2 = legalMeters['p2'][transSub] ?? 0;
      const notInSystemMeters = notInSystem[transSub] ?? 0;

      const yearQuantity = yearMeters[transSub]?.quantity ?? 0;
      const yearInSystem = yearMeters[transSub]?.added_to_system ?? 0;

      const monthQuantity = monthMeters[transSub]?.quantity ?? 0;
      const monthInSystem = monthMeters[transSub]?.added_to_system ?? 0;

      ws.getCell('H' + rowNumber).value = privateM + legalM;
      ws.getCell('I' + rowNumber).value = privateM;
      ws.getCell('J' + rowNumber).value = legalM;
      ws.getCell('K' + rowNumber).value = p2;
      ws.getCell('P' + rowNumber).value = notInSystemMeters;
      ws.getCell('Q' + rowNumber).value = yearQuantity;
      ws.getCell('R' + rowNumber).value = yearInSystem;
      ws.getCell('S' + rowNumber).value = monthQuantity;
      ws.getCell('T' + rowNumber).value = monthInSystem;
    }
  );

  ws.getCell('H265').value = odpy.quantity;
  ws.getCell('P265').value = odpy.notInSystem;
  ws.getCell('Q265').value = odpy.year.quantity;
  ws.getCell('R265').value = odpy.year.added_to_system;
  ws.getCell('S265').value = odpy.month.quantity;
  ws.getCell('T265').value = odpy.month.added_to_system;

  resetResult(ws, 267);

  ws.getCell('H268').model.result = undefined;
  ws.getCell('H269').model.result = undefined;

  // Без этой строки файл будет повреждён, не объяснимо но факт.
  ws.removeConditionalFormatting('');
  await excel.xlsx.writeFile(savePath);
}

type SupplementThree = {
  path: string;
  privateMeters: Meters;
  legalMeters: DifferentMeters;
  odpy: Odpy;
  transSubs: TransSubs;
  dates: FormDates;
  excel: exceljs.Workbook
};

async function handleSupplementThree({
  path, privateMeters, legalMeters,
  odpy, dates, transSubs, excel
}: SupplementThree) {
  const templatePath = path + 'workbooks/supplement_three.xlsx';
  const savePath = path + 'filled-reports/supplement_three.xlsx';

  const wb = await excel.xlsx.readFile(templatePath);
  const ws =  wb.worksheets[2];

  const notInSystemPrivate = await selectMeters({
    transSubs,
    type: 'Быт',
    date: dates.privateDate as string,
    func: selectNotInSystemOnDate
  });

  const privateSum = calculateSum(privateMeters);
  const privateNotInSystemSum = calculateSum(notInSystemPrivate);

  ws.getCell('D29').value = privateSum + privateNotInSystemSum;
  ws.getCell('E29').value = privateSum;

  const notInSystemSims = await selectMeters({
    transSubs,
    type: 'ЮР Sims',
    date: dates.legalDate as string,
    func: selectNotInSystemOnDate
  });

  const notInSystemP2 = await selectMeters({
    transSubs,
    type: 'ЮР П2',
    date: dates.legalDate as string,
    func: selectNotInSystemOnDate
  });

  const legalSum = calculateSum(legalMeters.sims) + calculateSum(legalMeters.p2);
  const legalNotInSystemSum = calculateSum(notInSystemSims) + calculateSum(notInSystemP2);

  ws.getCell('F29').value = legalSum + legalNotInSystemSum;
  ws.getCell('G29').value = legalSum;

  ws.getCell('H29').value = odpy.quantity + odpy.notInSystem;
  ws.getCell('I29').value = odpy.quantity;

  resetResult(ws, 29);
  resetResult(ws, 33);

  await excel.xlsx.writeFile(savePath);
}

// Сбросить результат формул, чтобы при открытие файла значение пересчиталось.
function resetResult(ws: exceljs.Worksheet, rowNumber: number) {
  ws.getRow(rowNumber).eachCell(
    (cell) => cell.model.result = undefined
  );
}

type TransSubs = {
  id: number;
  name: string;
}[];

type Meters = { [k: string]: number };

type SelectMeters = {
  transSubs: TransSubs,
  type: BalanceType,
  date: FormDataEntryValue,
  func: ({ type, date, transformerSubstationId }
    : CheckRecordValues) => Promise<number>;
};

async function selectMeters({
  transSubs, type, date, func
}: SelectMeters) {
  const meters: Meters = {};

  for (const transSub of transSubs) {
    const quantity = await func({
      type,
      date: date as string,
      transformerSubstationId: transSub.id
    });

    meters[transSub.name] = quantity;
  }

  return meters;
}

type DifferentMeters = {
  sims: Meters;
  p2: Meters;
};

async function selectLegalMeters(
  transSubs: TransSubs,
  date: FormDataEntryValue,
) {
  const sims = await selectMeters({
    transSubs,
    type: 'ЮР Sims',
    date,
    func: selectMetersOnDate
  });

  const p2 = await selectMeters({
    transSubs,
    type: 'ЮР П2',
    date,
    func: selectMetersOnDate
  });

  const meters: DifferentMeters = {
    sims, p2
  };

  return meters;
}

async function selectNotInSystem(
  transSubs: TransSubs,
  dates: FormDates
) {
  const privateMeters = await selectMeters({
    transSubs,
    type: 'Быт',
    date: dates.privateDate,
    func: selectNotInSystemOnDate
  });

  const legalMetersSims = await selectMeters({
    transSubs,
    type: 'ЮР Sims',
    date: dates.legalDate,
    func: selectNotInSystemOnDate
  });

  const legalMetersP2 = await selectMeters({
    transSubs,
    type: 'ЮР П2',
    date: dates.legalDate,
    func: selectNotInSystemOnDate
  });

  const meters: Meters = {};

  for (const transSub of transSubs) {
    const name = transSub.name;

    const privateM = privateMeters[name];
    const legalSims = legalMetersSims[name];
    const legalP2 = legalMetersP2[name];

    meters[name] = privateM + legalSims + legalP2;
  }

  return meters;
}

type PeriodMeters = {
  [k: string]: {
    quantity: number;
    added_to_system: number;
  };
};

type FuncArgs = {
  type: BalanceType;
  date: string;
  year: number;
};

type GetPeriodMeters = {
  transSubs: TransSubs;
  type: BalanceType;
  date: FormDataEntryValue;
  periodType?: 'month';
};

async function getPeriodMeters({
  transSubs,
  type,
  date,
  periodType
}: GetPeriodMeters) {
  const meters: PeriodMeters = {};

  const year = cutOutYear(String(date));
  const month = cutOutMonth(String(date));

  const args: FuncArgs = {
    type,
    date: date as string,
    year
  };

  let data: {
    quantity: number;
    added_to_system: number;
  };

  for (const transSub of transSubs) {
    if (periodType === 'month') {
      data = await selectMonthMetersOnDate({
        transformerSubstationId: transSub.id,
        month,
        ...args
      });
    } else {
      data = await selectYearMetersOnDate({
        transformerSubstationId: transSub.id,
        ...args
      });
    }

    meters[transSub.name] = data;
  }

  return meters;
}

type SelectPeriodMeters = {
  transSubs: TransSubs,
  dates: FormDates,
  periodType?: 'month';
};

async function selectPeriodMeters({
  transSubs, dates, periodType
}: SelectPeriodMeters) {
  const privateMeters = await getPeriodMeters({
    transSubs,
    type: 'Быт',
    date: dates.privateDate,
    periodType
  });

  const legalMetersSims = await getPeriodMeters({
    transSubs,
    type: 'ЮР Sims',
    date: dates.legalDate,
    periodType
  });

  const legalMetersP2 = await getPeriodMeters({
    transSubs,
    type: 'ЮР П2',
    date: dates.legalDate,
    periodType
  });

  const meters: PeriodMeters = {};

  for (const transSub of transSubs) {
    const name = transSub.name;

    const privateM = privateMeters[name];
    const legalSims = legalMetersSims[name];
    const legalP2 = legalMetersP2[name];

    const quantity = (privateM?.quantity ?? 0)
      + (legalSims?.quantity ?? 0) + (legalP2?.quantity ?? 0);

    const added_to_system = (privateM?.added_to_system ?? 0)
      + (legalSims?.added_to_system ?? 0) + (legalP2?.added_to_system ?? 0);

    meters[name] = { quantity, added_to_system };
  }

  return meters;
}

type Odpy = {
  quantity: number;
  notInSystem: number;
  year: {
    quantity: number;
    added_to_system: number;
  };
  month: {
    quantity: number;
    added_to_system: number;
  };
};

async function calculateOdpy(
  date: FormDataEntryValue,
  transSubs: TransSubs
) {

  const odpyData = {
    quantity: 0,
    notInSystem: 0,
    year: {
      quantity: 0,
      added_to_system: 0
    },
    month: {
      quantity: 0,
      added_to_system: 0
    },
  };

  const year = cutOutYear(String(date));
  const month = cutOutMonth(String(date));

  for (const transSub of transSubs) {
    const quantitySims = await selectMetersOnDate({
      transformerSubstationId: transSub.id,
      type: 'ОДПУ Sims',
      date: date as string
    });

    const quantityP2 = await selectMetersOnDate({
      transformerSubstationId: transSub.id,
      type: 'ОДПУ П2',
      date: date as string
    });

    const notInSystemSims = await selectNotInSystemOnDate({
      transformerSubstationId: transSub.id,
      type: 'ОДПУ Sims',
      date: date as string
    });

    const notInSystemP2 = await selectNotInSystemOnDate({
      transformerSubstationId: transSub.id,
      type: 'ОДПУ П2',
      date: date as string
    });

    const yearSims = await selectYearMetersOnDate({
      transformerSubstationId: transSub.id,
      type: 'ОДПУ Sims',
      date: date as string,
      year
    });

    const yearP2 = await selectYearMetersOnDate({
      transformerSubstationId: transSub.id,
      type: 'ОДПУ П2',
      date: date as string,
      year
    });

    const monthSims = await selectMonthMetersOnDate({
      transformerSubstationId: transSub.id,
      type: 'ОДПУ Sims',
      date: date as string,
      month,
      year
    });

    const monthP2 = await selectMonthMetersOnDate({
      transformerSubstationId: transSub.id,
      type: 'ОДПУ П2',
      date: date as string,
      month,
      year
    });

    odpyData.quantity += quantitySims + quantityP2;
    odpyData.notInSystem += notInSystemSims + notInSystemP2;
    odpyData.year.quantity += (yearSims?.quantity ?? 0) + (yearP2?.quantity ?? 0);
    odpyData.year.added_to_system += (yearSims?.added_to_system ?? 0) + (yearP2?.added_to_system ?? 0);
    odpyData.month.quantity += (monthSims?.quantity ?? 0) + (monthP2?.quantity ?? 0);
    odpyData.month.added_to_system += (monthSims?.added_to_system ?? 0) + (monthP2?.added_to_system ?? 0);
  }

  return odpyData;
}

function calculateSum(meters: Meters) {
  let sum = 0;

  for (const key of Object.keys(meters)) {
    sum += meters[key];
  }

  return sum;
}
