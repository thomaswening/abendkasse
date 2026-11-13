// Throwaway spike code for OPEN-G (docs/requirements.md#open-g): draws one invoice with pdf-lib.
// Runs in the browser (globals PDFLib and fontkit) and in Node (tools/reference-hash.js), so the
// spike can compare the bytes made by different JavaScript engines.

/** Invented test data only (REQ-024). */
const SPIKE_INVOICE = Object.freeze({
  number: "2026-1112-1834",
  invoiceDate: { year: 2026, month: 11, day: 12 },
  performer: {
    name: "Max Mustermann",
    stageName: "DJ Example",
    street: "Musterstraße 12",
    postalCode: "20095",
    city: "Hamburg",
    email: "max@example.com",
    phone: "+49 40 1234567",
    taxNumber: "12/345/67890",
    bank: {
      holder: "Max Mustermann",
      iban: "DE89 3704 0044 0532 0130 00",
      bic: "COBADEFFXXX",
      name: "Beispielbank",
    },
  },
  client: {
    name: "Example Events GmbH",
    street: "Beispielweg 5",
    postalCode: "50667",
    city: "Köln",
    email: "booking@example.com",
  },
  venue: { name: "Großer Saal", city: "Köln" },
  gig: {
    eventName: "Example Night",
    date: { year: 2026, month: 9, day: 19 },
    startTime: "23:00",
    endTime: "01:00",
    feeCents: 25000,
  },
});

// Fixed so that two runs can produce identical bytes (REQ-017 acceptance).
const FIXED_CREATION_DATE = new Date(Date.UTC(2026, 10, 12, 17, 34, 0));
const PRODUCER = "abendkasse share-and-pdf spike";
// pdf-lib otherwise names an embedded font with a pseudo-random suffix.
const REGULAR_FONT_NAME = "AAAAAA+NotoSans-Regular";
const BOLD_FONT_NAME = "AAAAAB+NotoSans-Bold";
const ATTACHMENT_NAME = "rechnung.json";

const POINTS_PER_MM = 72 / 25.4;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// DIN 5008 form B positions, in mm from the left and top edges of the page.
const TEXT_LEFT_MM = 25;
const TEXT_RIGHT_MM = 190;
const RETURN_ADDRESS_TOP_MM = 50;
const ADDRESS_TOP_MM = 62.7;
const INFO_BLOCK_LEFT_MM = 125;
const INFO_BLOCK_TOP_MM = 50;
const FOLD_MARKS_MM = [105, 210];
const HOLE_MARK_MM = 148.5;

const HEADER_TOP_MM = 18;
const TITLE_TOP_MM = 103;
const SALUTATION_TOP_MM = 115;
const TABLE_TOP_MM = 132;
const TABLE_DESCRIPTION_LEFT_MM = 37;
const TABLE_DESCRIPTION_RIGHT_MM = 160;
const FOOTER_RULE_MM = 270;
const FOOTER_COLUMNS_MM = [25, 85, 145];

const BODY_SIZE = 10;
const SMALL_SIZE = 7;
const FOOTER_SIZE = 7.5;
const LINE_HEIGHT_FACTOR = 1.25;
const RULE_THICKNESS = 0.5;

function pad2(value) {
  return String(value).padStart(2, "0");
}

/** "19.09.2026"; written by hand so that no locale data can change the bytes. */
function formatGermanDate(date) {
  return `${pad2(date.day)}.${pad2(date.month)}.${date.year}`;
}

