import exceljs from 'exceljs';

export default async function validateExcel() {
  const excel = new exceljs.Workbook();

  const wb = await excel.xlsx.readFile(
    'app/routes/generate-reports/.server/uploaded-excel/supplement_nine.xlsx'
  );

  const wsPrivate = wb.worksheets[0];
  const wsOdpy = wb.worksheets[1];
  const wsLegal = wb.worksheets[2];

  if (!checkTitles(wsPrivate)
    || !checkTitles(wsOdpy)
    || !checkTitles(wsLegal)) return false;

  return true;
}

function checkTitles(ws: exceljs.Worksheet) {
  if (!(cellValue(ws, 'A2') === '№ п/п')) return false;

  if (!(cellValue(ws, 'B2') === 'Л/С')) return false;

  if (!(cellValue(ws, 'C2') === 'Номер_ПУ')) return false;

  if (!(cellValue(ws, 'D2') === 'Дата')) return false;

  if (!(cellValue(ws, 'E2') === 'Т1')) return false;

  if (!(cellValue(ws, 'F2') === 'Т2')) return false;

  if (!(cellValue(ws, 'G2') === 'Т3')) return false;

  if (!(cellValue(ws, 'H2') === 'Т сумм')) return false;

  if (!(cellValue(ws, 'I2') === 'Адрес')) return false;

  if (!(cellValue(ws, 'I2') === 'Адрес')) return false;

  if (!(cellValue(ws, 'J2') === 'ФИО абонента')) return false;

  if (!(cellValue(ws, 'K2') === 'Дата_АСКУЭ')) return false;

  if (!(cellValue(ws, 'L2') === 'Тип ПУ')) return false;

  if (!(cellValue(ws, 'M2') === 'Способ снятия показаний')) return false;

  if (!(cellValue(ws, 'N2') === 'ТП')) return false;

  return true;
}

function cellValue(ws: exceljs.Worksheet, cellNumber: string) {
  return String(ws.getCell(cellNumber).value).trim();
}
