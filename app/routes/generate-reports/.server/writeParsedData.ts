import parseExcel from "./parseExcel";
import exceljs from 'exceljs';

export default async function writeParsedData() {
  const path = 'app/routes/generate-reports/.server/filled-reports/';
  const excel = new exceljs.Workbook();
  const data = await parseExcel();

  await handleReport(data, path, excel);
  await handleSupplementThree(data, path, excel);
}

type Data = {
  [k: string]: {
    [k: string]: number;
  };
}

async function handleReport(
  data: Data,
  path: string,
  excel: exceljs.Workbook
) {
  const filePath = path + 'report.xlsx';

  const wb = await excel.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];

  ws.getColumn('B').eachCell(
    (cell, rowNumber) => {
      const transSub = String(cell.value).trim();

      if (!transSub.startsWith('ТП')) return;

      const quantityPrivate = data.private[transSub] ?? 0;
      const quantityLegal = data.legal[transSub] ?? 0;
      const total = quantityPrivate + quantityLegal;

      ws.getCell('L' + rowNumber).value = total;
      ws.getCell('M' + rowNumber).model.result = undefined;
    }
  );

  ws.getCell('L265').value = data.odpy.total;
  ws.getCell('M265').model.result = undefined;

  ws.getCell('L266').value = data.odpy.rider + data.private.rider + data.legal.rider;
  ws.getCell('M266').model.result = undefined;

  await excel.xlsx.writeFile(filePath);
}

async function handleSupplementThree(
  data: Data,
  path: string,
  excel: exceljs.Workbook
) {


}
