import crypto from "crypto";

export default function createEtagHash(data: object) {
  return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}
