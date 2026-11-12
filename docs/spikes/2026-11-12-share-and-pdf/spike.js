// Throwaway spike page for OPEN-B, OPEN-G and the save path of REQ-019.
// Not product code: it exists to answer the nine questions of the spike once.
"use strict";

const SPIKE_VERSION = "2026-11-12.1";
// SHA-256 of the spike invoice built by tools/reference-hash.js in Node 22 (V8).
const NODE_REFERENCE_HASH = "d4b59db9c79a1cf4d08c50989bde928d515240228fbeef96992bac3e7545eb66";
const STORAGE_KEY = "abendkasse-spike-state-v1";
const HANDLE_DATABASE = "abendkasse-spike";
const HANDLE_STORE = "handles";
const FOLDER_HANDLE_KEY = "invoice-folder";
const GENERATED_CACHE = "abendkasse-spike-generated"; // same name as in sw.js
const LISTING_FOLDER = "listing-test";
const YEAR_FOLDER = "2026";
const LISTING_FILE_COUNT = 50;
const COUNTER_FILE_COUNT = 5;
const REVOKE_DELAY_MS = 60_000;
const BASE64_LINE_LENGTH = 76;
const BYTES_PER_KIB = 1024;

const TIMESTAMP_NUMBER_PATTERN = /_(\d{4}-\d{4}-\d{4}(?:-\d+)?)_/;
const COUNTER_NUMBER_PATTERN = /_(\d{4}-\d{3})_/;

const YES_NO = ["", "yes", "no", "partly", "not offered"];
const OUTCOMES = ["", "works", "works with caveats", "fails", "not available", "not tested"];

/** What Thomas records per question, beyond the outcome and the notes. */
const QUESTION_FIELDS = {
  1: [
    { key: "attachment", label: "PDF attached in Gmail", options: YES_NO },
    { key: "subject", label: "Subject filled in", options: YES_NO },
    { key: "text", label: "Body text filled in", options: YES_NO },
    { key: "bestVariant", label: "Best variant (A to D)" },
  ],
  2: [],
  3: [
    { key: "targets", label: "Share targets listed" },
    { key: "subject", label: "Subject arrived", options: YES_NO },
    { key: "text", label: "Text arrived", options: YES_NO },
  ],
  4: [
    { key: "extraActions", label: "Extra actions after the button", type: "number" },
    { key: "attachHow", label: "How you attached it" },
    { key: "dragBlob", label: "a. DownloadURL, blob → attachment", options: YES_NO },
    { key: "dragHttps", label: "b. DownloadURL, https → attachment", options: YES_NO },
    { key: "dragFile", label: "c. File in drag data → attachment", options: YES_NO },
    { key: "dragLink", label: "d. plain link → attachment", options: YES_NO },
  ],
  5: [
    { key: "program", label: "Program that opened the .eml" },
    { key: "recipient", label: "Recipient there", options: YES_NO },
    { key: "body", label: "Body there", options: YES_NO },
    { key: "attachment", label: "Attachment there", options: YES_NO },
    { key: "draft", label: "Opens as a sendable draft", options: YES_NO },
  ],
  6: [
    { key: "write", label: "PDF written into the Drive folder", options: YES_NO },
    { key: "synced", label: "Visible on drive.google.com", options: YES_NO },
    { key: "afterRestart", label: "After browser restart: write without prompt?", options: YES_NO },
    { key: "prompt", label: "Prompt text, if any" },
  ],
  7: [
    { key: "correct", label: "Highest numbers found correctly", options: YES_NO },
  ],
  8: [
    { key: "location", label: "Where the downloaded PDF ended up" },
    { key: "downloadTaps", label: "Taps from download to Drive", type: "number" },
    { key: "shareTaps", label: "Taps from share sheet to Drive", type: "number" },
  ],
  9: [
    { key: "layout", label: "Layout matches the reference invoice", options: YES_NO },
    { key: "umlauts", label: "Umlauts and „quotes“ correct", options: YES_NO },
    { key: "attachment", label: "rechnung.json visible as attachment", options: YES_NO },
  ],
};