/** "1.250,00 EUR" from 125000 cents. */
function formatEuro(cents) {
  const euros = Math.floor(cents / 100);
  const centPart = pad2(cents % 100);
  const grouped = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped},${centPart} EUR`;
}

function nextDay(date) {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
}

/** The item line of REQ-006, with both dates for a gig past midnight (REQ-007). */
function itemText(invoice) {
  const gig = invoice.gig;
  const endsNextDay = gig.endTime < gig.startTime;
  const endDate = endsNextDay ? nextDay(gig.date) : gig.date;
  return (
    `DJ-Tätigkeit am ${formatGermanDate(gig.date)}, von ${gig.startTime} Uhr ` +
    `bis ${formatGermanDate(endDate)} um ${gig.endTime} Uhr, ` +
    `„${gig.eventName}“, ${invoice.venue.name}, ${invoice.venue.city}`
  );
}

function emailSubject(invoice) {
  return `Rechnung ${invoice.number} – ${invoice.gig.eventName}, ${formatGermanDate(invoice.gig.date)}`;
}

function emailBody(invoice) {
  const performer = invoice.performer;
  return [
    "Sehr geehrte Damen und Herren,",
    "",
    `anbei meine Rechnung ${invoice.number} für „${invoice.gig.eventName}“ am ${formatGermanDate(invoice.gig.date)}.`,
    "",
    "Mit freundlichen Grüßen",
    `${performer.name} (${performer.stageName})`,
  ].join("\n");
}

/** REQ-020 default preset, with the transliteration rules. */
function fileNamePart(text) {
  return text
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 -]/g, "")
    .trim().replace(/ +/g, "-");
}

function invoiceFileName(invoice) {
  return `Rechnung_${invoice.number}_${fileNamePart(invoice.venue.name)}.pdf`;
}

function oneLineAddress(party) {
  return `${party.name} · ${party.street} · ${party.postalCode} ${party.city}`;
}

/** Breaks text into lines no wider than maxWidth points. */
function wrapText(text, font, size, maxWidth) {
  const lines = [];
  let current = "";
  for (const word of text.split(" ")) {
    const candidate = current === "" ? word : `${current} ${word}`;
    if (current !== "" && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  lines.push(current);
  return lines;
}

/** Wraps a pdf-lib page with a writer that takes positions in mm from the top-left corner. */
function makeCanvas(page, fonts, rgb) {
  const pageHeight = page.getHeight();
  const toX = (mm) => mm * POINTS_PER_MM;
  const toY = (mmFromTop, size) => pageHeight - mmFromTop * POINTS_PER_MM - size;
  const black = rgb(0, 0, 0);

  return {
    fonts,
    lineHeightMm: (size) => (size * LINE_HEIGHT_FACTOR) / POINTS_PER_MM,
    text(text, leftMm, topMm, { size = BODY_SIZE, bold = false } = {}) {
      const font = bold ? fonts.bold : fonts.regular;
      page.drawText(text, { x: toX(leftMm), y: toY(topMm, size), size, font, color: black });
    },
    textRight(text, rightMm, topMm, { size = BODY_SIZE, bold = false } = {}) {
      const font = bold ? fonts.bold : fonts.regular;
      const width = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: toX(rightMm) - width, y: toY(topMm, size), size, font, color: black });
    },
    lines(lines, leftMm, topMm, options = {}) {
      const step = this.lineHeightMm(options.size ?? BODY_SIZE);
      lines.forEach((line, index) => this.text(line, leftMm, topMm + index * step, options));
      return topMm + lines.length * step;
    },
    rule(leftMm, rightMm, topMm, thickness = RULE_THICKNESS) {
      const y = pageHeight - topMm * POINTS_PER_MM;
      page.drawLine({ start: { x: toX(leftMm), y }, end: { x: toX(rightMm), y }, thickness, color: black });
    },
    widthMm(text, size, bold = false) {
      return (bold ? fonts.bold : fonts.regular).widthOfTextAtSize(text, size) / POINTS_PER_MM;
    },
  };
}

function drawHeader(canvas, performer) {
  canvas.text(performer.stageName, TEXT_LEFT_MM, HEADER_TOP_MM, { size: 18, bold: true });
  canvas.lines(
    [oneLineAddress(performer), `${performer.email} · ${performer.phone}`],
    TEXT_LEFT_MM, HEADER_TOP_MM + 9, { size: 9 },
  );
}

function drawAddressField(canvas, invoice) {
  const returnAddress = oneLineAddress(invoice.performer);
  canvas.text(returnAddress, TEXT_LEFT_MM, RETURN_ADDRESS_TOP_MM, { size: SMALL_SIZE });
  const underlineTopMm = RETURN_ADDRESS_TOP_MM + canvas.lineHeightMm(SMALL_SIZE);
  canvas.rule(TEXT_LEFT_MM, TEXT_LEFT_MM + canvas.widthMm(returnAddress, SMALL_SIZE), underlineTopMm, 0.3);
  const client = invoice.client;
  canvas.lines([client.name, client.street, `${client.postalCode} ${client.city}`], TEXT_LEFT_MM, ADDRESS_TOP_MM);
}

function drawInfoBlock(canvas, invoice) {
  const rows = [
    ["Rechnungsnummer:", invoice.number],
    ["Rechnungsdatum:", formatGermanDate(invoice.invoiceDate)],
    ["Leistungsdatum:", formatGermanDate(invoice.gig.date)],
  ];
  const step = canvas.lineHeightMm(BODY_SIZE);
  rows.forEach(([label, value], index) => {
    const topMm = INFO_BLOCK_TOP_MM + index * step;
    canvas.text(label, INFO_BLOCK_LEFT_MM, topMm);
    canvas.textRight(value, TEXT_RIGHT_MM, topMm);
  });
}

function drawLetterOpening(canvas) {
  canvas.text("Rechnung", TEXT_LEFT_MM, TITLE_TOP_MM, { size: 14, bold: true });
  canvas.lines(
    ["Sehr geehrte Damen und Herren,", "", "für meine Leistung stelle ich Ihnen in Rechnung:"],
    TEXT_LEFT_MM, SALUTATION_TOP_MM,
  );
}

/** Draws the item table and returns where it ends, in mm from the top. */
function drawItemTable(canvas, invoice) {
  const step = canvas.lineHeightMm(BODY_SIZE);
  canvas.text("Pos.", TEXT_LEFT_MM, TABLE_TOP_MM, { bold: true });
  canvas.text("Beschreibung", TABLE_DESCRIPTION_LEFT_MM, TABLE_TOP_MM, { bold: true });
  canvas.textRight("Betrag", TEXT_RIGHT_MM, TABLE_TOP_MM, { bold: true });
  canvas.rule(TEXT_LEFT_MM, TEXT_RIGHT_MM, TABLE_TOP_MM + step + 1);

  const rowTopMm = TABLE_TOP_MM + step + 3;
  const descriptionWidth = (TABLE_DESCRIPTION_RIGHT_MM - TABLE_DESCRIPTION_LEFT_MM) * POINTS_PER_MM;
  const descriptionLines = wrapText(itemText(invoice), canvas.fonts.regular, BODY_SIZE, descriptionWidth);
  canvas.text("1", TEXT_LEFT_MM, rowTopMm);
  const rowEndMm = canvas.lines(descriptionLines, TABLE_DESCRIPTION_LEFT_MM, rowTopMm);
  canvas.textRight(formatEuro(invoice.gig.feeCents), TEXT_RIGHT_MM, rowTopMm);
  canvas.rule(TEXT_LEFT_MM, TEXT_RIGHT_MM, rowEndMm + 1);

  const totalTopMm = rowEndMm + 3;
  canvas.text("Gesamtbetrag", TABLE_DESCRIPTION_LEFT_MM, totalTopMm, { bold: true });
  canvas.textRight(formatEuro(invoice.gig.feeCents), TEXT_RIGHT_MM, totalTopMm, { bold: true });
  const totalEndMm = totalTopMm + step + 1;
  canvas.rule(TEXT_LEFT_MM, TEXT_RIGHT_MM, totalEndMm);
  canvas.rule(TEXT_LEFT_MM, TEXT_RIGHT_MM, totalEndMm + 0.8);
  return totalEndMm + 0.8;
}

function drawClosing(canvas, invoice, topMm) {
  canvas.lines(
    [
      "Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.",
      "",
      "Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf das unten genannte Konto.",
      "Vielen Dank für die gute Zusammenarbeit!",
      "",
      "Mit freundlichen Grüßen",
      "",
      invoice.performer.name,
    ],
    TEXT_LEFT_MM, topMm,
  );
}

function drawFooter(canvas, performer) {
  canvas.rule(TEXT_LEFT_MM, TEXT_RIGHT_MM, FOOTER_RULE_MM, 0.3);
  const columns = [
    [`${performer.name} (${performer.stageName})`, performer.street, `${performer.postalCode} ${performer.city}`],
    [`Kontoinhaber: ${performer.bank.holder}`, `IBAN: ${performer.bank.iban}`, `BIC: ${performer.bank.bic} · ${performer.bank.name}`],
    [`Steuernummer: ${performer.taxNumber}`, performer.email, performer.phone],
  ];
  columns.forEach((column, index) => {
    canvas.lines(column, FOOTER_COLUMNS_MM[index], FOOTER_RULE_MM + 3, { size: FOOTER_SIZE });
  });
}

function drawFoldMarks(canvas) {
  FOLD_MARKS_MM.forEach((topMm) => canvas.rule(0, 5, topMm, 0.3));
  canvas.rule(0, 7, HOLE_MARK_MM, 0.3);
}

async function embedFonts(pdfDocument, fontBytes) {
  return {
    regular: await pdfDocument.embedFont(fontBytes.regular, { subset: true, customName: REGULAR_FONT_NAME }),
    bold: await pdfDocument.embedFont(fontBytes.bold, { subset: true, customName: BOLD_FONT_NAME }),
  };
}

function setFixedMetadata(pdfDocument, invoice) {
  pdfDocument.setTitle(`Rechnung ${invoice.number}`);
  pdfDocument.setAuthor(invoice.performer.name);
  pdfDocument.setSubject(emailSubject(invoice));
  pdfDocument.setLanguage("de-DE");
  pdfDocument.setProducer(PRODUCER);
  pdfDocument.setCreator(PRODUCER);
  pdfDocument.setCreationDate(FIXED_CREATION_DATE);
  pdfDocument.setModificationDate(FIXED_CREATION_DATE);
}

/** The invoice data as a PDF file attachment, for the history idea of REQ-033. */
async function attachInvoiceData(pdfDocument, invoice, PDFLib) {
  const json = JSON.stringify({ schema: "abendkasse-spike/1", invoice }, null, 2);
  await pdfDocument.attach(new TextEncoder().encode(json), ATTACHMENT_NAME, {
    mimeType: "application/json",
    description: `Rechnungsdaten ${invoice.number}`,
    creationDate: FIXED_CREATION_DATE,
    modificationDate: FIXED_CREATION_DATE,
    afRelationship: PDFLib.AFRelationship.Data,
  });
}

/**
 * Builds the invoice PDF.
 * @param {object} PDFLib the pdf-lib module
 * @param {object} fontkit the @pdf-lib/fontkit module
 * @param {{regular: Uint8Array, bold: Uint8Array}} fontBytes TrueType fonts to embed
 * @param {object} invoice data shaped like SPIKE_INVOICE
 * @returns {Promise<{bytes: Uint8Array, pageCount: number}>}
 */
async function buildInvoicePdf(PDFLib, fontkit, fontBytes, invoice) {
  const pdfDocument = await PDFLib.PDFDocument.create({ updateMetadata: false });
  pdfDocument.registerFontkit(fontkit);
  const fonts = await embedFonts(pdfDocument, fontBytes);
  const page = pdfDocument.addPage([A4_WIDTH_MM * POINTS_PER_MM, A4_HEIGHT_MM * POINTS_PER_MM]);
  const canvas = makeCanvas(page, fonts, PDFLib.rgb);

  drawFoldMarks(canvas);
  drawHeader(canvas, invoice.performer);
  drawAddressField(canvas, invoice);
  drawInfoBlock(canvas, invoice);
  drawLetterOpening(canvas);
  const tableEndMm = drawItemTable(canvas, invoice);
  drawClosing(canvas, invoice, tableEndMm + 8);
  drawFooter(canvas, invoice.performer);

  setFixedMetadata(pdfDocument, invoice);
  await attachInvoiceData(pdfDocument, invoice, PDFLib);
  const bytes = await pdfDocument.save();
  return { bytes, pageCount: pdfDocument.getPageCount() };
}

if (typeof module !== "undefined") {
  module.exports = { SPIKE_INVOICE, buildInvoicePdf, emailSubject, emailBody, invoiceFileName, fileNamePart };
}
