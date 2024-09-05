import exceljs from 'exceljs';
import { selectAllTransSubs } from '~/.server/db-queries/transformerSubstationTable';
import { selectMetersOnDate } from '~/.server/db-queries/electricityMetersTable';
import { selectNotInSystemOnDate } from '~/.server/db-queries/notInSystemTable';
import fs from 'fs';
import path from 'path';
import type { BalanceType } from '~/types';

type FormDates = {
  [k: string]: FormDataEntryValue;
};

export default async function fillExcel(dates: FormDates) {
  const path = 'app/routes/generate-reports/.server/';

  cleanUp(path);

  const transSubs = await selectAllTransSubs();

  const privateMeters = await selectMeters(
    transSubs, 'Быт', dates.privateDate
  );

  const legalMeters = await selectLegalMeters(
    transSubs, dates.legalDate
  );

  const notInSystem = await getNotInSystem(
    transSubs, dates
  );
  
  await handlePrivateSector(path, privateMeters);
  
  await handleReport({
    path, privateMeters, legalMeters, notInSystem
  });
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

async function selectMeters(
  transSubs: TransSubs, 
  type: BalanceType, 
  date: FormDataEntryValue,
) {
  const meters: Meters = {};

  for (const transSub of transSubs) {
    const quantity = await selectMetersOnDate({
      type,
      date: date as string,
      transformerSubstationId: transSub.id
    });

    meters[transSub.name] = quantity;
  }

  return meters;
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

  privateSectorSheet.removeConditionalFormatting('');
  await excel.xlsx.writeFile(savePath);
}

type ReportType = {
  path: string, 
  privateMeters: Meters,
  legalMeters: DifferentMeters,
  notInSystem: Meters
}

async function handleReport({
  path, privateMeters, legalMeters, notInSystem
}: ReportType) {
  const excel = new exceljs.Workbook();

  const templatePath = path + 'workbooks/report.xlsx';
  const savePath = path + 'filled-reports/report.xlsx';

  const reportWB = await excel.xlsx.readFile(templatePath);
  const reportSheet = reportWB.worksheets[0];

  reportSheet.getColumn('B').eachCell(
    (cell, rowNumber) => {
      const transSub = String(cell.value).trim();

      if (!transSub.startsWith('ТП')) return;

      const privateM = privateMeters[transSub] ?? 0;
      
      const legalM = (legalMeters['sims'][transSub] 
        + legalMeters['p2'][transSub]) || 0;

      const p2 = legalMeters['p2'][transSub] ?? 0;
      const notInSystemMeters = notInSystem[transSub] ?? 0;

      reportSheet.getCell('H' + rowNumber).value = privateM + legalM;  
      reportSheet.getCell('I' + rowNumber).value = privateM;
      reportSheet.getCell('J' + rowNumber).value = legalM;        
      reportSheet.getCell('K' + rowNumber).value = p2;
      reportSheet.getCell('P' + rowNumber).value = notInSystemMeters;
    }
  );

  reportSheet.removeConditionalFormatting('');
  await excel.xlsx.writeFile(savePath);
}

type DifferentMeters = {
  sims: Meters;
  p2: Meters;
};

async function selectLegalMeters(
  transSubs: TransSubs,
  date: FormDataEntryValue,
) {
  const sims = await selectMeters(transSubs, 'ЮР Sims', date);
  const p2 = await selectMeters(transSubs, 'ЮР П2', date);

  const meters: DifferentMeters = {
    sims, p2
  };
  
  return meters;
}

async function selectNotInSystem(
  transSubs: TransSubs, 
  type: BalanceType, 
  date: FormDataEntryValue,
) {
  const meters: Meters = {};

  for (const transSub of transSubs) {
    const quantity = await selectNotInSystemOnDate({
      type,
      date: date as string,
      transformerSubstationId: transSub.id
    });

    meters[transSub.name] = quantity;
  }

  return meters;
}

async function getNotInSystem(
  transSubs: TransSubs,
  dates: FormDates
) {
  const privateMeters = await selectNotInSystem(
    transSubs, 'Быт', dates.privateDate
  );

  const legalMetersSims = await selectNotInSystem(
    transSubs, 'ЮР Sims', dates.legalDate
  );

  const legalMetersP2 = await selectNotInSystem(
    transSubs, 'ЮР П2', dates.legalDate
  );

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