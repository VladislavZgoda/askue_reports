import { LocalFileStorage } from "@mjackson/file-storage/local";

const excelStorage = new LocalFileStorage(
  './app/routes/generate-reports/.server/uploaded-excel'
);

export default excelStorage;
