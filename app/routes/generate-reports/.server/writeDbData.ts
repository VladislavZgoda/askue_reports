import exceljs from "exceljs";
import { getTechnicalMetersTotals } from "~/.server/db-queries/technical-meters";

import {
  getPrivateMeterReportWithAdjustments,
  getMeterReportsWithAdjustments,
} from "./db-actions/queryDbData";

import type { FormData } from "../generateReports";

type ODPU = Readonly<
  Awaited<ReturnType<typeof getMeterReportsWithAdjustments>>
>;

type LegalMeters = Awaited<ReturnType<typeof getMeterReportsWithAdjustments>>;

type MeterReport = Readonly<
  Awaited<ReturnType<typeof getPrivateMeterReportWithAdjustments>>
>;

export default async function writeDbData(formData: FormData) {
  const path = "app/routes/generate-reports/.server/";

  const [privateMeters, legalMeters, odpu] = await Promise.all([
    getPrivateMeterReportWithAdjustments(
      formData.privateDate,
      formData.privateMonth,
    ),
    getMeterReportsWithAdjustments(
      "legal",
      formData.legalDate,
      formData.legalMonth,
    ),
    getMeterReportsWithAdjustments(
      "odpu",
      formData.odpuDate,
      formData.odpuMonth,
    ),
  ]);

  await handlePrivateSector(path, privateMeters);

  await handleReport({
    path,
    privateMeters,
    legalMeters,
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

async function handlePrivateSector(path: string, privateMeters: MeterReport) {
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
  privateMeters: MeterReport;
  legalMeters: LegalMeters;
  odpu: ODPU;
  formData: FormData;
}

async function handleReport({
  path,
  privateMeters,
  legalMeters,
  formData,
  odpu,
}: Report) {
  const templatePath = path + "workbooks/report.xlsx";
  const savePath = path + "filled-reports/Отчет по дистанционным съемам.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  // Первые 9 строк заняты и не изменяются, для динамического определения
  // строк после линий с ТП, их необходимо учесть в начальном отсчете.
  let rowCount = 9;

  ws.getColumn("B").eachCell((cell, rowNumber) => {
    const tp = cell.text.trim();

    if (!tp.startsWith("ТП")) return;

    rowCount += 1;

    const privateStation = privateMeters.find((station) => station.name === tp);
    const privateRegisteredMeters = privateStation?.registeredMeters ?? 0;
    const privateUnregisteredMeters = privateStation?.unregisteredMeters ?? 0;

    const legalSimsStation = legalMeters.simsReport.find(
      (station) => station.name === tp,
    );

    const legalSimsRegisteredMeters = legalSimsStation?.registeredMeters ?? 0;
    const legalSimsUnregisteredMeters =
      legalSimsStation?.unregisteredMeters ?? 0;

    const legalP2Station = legalMeters.p2Report.find(
      (station) => station.name === tp,
    );

    const legalP2RegisteredMeters = legalP2Station?.registeredMeters ?? 0;
    const legalP2UnregisteredMeters = legalP2Station?.unregisteredMeters ?? 0;

    const legalMetersTotal =
      legalSimsRegisteredMeters + legalP2RegisteredMeters;

    const unregisteredMetersTotal =
      privateUnregisteredMeters +
      legalSimsUnregisteredMeters +
      legalP2UnregisteredMeters;

    const yearTotalInstalled =
      (privateStation?.yearlyMeterInstallations.totalInstalled ?? 0) +
      (legalSimsStation?.yearlyMeterInstallations.totalInstalled ?? 0) +
      (legalP2Station?.yearlyMeterInstallations.totalInstalled ?? 0);

    const yearRegisteredCount =
      (privateStation?.yearlyMeterInstallations.registeredCount ?? 0) +
      (legalSimsStation?.yearlyMeterInstallations.registeredCount ?? 0) +
      (legalP2Station?.yearlyMeterInstallations.registeredCount ?? 0);

    const monthTotalInstalled =
      (privateStation?.monthlyMeterInstallations.totalInstalled ?? 0) +
      (legalSimsStation?.monthlyMeterInstallations.totalInstalled ?? 0) +
      (legalP2Station?.monthlyMeterInstallations.totalInstalled ?? 0);

    const monthRegisteredCount =
      (privateStation?.monthlyMeterInstallations.registeredCount ?? 0) +
      (legalSimsStation?.monthlyMeterInstallations.registeredCount ?? 0) +
      (legalP2Station?.monthlyMeterInstallations.registeredCount ?? 0);

    ws.getCell("H" + rowNumber).value =
      privateRegisteredMeters + legalMetersTotal;

    ws.getCell("I" + rowNumber).value = privateRegisteredMeters;
    ws.getCell("J" + rowNumber).value = legalMetersTotal;
    ws.getCell("K" + rowNumber).value = legalP2RegisteredMeters;
    ws.getCell("P" + rowNumber).value = unregisteredMetersTotal;
    ws.getCell("Q" + rowNumber).value = yearTotalInstalled;
    ws.getCell("R" + rowNumber).value = yearRegisteredCount;
    ws.getCell("S" + rowNumber).value = monthTotalInstalled;
    ws.getCell("T" + rowNumber).value = monthRegisteredCount;
    ws.getCell("O" + rowNumber).model.result = undefined;
  });

  const odpyRow = rowCount + 1;

  const odpuSimsMeters = calculateMetersTotal(odpu.simsReport);
  const odpuP2Meters = calculateMetersTotal(odpu.p2Report);

  const odpuRegisteredMeters =
    odpuSimsMeters.registeredMetersTotal + odpuP2Meters.registeredMetersTotal;

  const odpuUnregisteredMeters =
    odpuSimsMeters.unregisteredMetersTotal +
    odpuP2Meters.unregisteredMetersTotal;

  const odpuPeriodSimsMeters = calculatePeriodMetersTotal(odpu.simsReport);
  const odpuPeriodP2Meters = calculatePeriodMetersTotal(odpu.p2Report);

  const yearOdpuTotalInstalled =
    odpuPeriodSimsMeters.yearTotalInstalled +
    odpuPeriodP2Meters.yearTotalInstalled;

  const yearOdpuRegisteredCount =
    odpuPeriodSimsMeters.yearRegisteredCount +
    odpuPeriodP2Meters.yearRegisteredCount;

  const monthOdpuTotalInstalled =
    odpuPeriodSimsMeters.monthTotalInstalled +
    odpuPeriodP2Meters.monthTotalInstalled;

  const monthOdpuRegisteredCount =
    odpuPeriodSimsMeters.monthRegisteredCount +
    odpuPeriodP2Meters.monthRegisteredCount;

  ws.getCell(`H${odpyRow}`).value = odpuRegisteredMeters;
  ws.getCell(`P${odpyRow}`).value = odpuUnregisteredMeters;

  ws.getCell(`Q${odpyRow}`).value = yearOdpuTotalInstalled;
  ws.getCell(`R${odpyRow}`).value = yearOdpuRegisteredCount;

  ws.getCell(`S${odpyRow}`).value = monthOdpuTotalInstalled;
  ws.getCell(`T${odpyRow}`).value = monthOdpuRegisteredCount;

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

async function handleSupplementThree({
  path,
  privateMeters,
  legalMeters,
  odpu,
  formData,
}: Report) {
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

  ws.getCell("F29").value = legalRegisteredMeters + legalUnregisteredMeters;
  ws.getCell("G29").value = legalRegisteredMeters;

  const odpuSimsMeters = calculateMetersTotal(odpu.simsReport);
  const odpuP2Meters = calculateMetersTotal(odpu.p2Report);

  const odpuRegisteredMeters =
    odpuSimsMeters.registeredMetersTotal + odpuP2Meters.registeredMetersTotal;

  const odpuUnregisteredMeters =
    odpuSimsMeters.unregisteredMetersTotal +
    odpuP2Meters.unregisteredMetersTotal;

  ws.getCell("H29").value = odpuRegisteredMeters + odpuUnregisteredMeters;
  ws.getCell("I29").value = odpuRegisteredMeters;

  const technicalMeters = await getTechnicalMetersTotals();

  const technicalMetersQuantity = Number(technicalMeters.quantity ?? 0);
  const technicalMetersUnderVoltage = Number(technicalMeters.underVoltage ?? 0);

  ws.getCell("Y29").value = technicalMetersQuantity;
  ws.getCell("Z29").value = technicalMetersUnderVoltage;

  const notUnderVoltage = technicalMetersQuantity - technicalMetersUnderVoltage;

  ws.getCell("AB29").value =
    `Технический учет - ${notUnderVoltage} шт. не под напряжением`;

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

function calculateMetersTotal(stationReport: MeterReport) {
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

function calculatePeriodMetersTotal(stationReport: MeterReport) {
  let yearTotalInstalled = 0;
  let yearRegisteredCount = 0;
  let monthTotalInstalled = 0;
  let monthRegisteredCount = 0;

  stationReport.forEach((stationReport) => {
    yearTotalInstalled += stationReport.yearlyMeterInstallations.totalInstalled;
    yearRegisteredCount +=
      stationReport.yearlyMeterInstallations.registeredCount;
    monthTotalInstalled +=
      stationReport.monthlyMeterInstallations.totalInstalled;
    monthRegisteredCount +=
      stationReport.monthlyMeterInstallations.registeredCount;
  });

  return {
    yearTotalInstalled,
    yearRegisteredCount,
    monthTotalInstalled,
    monthRegisteredCount,
  } as const;
}
