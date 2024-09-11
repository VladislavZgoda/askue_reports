import exceljs from 'exceljs';
import fs from 'fs';
import path from 'path';

export default async function parseExcel() {
  const excel = new exceljs.Workbook();
  
  const wb = await excel.xlsx.readFile(
    'app/routes/generate-reports/.server/uploaded-excel/supplement_nine.xlsx'
  );

  const wsPrivate = wb.worksheets[0];
  const wsOdpy = wb.worksheets[1];
  const wsLegal = wb.worksheets[2];

  const data: { [k: string]: { [k: string]: number } } = {
    private: {
      total: 0,
      rider: 0
    },
    legal: {
      total: 0,
      rider: 0
    },
    odpy: {
      total: 0,
      rider: 0
    }
  };

  wsPrivate.getColumn('N').eachCell(
    (cell, rowNumber) => {
      const transSub = String(cell.value);

      if (!transSub.startsWith('ТП-')) return;

      if (!Object.prototype.hasOwnProperty.call(data.private, transSub)) {
        data.private[transSub] = 0;
      }

      const readingSource = String(wsPrivate.getCell('M' + rowNumber).value);

      if (readingSource.toLowerCase() === 'ридер') {
        data.private.rider += 1;
      } else {
        data.private[transSub] += 1;
        data.private.total += 1;
      }
    }
  );

 return data;
}
