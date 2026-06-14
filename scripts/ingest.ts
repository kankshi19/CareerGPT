import fs from "fs";
import path from "path";

type Dataset = { skills?: any[]; roles?: any[]; projects?: any[] };

const file = process.argv[2];
if (!file) {
  console.error("Usage: ts-node scripts/ingest.ts <file.json>");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(path.resolve(file), "utf8")) as Dataset;
console.log(JSON.stringify({ received: Object.keys(raw), status: "normalized-for-ingestion" }, null, 2));
