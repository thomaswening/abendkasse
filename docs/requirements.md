# abendkasse: Verifiable Product Requirements
Version: 0.1 draft | 11 November 2026

**Status:**

- First draft from the intake conversation of 11 November 2026, for the first elicitation pass. Only the [first release](glossary.md#first-release) (the MVP) is detailed. Later capabilities are listed in [section 10](#10-later-releases) without detail.
- The first release supports one tax case: the [small-business rule](glossary.md#small-business-rule) of §19 [UStG](glossary.md#ustg).
- The biggest technical risk is sending the PDF as an email attachment from a browser ([OPEN-B](#open-b)). A spike settles it before the sending flow is built.
- Open decisions are collected in [section 11](#open-decisions); how the document got here is in the [revision history](#revision-history).

## Requirement conventions
**SHALL** = mandatory for the stated release; **SHOULD** = preferred, with an acceptable documented exception; **COULD** = optional or future capability. Each requirement has a stable ID and is never renumbered. Conditions are expressed as **WHEN … THEN …**, **IF … THEN …**, **BEFORE …**, **WHILE …** or **AFTER …**. An implementation technique is not a product requirement unless explicitly stated. Items marked **OPEN** require a decision before they can be treated as acceptance criteria. **OUT OF SCOPE** marks a capability explicitly not required for the first release.

<a id="first-release"></a>**The first release** = the MVP: the smallest version Thomas uses for his own gig invoices instead of his Word template.

<a id="performer"></a>**Performer** = the person who played the gig and issues the invoice. Example: a DJ who invoices a club.

<a id="profile"></a>**Profile** = the performer's fixed data: name, stage name, address, contact details, tax number, bank details, and the defaults for the item text and the email. It is entered once and pre-fills every invoice.

<a id="client"></a>**Client** = who receives and pays the invoice (*Rechnungsempfänger*), with a postal address. Example: the company that operates a club, such as "Example Events GmbH".

<a id="venue"></a>**Venue** = where the gig took place, with a city. Example: "Club Example, Hamburg". A venue belongs to one client. Several venues may share a client. Client and venue are kept apart because the invoice goes to the client while the item text names the venue: the [reference invoice](glossary.md#reference-invoice) is addressed to a club's operating company, not to the club.

<a id="gig-data"></a>**Gig data** = what changes from one invoice to the next: the venue (and with it the client), the event name, the date, the start and end time, and the fee.

<a id="invoice-number"></a>**Invoice number** = the number that identifies an invoice uniquely for the performer. Example: `2026-003`.

<a id="reference-invoice"></a>**The reference invoice** = Thomas's current invoice, made from a Word template (`Rechnung_TANTE_THOMAS_Frau_Holle_2026_06_14.docx`, kept privately, not in this repository). It is a cross-check for layout and content, not a specification. Its personal data (address, IBAN, tax number) never appears in this repository, its examples or its tests ([REQ-024](#req-024)).

<a id="reference-platforms"></a>**Reference platforms** (used by every platform requirement): Windows 11 with current Chrome and Edge; macOS with current Safari and Chrome; Android with current Chrome; iOS with current Safari. "Current" means the stable release at the time of testing. **[OPEN-E](#open-e):** which exact devices Thomas tests on.

## 1. Purpose and users

<a id="req-001"></a>**REQ-001 — Purpose (SHALL).** abendkasse SHALL turn the gig data of one gig into a finished invoice PDF, store it and hand it to the performer's email ready to send, so that the performer types only the [gig data](#gig-data) and presses one button. Rationale: writing an invoice after a gig is a small task that gets postponed because of the friction of copying fixed data, counting invoice numbers and attaching files. The tagline states the goal: "Gig done. Invoice sent."

<a id="req-002"></a>**REQ-002 — First user: a DJ under the small-business rule (SHALL).** The first release SHALL serve a DJ who invoices clubs and event companies in Germany under the [small-business rule](glossary.md#small-business-rule). Thomas, as the DJ Tante Thomas, is that user. Rationale: it is Thomas's case. Building for one real user first keeps the first release small.

<a id="req-003"></a>**REQ-003 — Later users: other performers (COULD).** A later release COULD serve other performers (live musicians, hosts, lighting artists) and performers who charge VAT. The first release SHALL NOT make choices that rule them out: item text, units and tax handling are data, not code ([REQ-030](#req-030)).

<a id="req-004"></a>**REQ-004 — Out of scope for the first release (OUT OF SCOPE).** Invoices with VAT; several items per invoice; credit notes and cancellation invoices; invoice history and search; payment tracking and reminders; e-invoices (XRechnung, ZUGFeRD); a logo or custom layout; languages other than German on the invoice; any server, account or synchronisation between devices. Each of these is listed in [section 10](#10-later-releases) if a later release may want it.

## 2. Invoice content

<a id="req-005"></a>**REQ-005 — Mandatory details (SHALL).** Every invoice SHALL contain: (a) the full name and address of the performer; (b) the full name and address of the client; (c) the performer's tax number; (d) the invoice date; (e) the [invoice number](#invoice-number); (f) the type and extent of the service; (g) the date of the service; (h) the fee; (i) the note that no VAT is charged because of the small-business rule. Rationale: for a small business, §34a UStDV (in force since 1 January 2025) requires (a), (b), (d), (f), (h) and (i). §14 (4) UStG, which applies to every other business, also requires (c), (e) and (g). The invoice carries all of them, so a client's bookkeeping never rejects it. **[OPEN-F](#open-f):** the legal list is checked against the current text of both before the first release.

<a id="req-006"></a>**REQ-006 — Service description (SHALL).** The service SHALL be described by one item line built from a template in the [profile](#profile) and the [gig data](#gig-data). The default template SHALL produce text of the form "DJ-Tätigkeit am 19.09.2026, von 23:00 Uhr bis 20.09.2026 um 01:00 Uhr, „Example Night“, Club Example, Hamburg". Rationale: this is the reference invoice's wording. It states the date of the service ([REQ-005](#req-005) (g)) without a separate field.

<a id="req-007"></a>**REQ-007 — Gigs past midnight (SHALL).** IF the end time is earlier than the start time, THEN the gig SHALL be taken to end on the following day, and the item text SHALL name both dates. Rationale: most club gigs end after midnight. The reference invoice shows such a gig.

<a id="req-008"></a>**REQ-008 — Small-business note (SHALL).** The invoice SHALL carry the note "Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen." and SHALL show the fee as the total, with no VAT line. Rationale: the note is mandatory ([REQ-005](#req-005) (i)). Showing VAT under the small-business rule would make the performer owe it (§14c UStG).

<a id="req-009"></a>**REQ-009 — Invoice language (SHALL).** The invoice SHALL be in German, with German date and amount formats (`19.09.2026`, `50,00 EUR`). Rationale: the clients are German businesses.

## 3. Fixed data

<a id="req-010"></a>**REQ-010 — Profile entered once (SHALL).** The performer SHALL enter the [profile](#profile) once. Every invoice SHALL be pre-filled from it. Changing the profile SHALL change only invoices created afterwards.

<a id="req-011"></a>**REQ-011 — Clients and venues remembered (SHALL).** WHEN the performer creates an invoice for a new venue, THEN abendkasse SHALL ask for the venue's city and its [client](#client) (a known client or a new one with name and address) and SHALL remember both. WHEN the performer chooses a known venue, THEN the client SHALL be filled in without further input. Rationale: most gigs repeat at the same few venues. The client's address is the field most tedious to retype.

<a id="req-012"></a>**REQ-012 — Invoice number assigned automatically (SHALL).** abendkasse SHALL propose the next [invoice number](#invoice-number) in the form `YYYY-NNN`: the year of the invoice date and a counter that starts at 001 each year. The performer SHALL be able to set the counter once, so that numbering continues from invoices written before abendkasse. abendkasse SHALL NOT issue the same invoice number twice on one device. Rationale: invoice numbers must be unique (§14 (4) no. 4 UStG). The reference invoice uses this form (`2026-002`). **[OPEN-A](#open-a):** how numbers stay unique when the performer uses abendkasse on two devices. **[OPEN-C](#open-c):** whether a number generated but never sent can be given back.

<a id="req-013"></a>**REQ-013 — Invoice date (SHALL).** The invoice date SHALL default to today. The performer SHALL be able to change it.

## 4. Creating an invoice

<a id="req-014"></a>**REQ-014 — One screen, one button (SHALL).** Creating an invoice SHALL take one screen with the [gig data](#gig-data) fields and one button that generates, saves and sends ([REQ-017](#req-017), [REQ-019](#req-019)). Acceptance: for a known venue, the performer fills in at most six fields (venue, event name, date, start time, end time, fee) and presses one button. The share or email screen then opens with the PDF attached.

<a id="req-015"></a>**REQ-015 — Sensible defaults (SHOULD).** The gig date SHOULD default to the most recent past evening. The fee and the times SHOULD default to the values of the last invoice for the same venue. Rationale: an invoice is usually written the day after the gig, for the usual fee.

<a id="req-016"></a>**REQ-016 — Input checks (SHALL).** BEFORE generating, abendkasse SHALL refuse an empty required field, a fee of zero or less, and a gig date in the future, each with a message that names the field. IF the profile lacks a mandatory detail of [REQ-005](#req-005), THEN abendkasse SHALL refuse to generate and SHALL say which one. Rationale: an invoice missing a mandatory detail may be rejected by the client's bookkeeping. The performer then has to write a corrected one.

## 5. PDF

<a id="req-017"></a>**REQ-017 — PDF generated on the device (SHALL).** abendkasse SHALL generate the invoice as a PDF on the performer's device, without sending any data to a server. The PDF SHALL embed its fonts. It SHALL look the same on every [reference platform](#reference-platforms). Acceptance: the PDF generated from the same input on two reference platforms is identical except for its creation timestamp and document ID. **[OPEN-G](#open-g):** how the PDF is made in the browser.

<a id="req-018"></a>**REQ-018 — Layout (SHALL).** The PDF SHALL follow the reference invoice's layout on one A4 page: the performer's details in the header, the client's address in the window position of a DIN 5008 envelope, then invoice number and date, one item table with the total, the small-business note, a closing line, and the bank details and tax number in the footer.

## 6. Saving and archive

<a id="req-019"></a>**REQ-019 — The PDF is saved before it is sent (SHALL).** WHEN the performer presses the button of [REQ-014](#req-014), THEN abendkasse SHALL save the PDF before it opens the sending step. On platforms that let a web app write to a chosen folder, the performer SHALL choose that folder once and abendkasse SHALL save there without asking again. On the others, abendkasse SHALL hand the file to the platform's save or download step. Rationale: the saved PDFs are the performer's archive. A PDF only attached to an email can be lost with the email. Note: writing to a chosen folder works on desktop Chrome and Edge ([File System Access API](glossary.md#file-system-access-api)), not on phones.

<a id="req-020"></a>**REQ-020 — File name (SHALL).** The PDF SHALL be named from the invoice number, the gig date and the venue, so that a folder of invoices sorts by number. Proposal: `2026-003_2026-09-19_Club-Example.pdf`, in a folder per year. **[OPEN-D](#open-d):** the naming scheme.

<a id="req-021"></a>**REQ-021 — Retention is the performer's (SHALL).** abendkasse SHALL tell the performer, in its documentation and once when the first invoice is saved, that invoices must be kept for eight years (§14b UStG) and that abendkasse does not keep them. Rationale: abendkasse has no server ([REQ-024](#req-024)). Browser storage can be cleared by the browser or the user. The saved PDF files are the archive.

## 7. Sending

<a id="req-022"></a>**REQ-022 — Email pre-filled with the PDF attached (SHALL).** AFTER the PDF is saved, abendkasse SHALL open the platform's sending step with the PDF attached, a subject and a body text pre-filled from templates in the profile. The performer SHALL review and send it; abendkasse SHALL NOT send anything itself. Default subject: "Rechnung 2026-003 – Example Night, 19.09.2026". Rationale: sending stays under the performer's control. abendkasse needs no email account. **[OPEN-B](#open-b):** how the attachment reaches the email on each platform.

<a id="req-023"></a>**REQ-023 — Client email address (SHOULD).** abendkasse SHOULD store an email address per client and pre-fill it as the recipient where the platform allows. Note: the [share sheet](glossary.md#share-sheet) on phones takes no recipient. The performer then picks it in the email app.

## 8. Data and privacy

<a id="req-024"></a>**REQ-024 — No server, no tracking (SHALL).** All profile, client, venue and invoice data SHALL stay on the performer's device. abendkasse SHALL NOT send any of it over the network. It SHALL contain no analytics or tracking. The repository, its examples and its tests SHALL use invented data only. Rationale: invoices hold the performer's bank details, tax number and address. A free project without a server costs nothing to run.

<a id="req-025"></a>**REQ-025 — Backup of the fixed data (SHALL).** abendkasse SHALL export the profile, the clients, the venues and the invoice counter to one file, and import it again on the same or another device. It SHOULD ask the browser for persistent storage. Rationale: browser storage can be cleared. Losing the counter risks a duplicate invoice number. Losing the profile and clients brings back the friction abendkasse removes.

## 9. Platforms, installation and distribution

<a id="req-026"></a>**REQ-026 — Installable web app (SHALL).** abendkasse SHALL be a [progressive web app](glossary.md#pwa): a website that can be installed like an app on every [reference platform](#reference-platforms), from one codebase. Rationale: it avoids app stores, code signing and paid developer accounts. This technique is a requirement because it is what keeps the project free to publish (Thomas, 11 November 2026).

<a id="req-027"></a>**REQ-027 — Works offline (SHALL).** After the first visit, abendkasse SHALL create, save and hand over an invoice without a network connection. Rationale: an invoice is often written backstage or on the way home.

<a id="req-028"></a>**REQ-028 — Free hosting (SHALL).** abendkasse SHALL be hosted on GitHub Pages and SHALL cost its users and its maintainer nothing.

<a id="req-029"></a>**REQ-029 — Platform differences behind one interface (SHALL).** Saving and sending differ by platform ([REQ-019](#req-019), [REQ-022](#req-022)). Those differences SHALL sit behind one small interface, so that the invoice flow does not depend on the platform. Acceptance: adding a fallback for one platform changes only that interface's implementations.

<a id="req-030"></a>**REQ-030 — Tax handling as data (SHALL).** The invoice data SHALL record the tax case (first release: small-business rule only), the net amount, the VAT rate and the VAT amount, even though the first release fixes the rate at zero. Acceptance: adding VAT in a later release changes the PDF layout and the input screen, not the stored data model. Rationale: the small-business limits since 2025 (€25,000 turnover in the previous year, €100,000 in the current one, counting all self-employed turnover) mean many DJs charge VAT.

<a id="req-031"></a>**REQ-031 — Open source (SHALL).** abendkasse SHALL be published under an open-source licence in the public repository [thomaswening/abendkasse](https://github.com/thomaswening/abendkasse). **[OPEN-H](#open-h):** which licence.

<a id="req-032"></a>**REQ-032 — No tax advice (SHALL).** The README and the app SHALL state that abendkasse is not tax advice and that the performer is responsible for the correctness of the invoices.

## 10. Later releases

Listed so that the first release leaves room for them. Not detailed until a release takes them on.

<a id="req-033"></a>**REQ-033 — Invoice history from the PDFs (COULD).** A later release COULD list and search past invoices. Idea: each PDF embeds its invoice data (as a PDF attachment or metadata), so the folder of PDFs is the archive and no separate database or CSV is needed.

<a id="req-034"></a>**REQ-034 — VAT (COULD).** A later release COULD issue invoices with VAT for performers outside the small-business rule ([REQ-030](#req-030)).

<a id="req-035"></a>**REQ-035 — Logo and custom look (COULD).** A later release COULD add a logo, colours and a choice of fonts.

<a id="req-036"></a>**REQ-036 — More items per invoice (COULD).** A later release COULD add items such as travel costs, or several gigs on one invoice.

<a id="req-037"></a>**REQ-037 — Cancellation invoices (COULD).** A later release COULD issue a cancellation invoice (*Stornorechnung*) that refers to a wrong invoice.

<a id="open-decisions"></a>
## 11. Deferred capabilities and unresolved decisions

An open decision is resolved immediately before the work that depends on it, not in advance: several are better settled with evidence from a spike than by argument, and one settled early on a guess is worse than one settled late on a measurement. The roadmap names, per phase, which decisions that phase needs, and a phase is not complete until they are recorded here. Each decision below therefore carries a **Needed by** note saying what it blocks. A decision stays in this section once settled, marked **Resolved**, so that the reasoning survives the decision.

<a id="open-a"></a>**OPEN-A — Invoice numbers on two devices.** [REQ-012](#req-012), [REQ-025](#req-025). Without a server, each device keeps its own counter. A performer who writes invoices on both phone and laptop could issue the same number twice. Candidates: (1) one device is the invoicing device, the other is not used for invoices; (2) the counter moves with the backup file of [REQ-025](#req-025), and the performer imports it when switching; (3) numbers carry a device letter (`2026-A003`); (4) on desktop, abendkasse reads the highest number from the PDFs in the invoice folder. **Proposed:** (1) for the first release, with (4) as a check where the folder is readable. **Needed by:** the invoice-number implementation.

<a id="open-b"></a>**OPEN-B — How the PDF reaches the email.** [REQ-022](#req-022). A `mailto:` link cannot attach a file. The plan is the [Web Share API](glossary.md#web-share-api), which opens the [share sheet](glossary.md#share-sheet) with the PDF, subject and text. It works on Android and iOS. On Windows Chrome and Edge it is uncertain. Fallbacks: (1) save the PDF, open a pre-filled `mailto:` email and let the performer drag the PDF in; (2) offer an email draft file (`.eml`) with the PDF attached, which the desktop email program opens. **Needed by:** the sending flow. A spike on every [reference platform](#reference-platforms) settles it.

<a id="open-c"></a>**OPEN-C — A number generated but never sent.** [REQ-012](#req-012). The button of [REQ-014](#req-014) assigns a number, saves the PDF and opens the email. If the performer then spots a mistake, should abendkasse let them correct the last invoice and regenerate it under the same number, as long as no later invoice exists? **Proposed:** yes, "correct the last invoice" replaces its PDF and keeps its number. Once a later invoice exists, the old one is final. **Needed by:** the invoice-number implementation.

<a id="open-d"></a>**OPEN-D — File naming.** [REQ-020](#req-020). **Proposed:** `<invoice number>_<gig date>_<venue>.pdf`, e.g. `2026-003_2026-09-19_Club-Example.pdf`, in a folder per year (`2026/`). Umlauts and spaces in the venue name are replaced (`Ü` → `Ue`, space → `-`). The reference invoice's scheme (`Rechnung_TANTE_THOMAS_<venue>_<year>_<nn>`) does not sort by number across venues. **Needed by:** the saving implementation.

<a id="open-e"></a>**OPEN-E — Test devices.** [Reference platforms](#reference-platforms). Which phone, tablet and computer Thomas tests on, and whether a Mac and an iPhone are available at all. **Needed by:** the sending spike ([OPEN-B](#open-b)).

<a id="open-f"></a>**OPEN-F — Legal check of the mandatory details.** [REQ-005](#req-005), [REQ-008](#req-008), [REQ-021](#req-021). The mandatory details are taken from §14 (4) UStG and §34a UStDV, the retention period from §14b UStG, the limits from §19 UStG, each as in force on 1 January 2025. They are checked against the current texts once. **Needed by:** the first release.

<a id="open-g"></a>**OPEN-G — PDF generation in the browser.** [REQ-017](#req-017), [REQ-018](#req-018). Candidates: (1) draw the PDF with a JavaScript PDF library (for example pdf-lib or jsPDF); (2) lay the invoice out in HTML and convert it (layout is easy, but conversion in the browser is unreliable); (3) a PDF template with form fields, filled in. **Needed by:** the PDF implementation. Settled with the sending spike or an [ADR](glossary.md#adr).

<a id="open-h"></a>**OPEN-H — Licence.** [REQ-031](#req-031). MIT (anyone may build on it, including closed products) or GPL-3.0 (derived works stay open; Thomas's project Tante uses it). **Needed by:** the first code in the repository.

<a id="revision-history"></a>
## 12. Revision history

Each requirement and open decision states what holds now, with who decided and when. This table says which pass changed what. Git has every earlier wording.

| Version | Date | Pass | Changes |
|---|---|---|---|
| 0.1 | 11 Nov 2026 | Intake | First draft from the intake conversation. [REQ-001](#req-001) to [REQ-037](#req-037); [OPEN-A](#open-a) to [OPEN-H](#open-h). |