const state = loadState();
const invoice = SPIKE_INVOICE;
const prepared = { bytes: null, file: null, blob: null, blobUrl: null, httpsUrl: null, hash: null };

// ---- Persistence of answers (per browser) ----

function loadState() {
  const empty = { deviceLabel: "", recipient: "", answers: {}, measurements: {} };
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return empty;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private windows may refuse storage; the page still works for one visit.
  }
  renderResults();
}

function recipient() {
  return document.getElementById("recipient").value.trim();
}

// ---- Logging measurements per question ----

function clockTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function logFor(questionId, text) {
  const line = `${clockTime()} ${text}`;
  (state.measurements[questionId] ??= []).push(line);
  saveState();
  for (const section of questionSections(questionId)) {
    section.querySelector(".log").textContent = state.measurements[questionId].join("\n");
  }
}

/** Logs a line unless the same text is already logged, for facts that every page load repeats. */
function logOnceFor(questionId, text) {
  const already = (state.measurements[questionId] ?? []).some((line) => line.endsWith(text));
  if (!already) {
    logFor(questionId, text);
  }
}

function questionSections(questionId) {
  return document.querySelectorAll(`.question[data-question="${questionId}"]`);
}

// ---- The test PDF ----

async function fetchBytes(url) {
  const response = await fetch(url);
  return new Uint8Array(await response.arrayBuffer());
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function buildTimed(fontBytes) {
  const started = performance.now();
  const result = await buildInvoicePdf(PDFLib, fontkit, fontBytes, invoice);
  return { ...result, milliseconds: Math.round(performance.now() - started) };
}

let fontBytesPromise = null;
function loadFonts() {
  fontBytesPromise ??= Promise.all([
    fetchBytes("fonts/NotoSans-Regular.ttf"),
    fetchBytes("fonts/NotoSans-Bold.ttf"),
  ]).then(([regular, bold]) => ({ regular, bold }));
  return fontBytesPromise;
}

async function preparePdf() {
  const built = await buildTimed(await loadFonts());
  const fileName = invoiceFileName(invoice);
  prepared.bytes = built.bytes;
  prepared.blob = new Blob([built.bytes], { type: "application/pdf" });
  prepared.file = new File([built.bytes], fileName, { type: "application/pdf", lastModified: FIXED_CREATION_DATE.getTime() });
  prepared.blobUrl = URL.createObjectURL(prepared.blob);
  prepared.hash = await sha256Hex(built.bytes);
  prepared.httpsUrl = await publishUnderHttpsUrl(fileName, prepared.blob);

  document.getElementById("plain-link").href = prepared.blobUrl;
  document.getElementById("plain-link").download = fileName;
  document.getElementById("pdf-status").textContent =
    `Test PDF ready: ${fileName}, ${(built.bytes.length / BYTES_PER_KIB).toFixed(1)} KiB, ${built.pageCount} page(s), built in ${built.milliseconds} ms.`;
  const matches = prepared.hash === NODE_REFERENCE_HASH;
  logOnceFor(9, `built ${built.bytes.length} bytes, ${built.pageCount} page(s); sha256 ${prepared.hash}; ` +
    (matches ? "identical to the Node reference" : `DIFFERS from the Node reference ${NODE_REFERENCE_HASH}`));
}

/** Puts the PDF into Cache Storage, where sw.js serves it under a same-origin https URL. */
async function publishUnderHttpsUrl(fileName, blob) {
  if (!("caches" in window) || !navigator.serviceWorker?.controller) {
    return null;
  }
  const url = new URL(`generated/${fileName}`, location.href).href;
  const cache = await caches.open(GENERATED_CACHE);
  await cache.put(url, new Response(blob, { headers: { "Content-Type": "application/pdf" } }));
  return url;
}

function downloadBlob(blob, fileName) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), REVOKE_DELAY_MS);
}

