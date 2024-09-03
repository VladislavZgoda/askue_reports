import exceljs from 'exceljs';
import { selectAllTransSubs } from '~/.server/db-queries/transformerSubstationTable';
import { selectMetersOnDate } from '~/.server/db-queries/electricityMetersTable';
import fs from 'fs';

type FormDates = {
  [k: string]: FormDataEntryValue;
};

export default async function fillExcel(dates: FormDates) {
  const excel = new exceljs.Workbook();
  
  const templatePath = 'app\\routes\\generate-reports\\.server\\workbooks\\private_sector.xlsx';
  const copyPath = 'app\\routes\\generate-reports\\.server\\filled-reports\\private_sector.xlsx';
  
  fs.copyFile(templatePath, copyPath, (err) => {
    if (err) throw err;
  });

  const privateSectorWB = await excel.xlsx.readFile(templatePath);
  const privateSectorSheet = privateSectorWB.worksheets[0];

  privateSectorSheet.getColumn('A').eachCell(
    (cell, rowNumber) => {
      console.log(cell.value, rowNumber);
    }
  );
}