import exceljs from 'exceljs';
import { selectAllTransSubs } from '~/.server/db-queries/transformerSubstationTable';
import { selectMetersOnDate } from '~/.server/db-queries/electricityMetersTable';
import fs from 'fs';
import path from 'path';

type FormDates = {
  [k: string]: FormDataEntryValue;
};

export default async function fillExcel(dates: FormDates) {
  const path = 'app/routes/generate-reports/.server/';

  cleanUp(path);

  const excel = new exceljs.Workbook();

  const templatePath = path + 'workbooks/private_sector.xlsx';
  const savePath = path + 'filled-reports/private_sector.xlsx';

  const privateSectorWB = await excel.xlsx.readFile(templatePath);
  const privateSectorSheet = privateSectorWB.worksheets[0];

  privateSectorSheet.getCell('B3').value = 2;

  await excel.xlsx.writeFile(savePath);

  // privateSectorSheet.getColumn('A').eachCell(
  //   (cell, rowNumber) => {
  //     console.log(cell.value, rowNumber);
  //   }
  // );
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
