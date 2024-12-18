import { FlatCache } from "flat-cache";

let cache: FlatCache;

declare global {
  var __cache: FlatCache | undefined;
}

if (!global.__cache) {
  global.__cache = new FlatCache();
}

cache = global.__cache;

export default cache;
