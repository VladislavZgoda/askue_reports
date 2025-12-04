import { stat } from "node:fs/promises";

export async function isDirExists(path: string) {
  try {
    return (await stat(path)).isDirectory();
  } catch (e) {
    console.log(e);
    return false;
  }
}
