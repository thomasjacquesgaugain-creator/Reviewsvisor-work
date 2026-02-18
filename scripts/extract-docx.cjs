const mammoth = require("mammoth");
const path = require("path");

const legalDir = path.join(__dirname, "..", "legal");
const files = [
  "Reviewsvisor - CGU 01-2026 rev.docx",
  "Reviewsvisor - Mentions legales 01-2026 rev.docx",
  "Reviewsvisor - Politique Confidentialite 01-2026 rev.docx",
  "Reviewsvisor - Politique Cookies 01-2026 rev.docx",
];

async function extract(name) {
  const filePath = path.join(legalDir, name);
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

const outDir = path.join(__dirname, "..", "legal", "out");
const fs = require("fs");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function main() {
  for (const name of files) {
    const text = await extract(name);
    const base = name.replace(/\.docx$/, "").replace(/\s+/g, "_");
    fs.writeFileSync(path.join(outDir, base + ".txt"), text, "utf8");
    console.log("Written " + base + ".txt");
  }
}

main().catch(console.error);
