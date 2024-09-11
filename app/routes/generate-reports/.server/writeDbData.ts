import exceljs from 'exceljs';
import { selectAllTransSubs } from '~/.server/db-queries/transformerSubstationTable';
import { selectMetersOnDate } from '~/.server/db-queries/electricityMetersTable';
import { selectNotInSystemOnDate } from '~/.server/db-queries/notInSystemTable';
import { selectYearMetersOnDate } from '~/.server/db-queries/newYearMetersTable';
import { selectMonthMetersOnDate } from '~/.server/db-queries/newMothMetersTable';
import fs from 'fs';
import path from 'path';
import type { BalanceType, CheckRecordValues } from '~/types';

type FormDates = {
  [k: string]: FormDataEntryValue;
};

export default async function writeDbData(dates: FormDates) {
  const path = 'app/routes/generate-reports/.server/';

  cleanUp(path);

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

  const notInSystem = await selectNotInSystem(
    transSubs, dates
  );

  const odpy = await calculateOdpy(dates.odpyDate, transSubs);

  await handlePrivateSector(path, privateMeters);

  await handleReport({
    path, privateMeters,
    legalMeters, notInSystem,
    transSubs, dates, odpy
  });

  await handleSupplementThree({
    path, privateMeters, odpy,
    legalMeters, transSubs, dates
  });
}

async function handlePrivateSector(
  path: string,
  privateMeters: Meters
) {
  const excel = new exceljs.Workbook();

  const templatePath = path + 'workbooks/private_sector.xlsx';
  const savePath = path + 'filled-reports/private_sector.xlsx';

  const privateSectorWB = await excel.xlsx.readFile(templatePath);
  const privateSectorSheet = privateSectorWB.worksheets[0];

  privateSectorSheet.getColumn('A').eachCell(
    (cell, rowNumber) => {
      const transSub = String(cell.value).trim();

      if (!transSub.startsWith('ТП')) return;

      privateSectorSheet
        .getCell('B' + rowNumber)
        .value = privateMeters[transSub] ?? 0;
    }
  );

  // Сбросить результат формул, чтобы при открытие файла значение пересчиталось.
  privateSectorSheet.getRow(155).eachCell(
    (cell) => cell.model.result = undefined
  );

  // Без этой строки файл будет повреждён.
  privateSectorSheet.removeConditionalFormatting('');
  await excel.xlsx.writeFile(savePath);
}

type ReportType = {
  path: string;
  privateMeters: Meters;
  legalMeters: DifferentMeters;
  notInSystem: Meters;
  transSubs: TransSubs;
  dates: FormDates;
  odpy: Odpy;
}

async function handleReport({
  path, privateMeters,
  legalMeters, notInSystem,
  transSubs, dates, odpy
}: ReportType) {
  const excel = new exceljs.Workbook();

  const templatePath = path + 'workbooks/report.xlsx';
  const savePath = path + 'filled-reports/report.xlsx';

  const reportWB = await excel.xlsx.readFile(templatePath);
  const reportSheet = reportWB.worksheets[0];

  const yearMeters = await selectPeriodMeters({
    transSubs, dates,
  });

  const monthMeters = await selectPeriodMeters({
    transSubs, dates,
    periodType: 'month'
  });

  reportSheet.getColumn('B').eachCell(
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

      reportSheet.getCell('H' + rowNumber).value = privateM + legalM;
      reportSheet.getCell('I' + rowNumber).value = privateM;
      reportSheet.getCell('J' + rowNumber).value = legalM;
      reportSheet.getCell('K' + rowNumber).value = p2;
      reportSheet.getCell('P' + rowNumber).value = notInSystemMeters;
      reportSheet.getCell('Q' + rowNumber).value = yearQuantity;
      reportSheet.getCell('R' + rowNumber).value = yearInSystem;
      reportSheet.getCell('S' + rowNumber).value = monthQuantity;
      reportSheet.getCell('T' + rowNumber).value = monthInSystem;
    }
  );

  reportSheet.getCell('H265').value = odpy.quantity;
  reportSheet.getCell('P265').value = odpy.notInSystem;
  reportSheet.getCell('Q265').value = odpy.year.quantity;
  reportSheet.getCell('R265').value = odpy.year.added_to_system;
  reportSheet.getCell('S265').value = odpy.month.quantity;
  reportSheet.getCell('T265').value = odpy.month.added_to_system;

  // Сбросить результат формул, чтобы при открытие файла значение пересчиталось.
  reportSheet.getRow(267).eachCell(
    (cell) => cell.model.result = undefined
  );

  // Без этой строки файл будет повреждён, не объяснимо но факт.
  reportSheet.removeConditionalFormatting('');
  await excel.xlsx.writeFile(savePath);
}

type SupplementThree = {
  path: string;
  privateMeters: Meters;
  legalMeters: DifferentMeters;
  odpy: Odpy;
  transSubs: TransSubs;
  dates: FormDates;
};

async function handleSupplementThree({
  path, privateMeters, legalMeters,
  odpy, dates, transSubs
}: SupplementThree) {
  const excel = new exceljs.Workbook();

  const templatePath = path + 'workbooks/supplement_three.xlsx';
  const savePath = path + 'filled-reports/supplement_three.xlsx';

  const workbook = await excel.xlsx.readFile(templatePath);
  const sheet =  workbook.worksheets[2];

  const notInSystemPrivate = await selectMeters({
    transSubs,
    type: 'Быт',
    date: dates.privateDate as string,
    func: selectNotInSystemOnDate
  });

  const privateSum = calculateSum(privateMeters);
  const privateNotInSystemSum = calculateSum(notInSystemPrivate);

  sheet.getCell('D29').value = privateSum + privateNotInSystemSum;
  sheet.getCell('E29').value = privateSum;

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

  sheet.getCell('F29').value = legalSum + legalNotInSystemSum;
  sheet.getCell('G29').value = legalSum;

  sheet.getCell('H29').value = odpy.quantity + odpy.notInSystem;
  sheet.getCell('I29').value = odpy.quantity;

  // Сбросить результат формул, чтобы при открытие файла значение пересчиталось.
  sheet.getRow(29).eachCell(
    (cell) => cell.model.result = undefined
  );

  sheet.getRow(33).eachCell(
    (cell) => cell.model.result = undefined
  );

  await excel.xlsx.writeFile(savePath);
}

function cleanUp(dirPath: string) {
  const directory = dirPath + 'filled-reports/';

  if (fs.existsSync(directory)) {
    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(directory, file), (err) => {
          if (err) throw err;
        });
      }
    });
  } else {
    fs.mkdirSync(directory);
  }
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

function cutOutYear(date: FormDataEntryValue) {
  return Number(date.slice(0, 4));
}

function cutOutMonth(date: FormDataEntryValue) {
  return String(date).slice(5, 7);
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

  const year = cutOutYear(date);
  const month = cutOutMonth(date);

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

  const year = cutOutYear(date);
  const month = cutOutMonth(date);

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
