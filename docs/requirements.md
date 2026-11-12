# abendkasse: Verifiable Product Requirements
Version: 0.7 draft | 12 November 2026

**Status:**

- After the first elicitation pass and two review rounds by Thomas (11 and 12 November 2026).
  Only the [first release](glossary.md#first-release) (the MVP) is detailed.
  Later capabilities are listed in [section 10](#10-later-releases) without detail.
- The first release supports one tax case: the [small-business rule](glossary.md#small-business-rule) of §19 [UStG](glossary.md#ustg).
  Its first platform is a Windows laptop.
  Phones follow in the same release.
- The biggest technical risk is sending the PDF as an email attachment from a browser ([OPEN-B](#open-b)).
  A spike settles it before the sending flow is built.
  [Invoice numbers](glossary.md#invoice-number) are timestamps by default, or a classic counter for [performers](glossary.md#performer) with one device ([OPEN-A](#open-a)).
- Open decisions are collected in [section 11](#open-decisions); how the document got here is in the [revision history](#revision-history).

## Requirement conventions

**SHALL** = mandatory for the stated release; **SHOULD** = preferred, with an acceptable documented exception; **COULD** = optional or future capability.
Each requirement has a stable ID and is never renumbered.
Conditions are expressed as **WHEN … THEN …**, **IF … THEN …**, **BEFORE …**, **WHILE …** or **AFTER …**.
An implementation technique is not a product requirement unless explicitly stated.
Items marked **OPEN** require a decision before they can be treated as acceptance criteria.
**OUT OF SCOPE** marks a capability explicitly not required for the first release.

Each requirement starts with what it requires.
A list below it gives, where they apply, its acceptance test, an example, its rationale, the evidence behind it and who decided it when.

<a id="first-release"></a>**The first release** = the MVP: the smallest version Thomas uses for his own gig invoices instead of his Word template.

<a id="performer"></a>**Performer** = the person who played the gig and issues the invoice.
Example: a DJ who invoices a club.

<a id="profile"></a>**Profile** = the performer's fixed data: name, stage name, address, contact details, tax number, bank details, and the defaults for the item text and the email.
It is entered once and pre-fills every invoice.

<a id="client"></a>**Client** = who receives and pays the invoice (*Rechnungsempfänger*), with a postal address.
Example: the company that operates a club, such as "Example Events GmbH".

<a id="venue"></a>**Venue** = where the gig took place, with a city.
Example: "Club Example, Hamburg".
A venue belongs to one client.
Several venues may share a client.
Client and venue are kept apart because the invoice goes to the client while the item text names the venue: the [reference invoice](glossary.md#reference-invoice) is addressed to a club's operating company, not to the club.

<a id="gig-data"></a>**Gig data** = what changes from one invoice to the next: the venue (and with it the client), the event name, the date, the start and end time, and the fee.

<a id="invoice-number"></a>**Invoice number** = the number that identifies an invoice uniquely for the performer.
abendkasse builds it in one of two schemes ([REQ-012](#req-012)): a **timestamp number** from the moment the invoice is generated, `YYYY-MMDD-HHMM` (example: `2026-1112-1834`), or a **counter number**, the year and a counter, `YYYY-NNN` (example: `2026-003`).

<a id="number-range"></a>**Number range** = a series (*Nummernkreis*) of invoice numbers, each issued once.
A performer may keep any number of ranges, for example one per year, month or day (UStAE 14.5 (10)).
Example: each timestamp number is the first number of the range for its minute; the counter numbers `2026-001`, `2026-002`, … form the range for 2026.

<a id="reference-invoice"></a>**The reference invoice** = Thomas's current invoice, made from a Word template (`Rechnung_TANTE_THOMAS_Frau_Holle_2026_06_14.docx`, kept privately, not in this repository).
It is a cross-check for layout and content, not a specification.
Its personal data (address, IBAN, tax number) never appears in this repository, its examples or its tests ([REQ-024](#req-024)).

<a id="reference-platforms"></a>**Reference platforms** (used by every platform requirement): Windows 11 with current Chrome, Edge and Firefox; macOS with current Safari and Chrome; Android with current Chrome and Firefox; iOS with current Safari.
"Current" means the stable release at the time of testing.
Windows 11 is the first platform: Thomas writes most invoices on his Windows laptop, with Gmail in the browser.
He tests phones on Android with the Gmail app.
No Apple device is available for testing yet ([OPEN-E](#open-e)).

## 1. Purpose and users

<a id="req-001"></a>**REQ-001 — Purpose (SHALL).**
abendkasse SHALL turn the gig data of one gig into a finished invoice PDF, store it and hand it to the performer's email ready to send, so that the performer types only the [gig data](#gig-data) and presses one button.

- **Rationale:** writing an invoice after a gig is a small task that gets postponed because of the friction of copying fixed data, counting invoice numbers and attaching files.
  The tagline states the goal: "Gig done. Invoice sent."
- **Decided:** Thomas, in the intake, 11 November 2026.

<a id="req-002"></a>**REQ-002 — First user: a DJ under the small-business rule (SHALL).**
The first release SHALL serve a DJ who invoices clubs and event companies in Germany under the [small-business rule](glossary.md#small-business-rule).

- **Example:** Thomas, as the DJ Tante Thomas.
- **Rationale:** it is Thomas's case.
  Building for one real user first keeps the first release small.
- **Decided:** Thomas, in the intake, 11 November 2026.

<a id="req-003"></a>**REQ-003 — Later users: other performers (COULD).**
A later release COULD serve other performers (live musicians, hosts, lighting artists) and performers who charge VAT.
The first release SHALL NOT make choices that rule them out: item text, units and tax handling are data, not code ([REQ-030](#req-030)).

<a id="req-004"></a>**REQ-004 — Out of scope for the first release (OUT OF SCOPE).**
For the first release, the following are out of scope:

- invoices with VAT;
- several items per invoice;
- credit notes and cancellation invoices;
- invoice history and search;
- payment tracking and reminders;
- e-invoices (XRechnung, ZUGFeRD);
- a logo or custom layout;
- languages other than German on the invoice;
- any server, account or synchronisation between devices.

Each of these is listed in [section 10](#10-later-releases) if a later release may want it.

## 2. Invoice content

<a id="req-005"></a>**REQ-005 — Mandatory details (SHALL).**
Every invoice SHALL contain:

- (a) the full name and address of the performer;
- (b) the full name and address of the client;
- (c) the invoice date;
- (d) the [invoice number](#invoice-number);
- (e) the type and extent of the service;
- (f) the date of the service;
- (g) the fee;
- (h) the note that no VAT is charged because of the small-business rule.

WHERE the performer has entered a tax number (*Steuernummer*) or a VAT ID (*USt-IdNr.*), the invoice SHALL show it.
IF the profile has neither, THEN abendkasse SHALL warn once in the profile and SHALL still generate invoices.
abendkasse SHALL NOT offer the personal tax ID (*Steuer-ID*) as a substitute.

- **Rationale:** for a small business, §34a UStDV (in force since 1 January 2025) requires (a), (b), (c), (e), (g) and (h).
  §14 (4) UStG, which applies to every other business, also requires (d), (f) and a tax number.
  The invoice number and the service date cost nothing, so they are always shown.
  Not every performer has a tax number, for example one who has not yet registered with the tax office, so it is shown when present.
- **Decided:** Thomas, 11 November 2026.
- **Open:** the legal list is checked against the current text of both before the first release ([OPEN-F](#open-f)).

<a id="req-006"></a>**REQ-006 — Service description (SHALL).**
The service SHALL be described by one item line built from a template in the [profile](#profile) and the [gig data](#gig-data).
BEFORE generating, the performer SHALL be able to edit the item line of this one invoice.
The edit SHALL NOT change the template.

- **Example:** the default template produces "DJ-Tätigkeit am 19.09.2026, von 23:00 Uhr bis 20.09.2026 um 01:00 Uhr, „Example Night“, Club Example, Hamburg".
- **Rationale:** this is the reference invoice's wording.
  It states the date of the service ([REQ-005](#req-005) (f)) without a separate field.
  Some gigs need a different wording, for example a set split in two.
  Editing the line is the cheap way to allow that without an editable document ([REQ-043](#req-043)).
- **Decided:** Thomas, 12 November 2026 (the editable line).

<a id="req-007"></a>**REQ-007 — Gigs past midnight (SHALL).**
IF the end time is earlier than the start time, THEN the gig SHALL be taken to end on the following day.
The item text SHALL then name both dates.

- **Rationale:** most club gigs end after midnight.
  The reference invoice shows such a gig.

<a id="req-008"></a>**REQ-008 — Small-business note (SHALL).**
The invoice SHALL carry the note "Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen."
It SHALL show the fee as the total, with no VAT line.

- **Rationale:** the note is mandatory ([REQ-005](#req-005) (h)).
  Showing VAT under the small-business rule would make the performer owe it (§14c UStG).

<a id="req-009"></a>**REQ-009 — Language (SHALL).**
The invoice SHALL be in German, with German date and amount formats.
The app's own screens SHALL be in German in the first release.
Their texts SHOULD be kept in one place, so that a later release can add English.

- **Example:** `19.09.2026`, `50,00 EUR`.
- **Rationale:** the clients are German businesses.
  The first users are performers in Germany.
- **Decided:** Thomas, 11 November 2026.

## 3. Fixed data

<a id="req-010"></a>**REQ-010 — Profile entered once (SHALL).**
The performer SHALL enter the [profile](#profile) once.
Every invoice SHALL be pre-filled from it.
Changing the profile SHALL change only invoices created afterwards.

<a id="req-011"></a>**REQ-011 — Clients and venues remembered (SHALL).**
WHEN the performer creates an invoice for a new venue, THEN abendkasse SHALL ask for the venue's city and its [client](#client) (a known client or a new one with name and address).
abendkasse SHALL remember both.
WHEN the performer chooses a known venue, THEN the client SHALL be filled in without further input.
The performer SHALL be able to edit a venue (name, city, client) and a client (name, address, email) at any time.
As with the profile ([REQ-010](#req-010)), an edit SHALL change only invoices created afterwards.

- **Example:** fixing a typo, or a wrong venue name whose address is right.
- **Rationale:** most gigs repeat at the same few venues.
  The client's address is the field most tedious to retype.
- **Decided:** Thomas, 11 November 2026 (editing).

<a id="req-012"></a>**REQ-012 — Invoice number schemes (SHALL).**
abendkasse SHALL offer two schemes for the [invoice number](#invoice-number), chosen in the profile:

| Scheme | Example | For whom |
|---|---|---|
| Timestamp (default) | `2026-1112-1834` | Any number of devices. |
| Counter | `2026-003` | One device only. |

A timestamp number SHALL be taken from the device's clock when the PDF is first generated, in local time.
IF the same device has already issued that number, THEN abendkasse SHALL append a suffix (`2026-1112-1834-2`).
WHEN the performer chooses the counter scheme, THEN abendkasse SHALL explain that it suits one device only: two devices count independently and would issue the same numbers.
The performer SHALL be able to switch schemes at any time.
abendkasse SHALL never issue the same number twice on one device.

- **Rationale:** invoice numbers must be unique (§14 (4) no. 4 UStG).
  abendkasse has no server to count centrally, so a counter is safe only on one device.
  A timestamp needs no coordination between devices.
  Its order is the order in time, across all devices.
  Two devices collide only if both issue an invoice in the same minute, which one person writing invoices does not do.
  The two schemes cannot produce the same number.
- **Evidence:** a number range per day or shorter period is allowed ([number range](#number-range)); the research is in [OPEN-A](#open-a).
- **Decided:** Thomas, 12 November 2026, accepting the same-minute case.

<a id="req-038"></a>**REQ-038 — Number proposed, editable, checked (SHALL).**
abendkasse SHALL pre-fill the next number of the chosen scheme.
The counter SHALL start at 001 each year.
The performer SHALL be able to overwrite the number.
IF a number already exists on this device or in the invoice folder, THEN abendkasse SHALL refuse it and say why.
WHERE the invoice folder is readable ([REQ-019](#req-019)), abendkasse SHALL check the numbers found there.

- **Example:** continuing from invoices written before abendkasse, or keeping track of numbers oneself.
- **Rationale:** an own number is the counter scheme with its proposal overwritten, so it needs no third scheme.
- **Decided:** Thomas, 12 November 2026.

<a id="req-039"></a>**REQ-039 — Correcting an invoice (SHALL).**
abendkasse SHALL let the performer correct the most recent invoice issued on this device and regenerate it.
By default the corrected invoice SHALL keep its number and replace the old PDF.
The performer SHALL be able to choose instead that the correction takes the next number.
The old PDF SHALL then be kept.

- **Rationale:** a mistake noticed before sending is fixed without a gap in the numbers.
  Once the client has the invoice, a correction under the same number leaves two different documents with one number.
  abendkasse cannot know whether the invoice was sent, so the performer chooses.
- **Decided:** Thomas, 11 November 2026 ([OPEN-C](#open-c)).

<a id="req-013"></a>**REQ-013 — Invoice date (SHALL).**
The invoice date SHALL default to today.
The performer SHALL be able to change it.

## 4. Creating an invoice

<a id="req-014"></a>**REQ-014 — One screen, one button (SHALL).**
Creating an invoice SHALL take one screen with the [gig data](#gig-data) fields and one button that generates, saves and sends ([REQ-017](#req-017), [REQ-019](#req-019)).

- **Acceptance:** for a known venue, the performer fills in at most six fields (venue, event name, date, start time, end time, fee) and presses one button.
  The share or email screen then opens with the PDF attached.

<a id="req-015"></a>**REQ-015 — Sensible defaults (SHOULD).**
The gig date SHOULD default to today WHEN the invoice is started at or after 18:00, and to yesterday otherwise.
The fee and the times SHOULD default to the values of the last invoice for the same venue.

- **Rationale:** Thomas writes invoices (i) right after the gig, often after midnight, (ii) the next day, or (iii) on any later day.
  For a gig that starts in the evening, the default is right in cases (i) and (ii).
  Case (iii) takes one change of the date.
- **Decided:** Thomas, 11 November 2026 (the three cases).

<a id="req-016"></a>**REQ-016 — Input checks (SHALL).**
BEFORE generating, abendkasse SHALL refuse an empty required field, a fee of zero or less, and a gig date in the future, each with a message that names the field.
IF the profile lacks a mandatory detail of [REQ-005](#req-005), THEN abendkasse SHALL refuse to generate and SHALL say which one.

- **Rationale:** an invoice missing a mandatory detail may be rejected by the client's bookkeeping.
  The performer then has to write a corrected one.

## 5. PDF

<a id="req-017"></a>**REQ-017 — PDF generated on the device (SHALL).**
abendkasse SHALL generate the invoice as a PDF on the performer's device, without sending any data to a server.
The PDF SHALL embed its fonts.
It SHALL look the same on every [reference platform](#reference-platforms).

- **Acceptance:** the PDF generated from the same input on two reference platforms is identical except for its creation timestamp and document ID.
- **Open:** how the PDF is made in the browser ([OPEN-G](#open-g)).

<a id="req-018"></a>**REQ-018 — Layout (SHALL).**
The PDF SHALL follow the reference invoice's layout on one A4 page:

- the performer's details in the header;
- the client's address in the window position of a DIN 5008 envelope;
- invoice number and date;
- one item table with the total;
- the small-business note and a closing line;
- the bank details and tax number in the footer.

## 6. Saving and archive

<a id="req-019"></a>**REQ-019 — The PDF is saved before it is sent (SHALL).**
WHEN the performer presses the button of [REQ-014](#req-014), THEN abendkasse SHALL save the PDF before it opens the sending step.
On platforms that let a web app write to a chosen folder, the performer SHALL choose that folder once.
abendkasse SHALL then save there without asking again.
The performer SHALL be able to choose another folder at any time.
On the other platforms, abendkasse SHALL hand the file to the platform's save or download step.

- **Rationale:** the saved PDFs are the performer's archive.
  A PDF only attached to an email can be lost with the email.
- **Decided:** Thomas, 11 November 2026 (changing the folder).
- **Note:** writing to a chosen folder works on desktop Chrome and Edge ([File System Access API](glossary.md#file-system-access-api)), not in Firefox, Safari or on phones.
  In Firefox the PDF goes through the download step.
  The folder check of [REQ-038](#req-038) is then not available.

<a id="req-020"></a>**REQ-020 — File name (SHALL).**
The performer SHALL choose the file-name scheme in the profile, from these presets:

| Preset | Example |
|---|---|
| Invoice, number, venue (default) | `Rechnung_2026-1112-1834_Club-Example.pdf` |
| Stage name, number, venue | `Tante-Example_2026-1112-1834_Club-Example.pdf` |
| Own pattern | `{nummer}_{datum}_{venue}.pdf` |

An own pattern SHALL contain `{nummer}`; abendkasse SHALL refuse one that does not.
The stage-name preset SHALL use the legal name where no stage name is set.
Umlauts, `ß` and characters not allowed in file names SHALL be replaced: `ä` → `ae`, `ö` → `oe`, `ü` → `ue` (capitals likewise, `Ä` → `Ae`), `ß` → `ss`, other accented letters by their base letter (`é` → `e`), spaces by `-`.
The PDFs SHALL go into a folder per year of the invoice date (`2026/`).

- **Example:** "Großer Saal Köln" → `Grosser-Saal-Koeln`.
- **Rationale:** every scheme contains the invoice number, so abendkasse can read the numbers back from the folder ([REQ-038](#req-038)).
- **Decided:** Thomas, 11 November 2026 (the presets and the default; [OPEN-D](#open-d)).

<a id="req-021"></a>**REQ-021 — Retention is the performer's (SHALL).**
abendkasse SHALL tell the performer, in its documentation and once when the first invoice is saved, that invoices must be kept for eight years (§14b UStG).
It SHALL say that abendkasse does not keep them.

- **Rationale:** abendkasse has no server ([REQ-024](#req-024)).
  Browser storage can be cleared by the browser or the user.
  The saved PDF files are the archive.

## 7. Sending

<a id="req-022"></a>**REQ-022 — Email pre-filled with the PDF attached (SHALL).**
AFTER the PDF is saved, abendkasse SHALL open the platform's sending step with the PDF attached, a subject and a body text pre-filled from templates in the profile.
The performer SHALL review and send it.
abendkasse SHALL NOT send anything itself.

- **Example:** the default subject "Rechnung 2026-1112-1834 – Example Night, 19.09.2026".
- **Rationale:** sending stays under the performer's control.
  abendkasse needs no email account.
- **Open:** how the attachment reaches the email on each platform ([OPEN-B](#open-b)).

<a id="req-023"></a>**REQ-023 — Client email address (SHOULD).**
abendkasse SHOULD store an email address per client and pre-fill it as the recipient where the platform allows.

- **Note:** the [share sheet](glossary.md#share-sheet) on phones takes no recipient.
  The performer then picks it in the email app.

## 8. Data and privacy

<a id="req-024"></a>**REQ-024 — No server, no tracking (SHALL).**
All profile, client, venue and invoice data SHALL stay on the performer's device.
abendkasse SHALL NOT send any of it over the network.
It SHALL contain no analytics or tracking.
It SHALL load all its code and fonts from its own host and SHALL make no requests to third parties, such as font or script CDNs.
The repository, its examples and its tests SHALL use invented data only.

- **Rationale:** invoices hold the performer's bank details, tax number and address.
  A free project without a server costs nothing to run.
- **Decided:** Thomas, in the intake, 11 November 2026 (no server).

<a id="req-025"></a>**REQ-025 — Backup of the fixed data (SHALL).**
abendkasse SHALL export the profile, the clients, the venues and the counter to one file, and import it again on the same or another device.
It SHOULD ask the browser for persistent storage.

- **Rationale:** browser storage can be cleared.
  In the counter scheme, losing the counter risks a duplicate invoice number.
  Losing the profile and clients brings back the friction abendkasse removes.

<a id="req-041"></a>**REQ-041 — Moving to a new device (SHALL).**
abendkasse SHALL let the performer move to a new device by exporting the backup of [REQ-025](#req-025) on the old device and importing it on the new one.
In the counter scheme, the old device SHALL refuse to issue invoices after the export.
The new device SHALL then continue the counter.

- **Rationale:** a performer replacing a phone wants to carry on without retyping anything.
  In the counter scheme, locking the old device keeps two devices from counting in parallel.
  The timestamp scheme needs no hand-over.
- **Decided:** Thomas, 11 November 2026.

<a id="req-042"></a>**REQ-042 — Data protection (SHALL).**
abendkasse SHALL publish a privacy notice (*Datenschutzerklärung*).
It SHALL state that the app keeps data only on the device, that the hosting provider (GitHub Pages) logs visitors' IP addresses, and that abendkasse itself collects nothing.
The performer SHALL be able to delete a client or venue.
Invoices already saved SHALL be kept, because the law requires keeping them ([REQ-021](#req-021)).
The performer SHALL be able to delete all of abendkasse's data on the device.

- **Rationale:** the [GDPR](glossary.md#gdpr) (*DSGVO*) applies to the website through the hosting logs.
  It also applies to the performer, who stores clients' names and addresses, sometimes those of private persons.
  abendkasse keeps that easy to honour.
- **Decided:** Thomas asked for it, 11 November 2026.
- **Open:** whether the website also needs a legal notice (*Impressum*) ([OPEN-F](#open-f)).

## 9. Platforms, installation and distribution

<a id="req-026"></a>**REQ-026 — Installable web app (SHALL).**
abendkasse SHALL be a [progressive web app](glossary.md#pwa): a website that can be installed like an app on every [reference platform](#reference-platforms), from one codebase.

- **Rationale:** it avoids app stores, code signing and paid developer accounts.
  This technique is a requirement because it is what keeps the project free to publish.
- **Decided:** Thomas, in the intake, 11 November 2026.

<a id="req-027"></a>**REQ-027 — Works offline (SHALL).**
After the first visit, abendkasse SHALL create, save and hand over an invoice without a network connection.

- **Rationale:** an invoice is often written backstage or on the way home.

<a id="req-028"></a>**REQ-028 — Free hosting (SHALL).**
abendkasse SHALL be hosted on GitHub Pages.
It SHALL cost its users and its maintainer nothing.

- **Decided:** Thomas, in the intake, 11 November 2026.

<a id="req-029"></a>**REQ-029 — Platform differences behind one interface (SHALL).**
Saving and sending differ by platform ([REQ-019](#req-019), [REQ-022](#req-022)).
Those differences SHALL sit behind one small interface, so that the invoice flow does not depend on the platform.

- **Acceptance:** adding a fallback for one platform changes only that interface's implementations.
- **Decided:** Thomas, in the intake, 11 November 2026.

<a id="req-030"></a>**REQ-030 — Tax handling as data (SHALL).**
The invoice data SHALL record the tax case (first release: small-business rule only), the net amount, the VAT rate and the VAT amount, even though the first release fixes the rate at zero.

- **Acceptance:** adding VAT in a later release changes the PDF layout and the input screen, not the stored data model.
- **Rationale:** the small-business limits since 2025 (€25,000 turnover in the previous year, €100,000 in the current one, counting all self-employed turnover) mean many DJs charge VAT.
- **Decided:** Thomas, in the intake, 11 November 2026.

<a id="req-031"></a>**REQ-031 — Open source (SHALL).**
abendkasse SHALL be published under GPL-3.0 in the public repository [thomaswening/abendkasse](https://github.com/thomaswening/abendkasse).

- **Decided:** Thomas, 11 November 2026 ([OPEN-H](#open-h)).

<a id="req-032"></a>**REQ-032 — No tax advice (SHALL).**
The README and the app SHALL state that abendkasse is not tax advice.
They SHALL state that the performer is responsible for the correctness of the invoices.

## 10. Later releases

Listed so that the first release leaves room for them.
Not detailed until a release takes them on.

<a id="req-033"></a>**REQ-033 — Invoice history from the PDFs (COULD).**
A later release COULD list and search past invoices.

- **Note:** idea from the intake: each PDF embeds its invoice data (as a PDF attachment or metadata).
  The folder of PDFs is then the archive, with no separate database or CSV.

<a id="req-034"></a>**REQ-034 — VAT (COULD).**
A later release COULD issue invoices with VAT for performers outside the small-business rule ([REQ-030](#req-030)).

<a id="req-035"></a>**REQ-035 — Logo and custom look (COULD).**
A later release COULD add a logo, colours and a choice of fonts.

<a id="req-036"></a>**REQ-036 — More items per invoice (COULD).**
A later release COULD add items besides the fee.

- **Example:** the common extras for DJs: travel costs (flat or per kilometre), accommodation, equipment hire, extra time, a deposit deducted, and several gigs for one client on one invoice.
- **Note:** the first release's data model already holds a list of items.

<a id="req-043"></a>**REQ-043 — Editable document export (COULD).**
A later release COULD also save the invoice as an editable document (Word `.docx` or LibreOffice `.odt`), so that the performer can change details freely.
The PDF SHALL stay the invoice that is sent and archived.

- **Decided:** Thomas, 11 November 2026.
- **Note:** an edited copy can drift from the archived PDF under the same number.

<a id="req-040"></a>**REQ-040 — Invoice folder in the cloud on phones (COULD).**
A later release COULD read and write the invoice folder in a cloud drive (for example Google Drive) directly from a phone, so that phones can check numbers against the folder ([REQ-038](#req-038)) as desktops do.

- **Note:** it needs a sign-in with the cloud provider and a registered app there.

<a id="req-037"></a>**REQ-037 — Cancellation invoices (COULD).**
A later release COULD issue a cancellation invoice (*Stornorechnung*) that refers to a wrong invoice.

<a id="open-decisions"></a>
## 11. Deferred capabilities and unresolved decisions

An open decision is resolved immediately before the work that depends on it, not in advance.
Several are better settled with evidence from a spike than by argument.
One settled early on a guess is worse than one settled late on a measurement.
The roadmap names, per phase, which decisions that phase needs; a phase is not complete until they are recorded here.
Each open decision therefore carries a **Needed by** note saying what it blocks.

A settled decision stays in this section, marked **Resolved** or **Recorded**.
It states the question, what holds now, who decided it and when, and why.
How it got there is in the [revision history](#revision-history) and in git.

<a id="open-a"></a>**OPEN-A — Invoice numbers on several devices.** [REQ-012](#req-012), [REQ-038](#req-038), [REQ-041](#req-041).
How do invoice numbers stay unique when one performer invoices from several devices without a server?

- **Resolved** (Thomas, 12 November 2026): timestamp numbers (`2026-1112-1834`) by default, a classic counter (`2026-003`) for performers with one device, and an editable number in both.
- **Rationale:** every scheme that guarantees uniqueness without a server needs devices to exchange data at setup, and its codes grow (`A`, `B`, `BA`, …).
  Per-device letters also break the order: `2026-002` from the laptop, then `2026-A001` from the phone, says nothing about which came first.
  A timestamp keeps the order in time across devices and needs no setup.
  Its one gap, two devices in the same minute, does not arise for one person.
- **Evidence** (12 November 2026): German guidance allows any number of ranges by period, down to a day ([UStAE 14.5](https://www.steuerschroeder.de/steuergesetze/ustae/14.5), [IHK Ostwestfalen](https://www.ostwestfalen.ihk.de/fileadmin/Dokumente/Recht/Merkblaetter-Steuern/Pflichtangaben_fuer_Rechnungen.pdf)).
  Cloud apps such as [Lexware Office](https://help.lexware.de/de-form/articles/548053-nummernkreise-einstellen-und-rechnungsnummern-vergeben) count on their server (`RE-2026-0001`).
  Offline apps reserve number blocks per device.

<a id="open-b"></a>**OPEN-B — How the PDF reaches the email.** [REQ-022](#req-022).
How does the PDF get into the performer's email as an attachment, on each reference platform?

- **Candidates:** the [Web Share API](glossary.md#web-share-api), which opens the [share sheet](glossary.md#share-sheet) with the PDF, subject and text.
  It works on Android and iOS; on Windows Chrome and Edge it is uncertain.
  A `mailto:` link alone cannot attach a file.
- **Candidates:** fallback 1: save the PDF, open a pre-filled `mailto:` email and let the performer drag the PDF in.
- **Candidates:** fallback 2: an email draft file (`.eml`) with the PDF attached, which a desktop email program opens.
- **Needed by:** the sending flow.
  A spike on the [reference platforms](#reference-platforms) settles it.

<a id="open-c"></a>**OPEN-C — Correcting an invoice already generated.** [REQ-039](#req-039).
Does a correction keep the invoice's number?

- **Resolved** (Thomas, 11 November 2026): by default it keeps the number; the performer can choose the next number instead.
- **Rationale:** keeping the number avoids gaps for a mistake found before sending.
  Only the performer knows whether the invoice has been sent.

<a id="open-d"></a>**OPEN-D — File naming.** [REQ-020](#req-020).
How are the PDFs named?

- **Resolved** (Thomas, 11 November 2026): the performer chooses from presets, default `Rechnung_<number>_<venue>.pdf`, every preset containing the number.
- **Rationale:** performers name files differently.
  The number in every name lets abendkasse check numbers against the folder.

<a id="open-e"></a>**OPEN-E — Test devices.** [Reference platforms](#reference-platforms).
Which devices and email programs does Thomas test on?

- **Resolved** (Thomas, 11 November 2026): a Windows laptop with Chrome, Edge and Gmail in the browser; an Android phone with Chrome and the Gmail app.
  macOS and iOS stay reference platforms but are untested until someone with an Apple device tests them.
- **Rationale:** these are the devices Thomas uses for invoices.

<a id="open-f"></a>**OPEN-F — Legal check of the mandatory details.** [REQ-005](#req-005), [REQ-008](#req-008), [REQ-012](#req-012), [REQ-021](#req-021), [REQ-042](#req-042).
Do the cited legal texts, as in force now, say what these requirements assume?

- **Candidates:** the texts to check: the mandatory details in §14 (4) UStG and §34a UStDV, the retention period in §14b UStG, the limits in §19 UStG, and the permission for several number ranges in UStAE 14.5 (10), each as in force on 1 January 2025.
  The same check covers data protection: the privacy notice, and whether the website needs a legal notice under §5 [DDG](glossary.md#ddg) ([REQ-042](#req-042)).
- **Needed by:** the first release.

<a id="open-g"></a>**OPEN-G — PDF generation in the browser.** [REQ-017](#req-017), [REQ-018](#req-018).
How does abendkasse make the PDF in the browser?

- **Candidates:** (1) draw the PDF with a JavaScript PDF library, for example pdf-lib or jsPDF.
- **Candidates:** (2) lay the invoice out in HTML and convert it.
  Layout is easy, but conversion in the browser is unreliable.
- **Candidates:** (3) fill in a PDF template with form fields.
- **Needed by:** the PDF implementation.
  Settled with the sending spike or an [ADR](glossary.md#adr).

<a id="open-h"></a>**OPEN-H — Licence.** [REQ-031](#req-031).
MIT or GPL-3.0?

- **Resolved** (Thomas, 11 November 2026): GPL-3.0.
- **Rationale:** distributed forks stay open source, so nobody can turn abendkasse into a closed paid app.
  Thomas's project Tante uses the same licence.

<a id="revision-history"></a>
## 12. Revision history

Each requirement and open decision states what holds now, with who decided and when.
This table says which pass changed what.
Git has every earlier wording.

| Version | Date | Pass | Changes |
|---|---|---|---|
| 0.1 | 11 Nov 2026 | Intake | First draft from the intake conversation. [REQ-001](#req-001) to [REQ-037](#req-037); [OPEN-A](#open-a) to [OPEN-H](#open-h). |
| 0.2 | 11 Nov 2026 | 1 | Per-device [number ranges](#number-range): rewrote [REQ-012](#req-012), added [REQ-038](#req-038) and [REQ-039](#req-039), changed [REQ-025](#req-025). Tax number shown when present ([REQ-005](#req-005)). German screens ([REQ-009](#req-009)). File-name presets ([REQ-020](#req-020)). GPL-3.0 ([REQ-031](#req-031)). Typical extra items listed ([REQ-036](#req-036)). Added [REQ-040](#req-040). Resolved [OPEN-C](#open-c), [OPEN-D](#open-d), [OPEN-H](#open-h); [OPEN-A](#open-a) and [OPEN-E](#open-e) in part; widened [OPEN-F](#open-f). |
| 0.3 | 11 Nov 2026 | 1, while planning the sending spike | Resolved [OPEN-E](#open-e): test devices and email programs; Apple platforms untested. |
| 0.4 | 11 Nov 2026 | Review of PR 1 | Editable clients and venues ([REQ-011](#req-011)). Precise date default ([REQ-015](#req-015)). Folder changeable; Firefox added to the reference platforms ([REQ-019](#req-019)). `ß` and accents in file names ([REQ-020](#req-020)). No third-party requests ([REQ-024](#req-024)). Added [REQ-041](#req-041) (moving to a new device), [REQ-042](#req-042) (data protection), [REQ-043](#req-043) (editable export, later). Letters assigned automatically ([OPEN-A](#open-a)). Widened [OPEN-F](#open-f). |
| 0.5 | 12 Nov 2026 | Second review of PR 1 | Item line editable per invoice ([REQ-006](#req-006)). Setup flow for further devices written out, with its one remaining gap ([OPEN-A](#open-a)). |
| 0.6 | 12 Nov 2026 | Second review of PR 1 | Timestamp and counter schemes replace per-device letters: rewrote [REQ-012](#req-012), [REQ-038](#req-038), [REQ-041](#req-041), the defined terms [invoice number](#invoice-number) and [number range](#number-range). Simplified [REQ-025](#req-025) and [REQ-039](#req-039). Resolved [OPEN-A](#open-a). |
| 0.7 | 12 Nov 2026 | Format | Brought to the new entry layout (claude-config PR 39): each requirement and open decision is a statement and a labelled list, one sentence per source line. Open decisions are phrased as questions. No requirement changed in substance. |
