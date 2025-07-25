import { createReadableStreamFromReadable } from "@react-router/node";
import fs from "fs";

export const loader = () => {
  const filePath =
    "app/routes/generate-reports/.server/reports-archive/reports.zip";
  const file = createReadableStreamFromReadable(fs.createReadStream(filePath));

  return new Response(file, {
    headers: {
      "Content-Disposition": `attachment; filename="${encodeURI("Отчеты.zip")}"`,
      "Content-Type": "application/zip",
    },
  });
};
