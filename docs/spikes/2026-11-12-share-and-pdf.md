# Spike: a browser can hand the invoice PDF to Gmail, save it to a Drive folder and draw it identically everywhere

Date: 12 November 2026 (tests), 13 November 2026 (report) | For: [OPEN-B](../requirements.md#open-b), [OPEN-G](../requirements.md#open-g), [REQ-019](../requirements.md#req-019)

This spike measures how abendkasse can save the invoice PDF and get it into the [performer](../glossary.md#performer)'s email on each test device, and whether pdf-lib can draw the PDF.
The test page and its code are in [`2026-11-12-share-and-pdf/`](2026-11-12-share-and-pdf/README.md).
Thomas ran the tests on the evening of 12 November 2026.

## Question

1. Android: does the [Web Share API](../glossary.md#web-share-api) with the PDF open the Gmail app with the attachment, subject and text filled in, in Chrome and in Firefox?
2. iOS: the same as question 1, in Safari.
3. Windows: in Chrome, Edge and Firefox, is file sharing offered, which targets does the [share sheet](../glossary.md#share-sheet) list, and do subject and text arrive?
4. Windows: does "save the PDF, open Gmail's compose page pre-filled, drag the PDF in" take at most two extra actions? Can the PDF be dragged straight from the page into Gmail?
5. Windows: does an `.eml` draft with `X-Unsent: 1` and the PDF attached open as a draft ready to send?
6. Can the installed [PWA](../glossary.md#pwa) write into a chosen Google Drive for desktop folder with the [File System Access API](../glossary.md#file-system-access-api), and keep that permission after a browser restart?
7. Can it list that folder's file names to find the highest [invoice number](../glossary.md#invoice-number) ([REQ-038](../requirements.md#req-038)), and how fast with 50 files?
8. Android: where does a saved PDF end up, and how many taps does it take to get it into Google Drive?
9. Does pdf-lib draw the invoice layout of [REQ-018](../requirements.md#req-018) on one A4 page with an embedded font, correct umlauts and „quotes“? Are the bytes identical across platforms once the creation date and document ID are fixed ([REQ-017](../requirements.md#req-017))? Can it embed the invoice data as a file attachment ([REQ-033](../requirements.md#req-033))?

## Method

One static test page in plain JavaScript, with no build step, published with GitHub Pages from the branch `spike/share-and-pdf`.
It loads everything from its own host ([REQ-024](../requirements.md#req-024)): pdf-lib 1.17.1, @pdf-lib/fontkit 1.1.1 and the Noto Sans font, all pinned and vendored.
All invoice data on it is invented.
The page has one section per question, with buttons for each test and a log of what the browser reported.
Thomas recorded what he saw in fields below each log and pasted the results here, one table per browser.

The variants tested:

| Question | Variants |
|---|---|
| 1, 3 | `navigator.share` with (A) file, title and text; (B) file and text; (C) file only; (D) title and text without a file. `canShare` logged for each. |
| 4 | One button downloads the PDF and opens `https://mail.google.com/mail/?view=cm&to=…&su=…&body=…` in a new window. Four drag sources: Chrome's `DownloadURL` drag data with a `blob:` URL and with an `https:` URL served by the page's service worker, a `File` added to the drag data, and a plain link to the PDF. |
| 5 | An `.eml` file: `X-Unsent: 1`, recipient, a UTF-8 subject, a plain-text body, the PDF as a base64 attachment. |
| 6, 7 | `showDirectoryPicker` in read-write mode; the folder handle kept in IndexedDB; on each load, `queryPermission` logged. 50 test files (44 timestamp numbers, 5 counter numbers, one other file) written into a subfolder, then listed with timing. |
| 8 | A download link, and variant C of the share test. |
| 9 | The invoice drawn with pdf-lib on DIN 5008 form B positions, Noto Sans Regular and Bold embedded as subsets, metadata dates fixed, the invoice data attached as `rechnung.json`. Its SHA-256 compared with one built by Node 22 from the same code (`tools/reference-hash.js`). |

The devices:

| Device | Browsers |
|---|---|
| Windows 11 laptop, Gmail in the browser, Google Drive for desktop | Chrome 157 (in a tab and installed), Firefox 160 |
| Android phone, Gmail app | Chrome 157, Firefox 159 |
| Node 22.18 (Windows, V8) and the Claude desktop app's built-in Chrome 156 | PDF reference only |

## Result

| Question | Answer |
|---|---|
| 1. Android share into Gmail | **Chrome: yes.** Variant A opens the Gmail app with the PDF attached, the title as subject and the text as body. The recipient stays empty, as the note to [REQ-023](../requirements.md#req-023) expects. **Firefox: no.** `canShare` is false for every variant with a file; `share` throws "Passing files is currently not supported". Text alone (D) can be shared. |
| 2. iOS | Not tested: no Apple device ([OPEN-E](../requirements.md#open-e)). |
| 3. Windows share sheet | **Chrome: file sharing is offered** (`canShare` true for A to D) and opens the Windows share dialog. It lists nearby devices and a phone, Nearby Sharing, Phone Link, WhatsApp, Zoom, store links to Telegram, Discord and Viber, and contacts from Outlook. **Gmail is not a target**, because a website cannot receive a Windows share. Subject and text were not checked: the only email target, Outlook, has no account set up. **Firefox: no** `navigator.share`. |
| 4. Save, open Gmail, drag in | **Yes, one extra action** in Chrome and in Firefox: the compose window opens, and Thomas drags the PDF from the browser's download pop-up into it. **No drag source on the page worked**: none of the four made an attachment in Gmail, in either browser. |
| 5. `.eml` draft | **Not usable here.** The file opens in new Outlook, Windows' default program for `.eml`, which has no account set up and could not connect. A performer who sends from Gmail in the browser cannot use this route. |
| 6. Write to a Drive folder | **Yes.** The installed app in Chrome wrote `2026/Rechnung_….pdf` into a folder of Google Drive for desktop in 91 ms. The file then showed on drive.google.com. After a browser restart the permission falls back to "prompt". The first request after a restart shows a three-way prompt: allow on every visit, allow this time, don't allow. **After "allow on every visit", the permission is still granted after the next restart.** |
| 7. List the folder | **Yes, fast.** Listing 50 file names took 68 ms the first time and 22 to 23 ms afterwards. The highest timestamp number (`2026-1222-2335`) and counter number (`2026-005`) were found correctly. Writing the 50 files took 3.5 s. Writing them again straight after deleting them failed once with `InvalidModificationError`; the second try worked. |
| 8. Android: saved PDF to Drive | **Chrome:** the PDF lands in the Downloads folder. Getting it into Drive takes 3 taps from the download, or 2 taps through the share sheet (variant C, then Drive). **Firefox:** the download link shows the PDF in a new tab instead of saving it. Sharing it from there into Drive takes 2 taps. |
| 9. pdf-lib | **Yes to all three.** One A4 page of 20,277 bytes in the layout of the [reference invoice](../glossary.md#reference-invoice), with Noto Sans embedded. Umlauts and „quotes“ are correct, also in the extracted text (U+201E and U+201C). **The SHA-256 is identical** in Chrome and Firefox on Windows, Chrome and Firefox on Android, Chrome 156 and Node 22: `d4b59db9…eb66`. Building twice in one browser gives the same bytes. `rechnung.json` shows as an attachment in the PDF viewers of Chrome and Firefox on Windows. The Android viewers have no view for attachments. Building takes 70 to 150 ms. |

Two details matter for building PDFs that are identical everywhere.
pdf-lib names an embedded font with a pseudo-random suffix unless `embedFont` gets a `customName`.
It also names page resources from a random number generator with a fixed seed.
That generator uses `Math.sin`, which could in principle differ between JavaScript engines.
Firefox's engine (SpiderMonkey) produced the same bytes as Chrome's (V8), so it does not differ in practice.

## Not tested

- iOS and macOS: no Apple device.
- Edge on Windows: it uses Chrome's engine, so the results of Chrome are expected to hold.
- Whether the Gmail compose page received recipient, subject and body intact: the results record that the window opened and the PDF was attached, not each field.
- The `mailto:` variant of question 4: the button was pressed in Chrome, but what opened was not recorded.
- Subject and text through the Windows share sheet into an email program.
- The `.eml` draft in a working email program (Thunderbird, classic Outlook).
- The File System Access API in Edge, and with the app not installed after a restart.
- Folders with many more than 50 files, and listing while Google Drive is still syncing.
- The Gmail compose URL is not a documented Google interface. It works today, and nothing guarantees it tomorrow.

## Conclusion

The evidence points to one way of sending per platform.
On Android in Chrome, the Web Share API hands the PDF, subject and text to the Gmail app in one step.
On Windows, the share sheet cannot reach Gmail in the browser, and an `.eml` draft opens in an email program the performer does not use.
There, saving the PDF and opening Gmail's compose page pre-filled leaves one drag from the download pop-up.
That is one action more than [REQ-014](../requirements.md#req-014) asks.
Firefox on Android shares no files, so it needs the download-and-attach path as well.
For saving, the installed app in Chrome writes into a chosen Google Drive folder, keeps the permission across restarts once the performer allows it on every visit, and lists 50 file names in about 20 ms, enough for the number check of [REQ-038](../requirements.md#req-038).
pdf-lib draws the invoice on one page with an embedded font and produces identical bytes on every platform tested, which settles the technique of [OPEN-G](../requirements.md#open-g) in its favour.
The decisions are taken in two [ADRs](../glossary.md#adr), one for sending and one for the PDF, after discussing each with Thomas.