// ---- Questions 1, 3 and 8: Web Share API ----

const SHARE_VARIANTS = [
  { label: "A: file + title + text", build: () => ({ files: [prepared.file], title: emailSubject(invoice), text: emailBody(invoice) }) },
  { label: "B: file + text", build: () => ({ files: [prepared.file], text: emailBody(invoice) }) },
  { label: "C: file only", build: () => ({ files: [prepared.file] }) },
  { label: "D: title + text, no file", build: () => ({ title: emailSubject(invoice), text: emailBody(invoice) }) },
];

function canShareText(data) {
  if (!navigator.canShare) {
    return "canShare missing";
  }
  try {
    return `canShare ${navigator.canShare(data)}`;
  } catch (error) {
    return `canShare threw ${error.name}`;
  }
}

async function share(questionId, variant) {
  const data = variant.build();
  if (!navigator.share) {
    logFor(questionId, `${variant.label}: navigator.share missing`);
    return;
  }
  try {
    await navigator.share(data);
    logFor(questionId, `${variant.label}: resolved (a target was chosen)`);
  } catch (error) {
    logFor(questionId, `${variant.label}: ${error.name}: ${error.message}`);
  }
}

function renderShareButtons() {
  for (const container of document.querySelectorAll(".share-buttons")) {
    const questionId = container.closest(".question").dataset.question;
    for (const variant of SHARE_VARIANTS) {
      const button = document.createElement("button");
      button.textContent = `Share ${variant.label}`;
      button.addEventListener("click", () => share(questionId, variant));
      container.append(button);
    }
  }
}

function logCanShareResults() {
  const summary = SHARE_VARIANTS.map((variant) => `${variant.label.split(":")[0]} ${canShareText(variant.build())}`).join("; ");
  logOnceFor(1, summary);
  logOnceFor(3, summary);
}

// ---- Question 4: save, then open Gmail or mailto; drag sources ----

function gmailComposeUrl() {
  // encodeURIComponent, not URLSearchParams: it writes spaces as %20 rather than "+".
  const to = encodeURIComponent(recipient());
  const subject = encodeURIComponent(emailSubject(invoice));
  const body = encodeURIComponent(emailBody(invoice));
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
}

function mailtoUrl() {
  const subject = encodeURIComponent(emailSubject(invoice));
  const body = encodeURIComponent(emailBody(invoice));
  return `mailto:${encodeURIComponent(recipient())}?subject=${subject}&body=${body}`;
}

function saveAndOpen(target) {
  downloadBlob(prepared.blob, prepared.file.name);
  if (target === "gmail") {
    const opened = window.open(gmailComposeUrl(), "_blank");
    logFor(4, `saved PDF, opened Gmail compose (${opened ? "window opened" : "window blocked"})`);
  } else {
    location.href = mailtoUrl();
    logFor(4, "saved PDF, opened mailto");
  }
}

const DRAG_SETUPS = {
  "download-url-blob": (transfer) => transfer.setData("DownloadURL", `application/pdf:${prepared.file.name}:${prepared.blobUrl}`),
  "download-url-https": (transfer) => {
    if (!prepared.httpsUrl) {
      throw new Error("no https URL: service worker not in control yet, reload the page once");
    }
    transfer.setData("DownloadURL", `application/pdf:${prepared.file.name}:${prepared.httpsUrl}`);
  },
  "file-item": (transfer) => transfer.items.add(prepared.file),
  "plain-link": () => {},
};

function wireDragSources() {
  for (const chip of document.querySelectorAll("[data-drag]")) {
    const kind = chip.dataset.drag;
    chip.addEventListener("dragstart", (event) => {
      try {
        DRAG_SETUPS[kind](event.dataTransfer);
        event.dataTransfer.effectAllowed = "copy";
        logFor(4, `drag ${kind}: started, types ${[...event.dataTransfer.types].join(", ")}`);
      } catch (error) {
        logFor(4, `drag ${kind}: setup failed, ${error.name}: ${error.message}`);
      }
    });
    chip.addEventListener("dragend", (event) => logFor(4, `drag ${kind}: ended, dropEffect ${event.dataTransfer.dropEffect}`));
  }
}

