import { createReadableStreamFromReadable } from '@remix-run/node';
import fs from 'fs';

export const loader = async () => {
  const filePath = 'app/routes/generate-reports/.server/filled-reports/report.xlsx';
  const file = createReadableStreamFromReadable(fs.createReadStream(filePath));

  return new Response(file, {
    headers: {
      'Content-Disposition': 'attachment; filename="report.xlsx"',
      'Content-Type': 'text/markdown',
    },
  });
};