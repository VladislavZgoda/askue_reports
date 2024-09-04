import exceljs from 'exceljs';
import { selectAllTransSubs } from '~/.server/db-queries/transformerSubstationTable';
import { selectMetersOnDate } from '~/.server/db-queries/electricityMetersTable';
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

  const excel = new exceljs.Workbook();

  const templatePath = path + 'workbooks/private_sector.xlsx';
  const savePath = path + 'filled-reports/private_sector.xlsx';

  const privateSectorWB = await excel.xlsx.readFile(templatePath);
  const privateSectorSheet = privateSectorWB.worksheets[0];
  
  const privateMeters = await selectMeters(
    transSubs, 'Быт', dates.privateDate
  );
  

  privateSectorSheet.getColumn('A').eachCell(
    (cell, rowNumber) => {
      const transSub = String(cell.value).trim();

      if (!transSub.startsWith('ТП')) return;
      
      if (transSub in privateMeters) {
        privateSectorSheet
          .getCell('B' + rowNumber)
          .value = privateMeters[transSub];
      } else {
        privateSectorSheet
          .getCell('B' + rowNumber)
          .value = 0;
      }
    }
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

async function selectMeters(
  transSubs: TransSubs, 
  type: BalanceType, 
  date: FormDataEntryValue,
) {
  const meters: {[k: string]: number} = {};

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