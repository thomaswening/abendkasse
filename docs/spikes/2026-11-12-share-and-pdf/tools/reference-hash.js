// Builds the spike invoice in Node with the vendored pdf-lib and prints its SHA-256,
// so the page can compare a browser's bytes with Node's V8. Usage:
//   node docs/spikes/2026-11-12-share-and-pdf/tools/reference-hash.js [out.pdf]
const { createHash } = require("node:crypto");
const { readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const spikeFolder = path.join(__dirname, "..");
const PDFLib = require(path.join(spikeFolder, "vendor", "pdf-lib-1.17.1.min.js"));
const fontkit = require(path.join(spikeFolder, "vendor", "fontkit-1.1.1.umd.min.js"));
const { SPIKE_INVOICE, buildInvoicePdf } = require(path.join(spikeFolder, "invoice-pdf.js"));

async function main() {
  const fontBytes = {
    regular: readFileSync(path.join(spikeFolder, "fonts", "NotoSans-Regular.ttf")),
    bold: readFileSync(path.join(spikeFolder, "fonts", "NotoSans-Bold.ttf")),
  };
  const { bytes, pageCount } = await buildInvoicePdf(PDFLib, fontkit, fontBytes, SPIKE_INVOICE);
  const outputPath = process.argv[2];
  if (outputPath) {
    writeFileSync(outputPath, bytes);
  }
  const hash = createHash("sha256").update(bytes).digest("hex");
  console.log(JSON.stringify({ hash, byteCount: bytes.length, pageCount }));
}

main();