// ---- Question 5: .eml draft ----

function bytesToBase64(bytes) {
  const chunkSize = 0x8000;
  let binary = "";
  for (let start = 0; start < bytes.length; start += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(start, start + chunkSize));
  }
  return btoa(binary);
}

function base64Lines(bytes) {
  const encoded = bytesToBase64(bytes);
  const lines = [];
  for (let start = 0; start < encoded.length; start += BASE64_LINE_LENGTH) {
    lines.push(encoded.slice(start, start + BASE64_LINE_LENGTH));
  }
  return lines;
}

function encodedWord(text) {
  return `=?UTF-8?B?${bytesToBase64(new TextEncoder().encode(text))}?=`;
}

function buildEml() {
  const boundary = "abendkasse-spike-boundary";
  const fileName = prepared.file.name;
  const body = new TextEncoder().encode(emailBody(invoice).replace(/\n/g, "\r\n"));
  return [
    "X-Unsent: 1",
    `To: ${recipient()}`,
    `Subject: ${encodedWord(emailSubject(invoice))}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    ...base64Lines(body),
    `--${boundary}`,
    `Content-Type: application/pdf; name="${fileName}"`,
    `Content-Disposition: attachment; filename="${fileName}"`,
    "Content-Transfer-Encoding: base64",
    "",
    ...base64Lines(prepared.bytes),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function downloadEml() {
  const eml = new Blob([buildEml()], { type: "message/rfc822" });
  downloadBlob(eml, prepared.file.name.replace(/\.pdf$/, ".eml"));
  logFor(5, `downloaded .eml (${eml.size} bytes)`);
}

// ---- Questions 6 and 7: File System Access API ----

function openHandleDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(HANDLE_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function handleStoreRequest(mode, operation) {
  const database = await openHandleDatabase();
  return new Promise((resolve, reject) => {
    const request = operation(database.transaction(HANDLE_STORE, mode).objectStore(HANDLE_STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const storedFolder = () => handleStoreRequest("readonly", (store) => store.get(FOLDER_HANDLE_KEY));
const storeFolder = (handle) => handleStoreRequest("readwrite", (store) => store.put(handle, FOLDER_HANDLE_KEY));

function isInstalled() {
  return matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches;
}

async function chooseFolder() {
  if (!window.showDirectoryPicker) {
    logFor(6, "showDirectoryPicker missing in this browser");
    return;
  }
  try {
    const handle = await showDirectoryPicker({ id: "abendkasse-spike", mode: "readwrite" });
    await storeFolder(handle);
    logFor(6, `folder chosen: ${handle.name} (installed app: ${isInstalled()})`);
  } catch (error) {
    logFor(6, `choose folder: ${error.name}: ${error.message}`);
  }
}

/** Returns the stored folder with write permission, asking for it if needed, or null. */
async function writableFolder(questionId) {
  const handle = window.showDirectoryPicker ? await storedFolder() : null;
  if (!handle) {
    logFor(questionId, "no folder chosen yet (question 6, Choose folder)");
    return null;
  }
  const before = await handle.queryPermission({ mode: "readwrite" });
  if (before === "granted") {
    return handle;
  }
  const after = await handle.requestPermission({ mode: "readwrite" });
  logFor(questionId, `permission was ${before}, asked, now ${after}`);
  return after === "granted" ? handle : null;
}

async function writeFile(folder, name, bytes) {
  const fileHandle = await folder.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(bytes);
  await writable.close();
}

async function writeTestPdf() {
  try {
    const root = await writableFolder(6);
    if (!root) {
      return;
    }
    const started = performance.now();
    const yearFolder = await root.getDirectoryHandle(YEAR_FOLDER, { create: true });
    await writeFile(yearFolder, prepared.file.name, prepared.bytes);
    logFor(6, `wrote ${root.name}/${YEAR_FOLDER}/${prepared.file.name} in ${Math.round(performance.now() - started)} ms (installed app: ${isInstalled()})`);
  } catch (error) {
    logFor(6, `write: ${error.name}: ${error.message}`);
  }
}

async function requestPermissionAgain() {
  const handle = window.showDirectoryPicker ? await storedFolder() : null;
  if (!handle) {
    logFor(6, "no folder chosen yet");
    return;
  }
  logFor(6, `requestPermission: ${await handle.requestPermission({ mode: "readwrite" })}`);
}

async function logPermissionAfterLoad() {
  const handle = window.showDirectoryPicker ? await storedFolder().catch(() => null) : null;
  if (handle) {
    logFor(6, `Permission after load: ${await handle.queryPermission({ mode: "readwrite" })} for ${handle.name} (installed app: ${isInstalled()})`);
  }
}

/** File names for question 7: timestamp numbers, a few counter numbers and one unrelated file. */
function listingTestNames() {
  const timestampCount = LISTING_FILE_COUNT - COUNTER_FILE_COUNT - 1;
  const names = [];
  for (let index = 0; index < timestampCount; index++) {
    const month = String(1 + (index % 12)).padStart(2, "0");
    const day = String(1 + ((index * 7) % 28)).padStart(2, "0");
    const hour = String(18 + (index % 6)).padStart(2, "0");
    names.push(`Rechnung_2026-${month}${day}-${hour}${String(index).padStart(2, "0")}_Club-Example.pdf`);
  }
  for (let counter = 1; counter <= COUNTER_FILE_COUNT; counter++) {
    names.push(`Rechnung_2026-${String(counter).padStart(3, "0")}_Club-Example.pdf`);
  }
  names.push("Notizen.txt");
  return names;
}

/** The highest timestamp and counter numbers in a list of file names (REQ-038). */
function highestNumbers(names) {
  const highest = (pattern) => names.map((name) => name.match(pattern)?.[1]).filter(Boolean).sort().at(-1) ?? "none";
  return { timestamp: highest(TIMESTAMP_NUMBER_PATTERN), counter: highest(COUNTER_NUMBER_PATTERN) };
}

async function listingFolder(root, create) {
  const listing = await root.getDirectoryHandle(LISTING_FOLDER, { create });
  return listing.getDirectoryHandle(YEAR_FOLDER, { create });
}

async function writeFiftyFiles() {
  try {
    const root = await writableFolder(7);
    if (!root) {
      return;
    }
    const folder = await listingFolder(root, true);
    const started = performance.now();
    for (const name of listingTestNames()) {
      await writeFile(folder, name, name.endsWith(".pdf") ? prepared.bytes : new TextEncoder().encode("Testdatei"));
    }
    const expected = highestNumbers(listingTestNames());
    logFor(7, `wrote ${LISTING_FILE_COUNT} files in ${Math.round(performance.now() - started)} ms; expected highest: ${expected.timestamp}, ${expected.counter}`);
  } catch (error) {
    logFor(7, `write 50: ${error.name}: ${error.message}`);
  }
}

async function listAndFindHighest() {
  try {
    const root = await writableFolder(7);
    if (!root) {
      return;
    }
    const started = performance.now();
    const folder = await listingFolder(root, false);
    const names = [];
    for await (const name of folder.keys()) {
      names.push(name);
    }
    const found = highestNumbers(names);
    logFor(7, `listed ${names.length} names in ${Math.round(performance.now() - started)} ms; highest timestamp ${found.timestamp}, counter ${found.counter}`);
  } catch (error) {
    logFor(7, `list: ${error.name}: ${error.message}`);
  }
}

async function deleteTestFiles() {
  try {
    const root = await writableFolder(7);
    if (!root) {
      return;
    }
    await root.removeEntry(LISTING_FOLDER, { recursive: true }).catch(() => {});
    const yearFolder = await root.getDirectoryHandle(YEAR_FOLDER).catch(() => null);
    await yearFolder?.removeEntry(prepared.file.name).catch(() => {});
    logFor(7, "deleted the test files");
  } catch (error) {
    logFor(7, `delete: ${error.name}: ${error.message}`);
  }
}

// ---- Question 9: PDF ----

function openPdf() {
  const opened = window.open(prepared.blobUrl, "_blank");
  logFor(9, `opened PDF (${opened ? "new tab" : "blocked or downloaded"})`);
}

async function regenerateAndCompare() {
  const built = await buildTimed(await loadFonts());
  const hash = await sha256Hex(built.bytes);
  logFor(9, `built again in ${built.milliseconds} ms: ${hash === prepared.hash ? "identical bytes" : `DIFFERENT bytes, sha256 ${hash}`}`);
}

// ---- Environment ----

function browserSummary() {
  const agent = navigator.userAgent;
  const patterns = [["Edge", /Edg(?:A)?\/([\d.]+)/], ["Firefox", /Firefox\/([\d.]+)/], ["Chrome", /Chrome\/([\d.]+)/]];
  const match = patterns.map(([name, pattern]) => [name, agent.match(pattern)]).find(([, found]) => found);
  const platform = /Android/.test(agent) ? "Android" : /Windows/.test(agent) ? "Windows" : navigator.platform;
  return match ? `${match[0]} ${match[1][1]} on ${platform}` : `${agent}`;
}

async function environmentRows() {
  const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : "n/a";
  return [
    ["Browser", browserSummary()],
    ["User agent", navigator.userAgent],
    ["Installed app (standalone)", String(isInstalled())],
    ["navigator.share", String(Boolean(navigator.share))],
    ["navigator.canShare", String(Boolean(navigator.canShare))],
    ["showDirectoryPicker", String(Boolean(window.showDirectoryPicker))],
    ["showSaveFilePicker", String(Boolean(window.showSaveFilePicker))],
    ["Service worker in control", String(Boolean(navigator.serviceWorker?.controller))],
    ["Storage persisted", String(persisted)],
    ["Page version", SPIKE_VERSION],
  ];
}

async function renderEnvironment() {
  const table = document.getElementById("environment-table");
  for (const [label, value] of await environmentRows()) {
    const row = table.insertRow();
    row.insertCell().textContent = label;
    row.insertCell().textContent = value;
  }
}

// ---- Observation forms and results ----

function makeInput(questionId, field) {
  const answers = (state.answers[questionId] ??= {});
  const input = field.options ? document.createElement("select") : document.createElement(field.type === "textarea" ? "textarea" : "input");
  for (const option of field.options ?? []) {
    input.add(new Option(option === "" ? "–" : option, option));
  }
  if (field.type === "number") {
    input.type = "number";
    input.min = "0";
  }
  input.value = answers[field.key] ?? "";
  input.addEventListener("input", () => {
    answers[field.key] = input.value;
    saveState();
  });
  const label = document.createElement("label");
  label.append(field.label, input);
  return label;
}

function renderObservations() {
  for (const section of document.querySelectorAll(".question")) {
    const questionId = section.dataset.question;
    const log = document.createElement("div");
    log.className = "log";
    log.textContent = (state.measurements[questionId] ?? []).join("\n");
    const form = document.createElement("div");
    form.className = "observations";
    const fields = [
      { key: "outcome", label: "Outcome", options: OUTCOMES },
      ...QUESTION_FIELDS[questionId],
      { key: "notes", label: "Notes", type: "textarea" },
    ];
    fields.forEach((field) => form.append(makeInput(questionId, field)));
    section.append(log, form);
  }
}

function markdownCell(text) {
  return String(text).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function questionRow(section) {
  const questionId = section.dataset.question;
  const answers = state.answers[questionId] ?? {};
  const details = QUESTION_FIELDS[questionId]
    .filter((field) => answers[field.key])
    .map((field) => `${field.label}: ${answers[field.key]}`);
  if (answers.notes) {
    details.push(`Notes: ${answers.notes}`);
  }
  const measured = (state.measurements[questionId] ?? []).join("\n");
  const title = section.querySelector("h2").textContent;
  return `| ${markdownCell(title)} | ${markdownCell(answers.outcome || "–")} | ${markdownCell(details.join("\n"))} | ${markdownCell(measured)} |`;
}

function resultsMarkdown() {
  const sections = [...document.querySelectorAll(".question")];
  return [
    `### ${state.deviceLabel || "Device"}: ${browserSummary()}`,
    "",
    `Installed app: ${isInstalled()}. Page version ${SPIKE_VERSION}. User agent: \`${navigator.userAgent}\``,
    "",
    "| Question | Outcome | Details | Measured |",
    "|---|---|---|---|",
    ...sections.map(questionRow),
    "",
  ].join("\n");
}

