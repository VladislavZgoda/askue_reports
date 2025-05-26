import exceljs from "exceljs";

type BalanceGroups = "private" | "legal" | "odpy";

interface MetersReadings {
  askue: number;
  rider: number;
}

type UploadedMetersReadings = Record<BalanceGroups, MetersReadings>;

// Key - наименование ТП (ТП-777), value - количество КС быт + юр.
type TpMetersReadings = Record<string, number>;

export default async function parseExcel(file: File) {
  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.load(await file.arrayBuffer());

  const wsPrivate = wb.worksheets[0];
  const wsOdpy = wb.worksheets[1];
  const wsLegal = wb.worksheets[2];

  const uploadedMetersReadings: UploadedMetersReadings = {
    private: {
      askue: 0,
      rider: 0,
    },
    legal: {
      askue: 0,
      rider: 0,
    },
    odpy: {
      askue: 0,
      rider: 0,
    },
  };

  const tpMetersReadings: TpMetersReadings = {};

  parseSheet(wsPrivate, uploadedMetersReadings.private, tpMetersReadings);
  parseSheet(wsLegal, uploadedMetersReadings.legal, tpMetersReadings);

  wsOdpy.getColumn("N").eachCell((cell, rowNumber) => {
    const transSub = cell.text.trim();

    if (!transSub.startsWith("ТП-")) return;

    const readingSource = wsOdpy.getCell("M" + rowNumber).text;

    if (readingSource.toLowerCase() === "ридер") {
      uploadedMetersReadings.odpy.rider += 1;
    } else {
      uploadedMetersReadings.odpy.askue += 1;
    }
  });

  return { uploadedMetersReadings, tpMetersReadings };
}

function parseSheet(
  ws: exceljs.Worksheet,
  metersReadings: MetersReadings,
  tpMetersReadings: TpMetersReadings,
) {
  ws.getColumn("N").eachCell((cell, rowNumber) => {
    const tp = cell.text;

    if (!tp.startsWith("ТП-")) return;

    if (!Object.hasOwn(tpMetersReadings, tp)) {
      tpMetersReadings[tp] = 0;
    }

    const readingSource = ws.getCell("M" + rowNumber).text;

    if (readingSource.toLowerCase() === "ридер") {
      metersReadings.rider += 1;
    } else {
      tpMetersReadings[tp] += 1;
      metersReadings.askue += 1;
    }
  });
}
