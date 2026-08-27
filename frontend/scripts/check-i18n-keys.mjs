import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function flattenKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value, path);
    }
    return [path];
  });
}

function loadMessages(locale) {
  const filePath = join(root, "messages", `${locale}.json`);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const enKeys = new Set(flattenKeys(loadMessages("en")));
const hiKeys = new Set(flattenKeys(loadMessages("hi")));

const missingInHi = [...enKeys].filter((key) => !hiKeys.has(key));
const missingInEn = [...hiKeys].filter((key) => !enKeys.has(key));

if (missingInHi.length || missingInEn.length) {
  console.error("i18n key mismatch detected");
  if (missingInHi.length) {
    console.error(`Missing in hi.json (${missingInHi.length}):`);
    missingInHi.slice(0, 20).forEach((key) => console.error(`  - ${key}`));
  }
  if (missingInEn.length) {
    console.error(`Missing in en.json (${missingInEn.length}):`);
    missingInEn.slice(0, 20).forEach((key) => console.error(`  - ${key}`));
  }
  process.exit(1);
}

console.log(`i18n check passed: ${enKeys.size} keys in en/hi`);