function renderResults() {
  const preview = document.getElementById("results-preview");
  if (preview) {
    preview.textContent = resultsMarkdown();
  }
}

async function copyResults() {
  try {
    await navigator.clipboard.writeText(resultsMarkdown());
    alert("Results copied. Paste them into the chat.");
  } catch {
    getSelection().selectAllChildren(document.getElementById("results-preview"));
    alert("Copying failed; the results are selected, copy them by hand.");
  }
}

function clearAnswers() {
  if (!confirm("Clear this browser's answers and measurements?")) {
    return;
  }
  state.answers = {};
  state.measurements = {};
  saveState();
  location.reload();
}

// ---- Wiring ----

function on(id, handler) {
  document.getElementById(id).addEventListener("click", handler);
}

function wireInputs() {
  const deviceLabel = document.getElementById("device-label");
  const recipientInput = document.getElementById("recipient");
  deviceLabel.value = state.deviceLabel;
  recipientInput.value = state.recipient || recipientInput.value;
  deviceLabel.addEventListener("input", () => { state.deviceLabel = deviceLabel.value; saveState(); });
  recipientInput.addEventListener("input", () => { state.recipient = recipientInput.value; saveState(); });
}

function wireButtons() {
  on("save-and-gmail", () => saveAndOpen("gmail"));
  on("save-and-mailto", () => saveAndOpen("mailto"));
  on("download-eml", downloadEml);
  on("choose-folder", chooseFolder);
  on("write-test-pdf", writeTestPdf);
  on("request-permission", requestPermissionAgain);
  on("write-fifty", writeFiftyFiles);
  on("list-folder", listAndFindHighest);
  on("delete-test-files", deleteTestFiles);
  on("download-pdf", () => { downloadBlob(prepared.blob, prepared.file.name); logFor(8, "downloaded PDF"); });
  on("share-to-drive", () => share(8, SHARE_VARIANTS[2]));
  on("open-pdf", openPdf);
  on("regenerate-pdf", regenerateAndCompare);
  on("copy-results", copyResults);
  on("download-results", () => downloadBlob(new Blob([resultsMarkdown()], { type: "text/markdown" }), "abendkasse-spike-results.md"));
  on("clear-results", clearAnswers);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  await navigator.serviceWorker.register("sw.js");
  if (!navigator.serviceWorker.controller) {
    await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
  }
}

async function main() {
  state.answers[2] ??= { outcome: "not tested", notes: "No Apple device available (OPEN-E)." };
  wireInputs();
  renderObservations();
  renderShareButtons();
  wireDragSources();
  wireButtons();
  renderResults();
  await registerServiceWorker().catch((error) => console.warn("service worker:", error));
  await renderEnvironment();
  try {
    await preparePdf();
    logCanShareResults();
  } catch (error) {
    document.getElementById("pdf-status").textContent = `Building the PDF failed: ${error.name}: ${error.message}`;
  }
  await logPermissionAfterLoad();
}

main();
