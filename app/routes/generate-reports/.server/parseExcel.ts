import exceljs from "exceljs";
import excelStorage from "~/routes/generate-reports/.server/fileStorage";
import type stream from "node:stream";

export default async function parseExcel() {
  const excel = new exceljs.Workbook();

  const file = await excelStorage.get("supplementNine");

  const wb = await excel.xlsx.read(file?.stream() as unknown as stream);

  const wsPrivate = wb.worksheets[0];
  const wsOdpy = wb.worksheets[1];
  const wsLegal = wb.worksheets[2];

  const data = {
    private: {
      total: 0,
      rider: 0,
    },
    legal: {
      total: 0,
      rider: 0,
    },
    odpy: {
      total: 0,
      rider: 0,
    },
  };

  parseSheet(wsPrivate, data.private);
  parseSheet(wsLegal, data.legal);

  wsOdpy.getColumn("N").eachCell((cell, rowNumber) => {
    const transSub = cell.text.trim();

    if (!transSub.startsWith("ТП-")) return;

    const readingSource = wsOdpy.getCell("M" + rowNumber).text;

    if (readingSource.toLowerCase() === "ридер") {
      data.odpy.rider += 1;
    } else {
      data.odpy.total += 1;
    }
  });

  return data;
}

function parseSheet(ws: exceljs.Worksheet, data: Record<string, number>) {
  ws.getColumn("N").eachCell((cell, rowNumber) => {
    const transSub = cell.text;

    if (!transSub.startsWith("ТП-")) return;

    if (!Object.prototype.hasOwnProperty.call(data, transSub)) {
      data[transSub] = 0;
    }

    const readingSource = ws.getCell("M" + rowNumber).text;

    if (readingSource.toLowerCase() === "ридер") {
      data.rider += 1;
    } else {
      data[transSub] += 1;
      data.total += 1;
    }
  });
}
