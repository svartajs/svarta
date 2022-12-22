import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const readmeName = "README.md";
const packagesFolder = resolve("packages");
const encoding = "utf-8"

const packages = readdirSync(packagesFolder);

const readmeContent = readFileSync(readmeName, encoding);

for (const folder of packages) {
  const path = resolve(packagesFolder, folder, readmeName);
  writeFileSync(path, readmeContent, encoding);
}
