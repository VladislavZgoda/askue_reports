import exceljs from "exceljs";
import { selectAllSubstations } from "~/.server/db-queries/transformerSubstations";
import { selectSumTechnicalMeters } from "~/.server/db-queries/technicalMeters";

import {
  getODPUMeterCount,
  countUnregisteredMetersAtDate,
  accumulateMonthInstallationChanges,
  accumulatePeriodInstallationChanges,
  getPrivateMeterReportWithAdjustments,
  getLegalMeterReportsWithAdjustments,
} from "./db-actions/queryDbData";

import type { FormData } from "../generateReports";

export type Substations = Readonly<
  Awaited<ReturnType<typeof selectAllSubstations>>
>;

type ODPU = Readonly<Awaited<ReturnType<typeof getODPUMeterCount>>>;

type LegalMeters = Awaited<
  ReturnType<typeof getLegalMeterReportsWithAdjustments>
>;

type PrivateMeterReport = Readonly<
  Awaited<ReturnType<typeof getPrivateMeterReportWithAdjustments>>
>;

export default async function writeDbData(formData: FormData) {
  const path = "app/routes/generate-reports/.server/";

  const substations: Substations = await selectAllSubstations();

  const [privateMeters, legalMeters, odpu] = await Promise.all([
    getPrivateMeterReportWithAdjustments(
      formData.privateDate,
      formData.privateMonth,
    ),
    getLegalMeterReportsWithAdjustments(formData.legalDate, formData.legalDate),
    getODPUMeterCount(formData, substations),
  ]);

  await handlePrivateSector(path, privateMeters);

  await handleReport({
    path,
    privateMeters,
    legalMeters,
    substations,
    formData,
    odpu,
  });

  await handleSupplementThree({
    path,
    privateMeters,
    odpu,
    legalMeters,
    formData,
  });
}

async function handlePrivateSector(
  path: string,
  privateMeters: PrivateMeterReport,
) {
  const templatePath = path + "workbooks/private_sector.xlsx";
  const savePath = path + "filled-reports/Развитие ЧС.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  // Первые две строки заняты и не изменяются, для динамического определения последней
  // строки с формулами, их необходимо учесть в начальном отсчете.
  let rowCount = 2;

  ws.getColumn("A").eachCell((cell, rowNumber) => {
    const tp = cell.text.trim();

    if (!tp.startsWith("ТП")) return;

    rowCount += 1;

    const searchedStation = privateMeters.find(
      (station) => station.name === tp,
    );

    const registeredMeters = searchedStation?.registeredMeters ?? 0;

    ws.getCell("B" + rowNumber).value = registeredMeters;
    ws.getCell("G" + rowNumber).model.result = undefined;
    ws.getCell("H" + rowNumber).model.result = undefined;
  });

  resetResult(ws, rowCount + 1);

  // Без этой строки файл будет повреждён.
  ws.removeConditionalFormatting("");
  await excel.xlsx.writeFile(savePath);
}

interface Report {
  path: string;
  privateMeters: PrivateMeterReport;
  legalMeters: LegalMeters;
  odpu: ODPU;
  substations: Substations;
  formData: FormData;
}

async function handleReport({
  path,
  privateMeters,
  legalMeters,
  substations,
  formData,
  odpu,
}: Report) {
  const templatePath = path + "workbooks/report.xlsx";
  const savePath = path + "filled-reports/Отчет по дистанционным съемам.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  const [unregisteredMeterCount, yearMeters, monthMeters] = await Promise.all([
    countUnregisteredMetersAtDate(substations, formData),
    accumulatePeriodInstallationChanges({
      substations,
      formData,
      period: "year",
    }),
    accumulateMonthInstallationChanges(substations, formData),
  ]);

  // Первые 9 строк заняты и не изменяются, для динамического определения
  // строк после линий с ТП, их необходимо учесть в начальном отсчете.
  let rowCount = 9;

  ws.getColumn("B").eachCell((cell, rowNumber) => {
    const tp = cell.text.trim();

    if (!tp.startsWith("ТП")) return;

    rowCount += 1;

    const privateStation = privateMeters.find((station) => station.name === tp);
    const privateRegisteredMeters = privateStation?.registeredMeters ?? 0;

    const legalSimsStation = legalMeters.simsReport.find(
      (station) => station.name === tp,
    );

    const legalP2Station = legalMeters.p2Report.find(
      (station) => station.name === tp,
    );

    const legalSimsRegisteredMeters = legalSimsStation?.registeredMeters ?? 0;
    const legalP2RegisteredMeters = legalP2Station?.registeredMeters ?? 0;
    const legalMetersTotal =
      legalSimsRegisteredMeters + legalP2RegisteredMeters;

    const unregisteredMeters = unregisteredMeterCount[tp] ?? 0;

    const yearRegisteredMeters = yearMeters[tp]?.totalInstalled ?? 0;
    const yearUnregisteredMeters = yearMeters[tp]?.registeredCount ?? 0;

    const monthRegisteredMeters = monthMeters[tp]?.totalInstalled ?? 0;
    const monthUnregisteredMeters = monthMeters[tp]?.registeredCount ?? 0;

    ws.getCell("H" + rowNumber).value =
      privateRegisteredMeters + legalMetersTotal;
    ws.getCell("I" + rowNumber).value = privateRegisteredMeters;
    ws.getCell("J" + rowNumber).value = legalMetersTotal;
    ws.getCell("K" + rowNumber).value = legalP2RegisteredMeters;
    ws.getCell("P" + rowNumber).value = unregisteredMeters;
    ws.getCell("Q" + rowNumber).value = yearRegisteredMeters;
    ws.getCell("R" + rowNumber).value = yearUnregisteredMeters;
    ws.getCell("S" + rowNumber).value = monthRegisteredMeters;
    ws.getCell("T" + rowNumber).value = monthUnregisteredMeters;
    ws.getCell("O" + rowNumber).model.result = undefined;
  });

  const odpyRow = rowCount + 1;

  ws.getCell(`H${odpyRow}`).value = odpu.registeredMeterCount;
  ws.getCell(`P${odpyRow}`).value = odpu.unregisteredMeterCount;

  ws.getCell(`Q${odpyRow}`).value = odpu.year.totalInstalled;
  ws.getCell(`R${odpyRow}`).value = odpu.year.registeredCount;

  ws.getCell(`S${odpyRow}`).value = odpu.month.totalInstalled;
  ws.getCell(`T${odpyRow}`).value = odpu.month.registeredCount;

  resetResult(ws, rowCount + 3);

  ws.getCell(`H${rowCount + 4}`).model.result = undefined;
  ws.getCell(`H${rowCount + 5}`).model.result = undefined;

  ws.getCell("A4").value =
    'Отчет филиала АО "Электросети Кубани" "Тимашевскэлектросеть" ' +
    `по работе систем  дистанционного съема показаний за ${formData.month} ${formData.year} года`;

  // Без этой строки файл будет повреждён, не объяснимо но факт.
  ws.removeConditionalFormatting("");
  await excel.xlsx.writeFile(savePath);
}

type SupplementThree = Omit<Report, "substations">;

async function handleSupplementThree({
  path,
  privateMeters,
  legalMeters,
  odpu,
  formData,
}: SupplementThree) {
  const templatePath = path + "workbooks/supplement_three.xlsx";
  const savePath = path + "filled-reports/Приложение №3.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[2];

  const privateMetersTotal = calculateMetersTotal(privateMeters);

  ws.getCell("D29").value =
    privateMetersTotal.registeredMetersTotal +
    privateMetersTotal.unregisteredMetersTotal;

  ws.getCell("E29").value = privateMetersTotal.registeredMetersTotal;

  const legalSimsMeters = calculateMetersTotal(legalMeters.simsReport);
  const legalP2Meters = calculateMetersTotal(legalMeters.p2Report);

  const legalRegisteredMeters =
    legalSimsMeters.registeredMetersTotal + legalP2Meters.registeredMetersTotal;

  const legalUnregisteredMeters =
    legalSimsMeters.unregisteredMetersTotal +
    legalP2Meters.unregisteredMetersTotal;

  const technicalMeters = await selectSumTechnicalMeters();

  const technicalMetersQuantity = Number(technicalMeters[0].quantity ?? 0);
  const technicalMetersUnderVoltage = Number(
    technicalMeters[0].underVoltage ?? 0,
  );

  ws.getCell("Y29").value = technicalMetersQuantity;
  ws.getCell("Z29").value = technicalMetersUnderVoltage;

  const notUnderVoltage = technicalMetersQuantity - technicalMetersUnderVoltage;
  ws.getCell("AB29").value =
    `Технический учет - ${notUnderVoltage} шт. не под напряжением`;

  ws.getCell("F29").value = legalRegisteredMeters + legalUnregisteredMeters;
  ws.getCell("G29").value = legalRegisteredMeters;

  ws.getCell("H29").value =
    odpu.registeredMeterCount + odpu.unregisteredMeterCount;

  ws.getCell("I29").value = odpu.registeredMeterCount;

  resetResult(ws, 29);
  resetResult(ws, 33);

  ws.getCell("A2").value =
    `Отчетная форма за ${formData.month} ${formData.year}`;

  await excel.xlsx.writeFile(savePath);
}

// Сбросить результат формул, чтобы при открытие файла значение пересчиталось.
function resetResult(ws: exceljs.Worksheet, rowNumber: number) {
  ws.getRow(rowNumber).eachCell((cell) => (cell.model.result = undefined));
}

function calculateMetersTotal(stationReport: PrivateMeterReport) {
  let registeredMetersTotal = 0;
  let unregisteredMetersTotal = 0;

  stationReport.forEach((stationReport) => {
    registeredMetersTotal += stationReport.registeredMeters;
    unregisteredMetersTotal += stationReport.unregisteredMeters;
  });

  return {
    registeredMetersTotal,
    unregisteredMetersTotal,
  } as const;
}
