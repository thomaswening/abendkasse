# abendkasse: Glossary

This glossary explains the terms a reader of abendkasse's documents may not know. Each entry is tagged by where the term comes from:

- *domain*: German tax and invoicing law, found in tax guides;
- *engineering*: software engineering, found in programming references;
- *project*: coined by abendkasse, or used by abendkasse in a sense of its own.

A document links a term on its first use, e.g. `[share sheet](glossary.md#share-sheet)`. Anchors never change: a renamed term keeps its old anchor. Where [requirements.md](requirements.md) defines a term bindingly, the entry here is a one-line gloss and the requirements' wording governs.

Fixed labels after an entry relate it to others: **Kind of** names the broader term, **See also** related terms, **Not to be confused with** a look-alike with another meaning, **Defined in** the document whose wording governs.

<a id="adr"></a>**ADR** (architecture decision record) *(engineering)*: a short document that records one design decision, its context and the alternatives weighed. Example: a record "Generate the PDF with pdf-lib" that names the libraries compared and why one won.

<a id="client"></a>**client** (*Rechnungsempfänger*) *(project)*: who receives and pays the invoice. Example: the company that operates a club.

- Not to be confused with: [venue](#venue)
- Defined in: [requirements.md](requirements.md#client)

<a id="file-system-access-api"></a>**File System Access API** *(engineering)*: a browser interface that lets a web app read and write files in a folder the user picked once. Like a .NET program holding a path from a `FolderBrowserDialog`, except the browser asks the user for permission. Example: abendkasse saves every invoice into `Rechnungen/2026/` without a save dialog. Available in desktop Chrome and Edge, not in Safari or on phones.

- See also: [progressive web app](#pwa)

<a id="first-release"></a>**first release** (MVP) *(project)*: the smallest version of abendkasse that Thomas uses instead of his Word template.

- Defined in: [requirements.md](requirements.md#first-release)

<a id="gig-data"></a>**gig data** *(project)*: what changes from one invoice to the next: venue, event name, date, start and end time, fee.

- See also: [profile](#profile)
- Defined in: [requirements.md](requirements.md#gig-data)

<a id="invoice-number"></a>**invoice number** *(project)*: the number that identifies an invoice uniquely for the performer, in the form `YYYY-NNN`. Example: `2026-003`.

- Defined in: [requirements.md](requirements.md#invoice-number)

<a id="performer"></a>**performer** *(project)*: the person who played the gig and issues the invoice. Example: a DJ who invoices a club.

- Defined in: [requirements.md](requirements.md#performer)

<a id="profile"></a>**profile** *(project)*: the performer's fixed data that pre-fills every invoice: name, address, tax number, bank details, text templates.

- See also: [gig data](#gig-data)
- Defined in: [requirements.md](requirements.md#profile)

<a id="pwa"></a>**progressive web app** (PWA) *(engineering)*: a website that a browser can install like an app, with its own icon and window, that keeps working offline. Example: abendkasse, opened once from GitHub Pages and added to the phone's home screen.

<a id="reference-invoice"></a>**reference invoice** *(project)*: Thomas's current invoice from a Word template, kept privately. A cross-check for layout and content, not a specification.

- Defined in: [requirements.md](requirements.md#reference-invoice)

<a id="share-sheet"></a>**share sheet** *(engineering)*: the operating system's "Share" panel, which hands a file or text to another app the user picks. Example: on Android, tapping "Share" and picking Gmail opens a new email with the PDF attached.

- See also: [Web Share API](#web-share-api)

<a id="small-business-rule"></a>**small-business rule** (*Kleinunternehmerregelung*, §19 UStG) *(domain)*: the German rule that a business with small turnover charges no VAT. Since 1 January 2025 it applies while the turnover was at most €25,000 in the previous year and stays at most €100,000 in the current year. The invoice must then say that no VAT is charged. Example: a DJ with €8,000 a year from gigs and no other self-employed income.

- See also: [UStG](#ustg)

<a id="ustg"></a>**UStG** (*Umsatzsteuergesetz*), **UStDV** (*Umsatzsteuer-Durchführungsverordnung*) *(domain)*: the German VAT act and its implementing ordinance. §14 UStG lists what an invoice must contain, §14b how long it is kept, §19 the [small-business rule](#small-business-rule). §34a UStDV lists the shorter set of details for a small business's invoice.

<a id="venue"></a>**venue** *(project)*: where the gig took place, with a city. Belongs to one [client](#client). Example: "Club Example, Hamburg".

- Not to be confused with: [client](#client)
- Defined in: [requirements.md](requirements.md#venue)

<a id="web-share-api"></a>**Web Share API** *(engineering)*: a browser interface that opens the [share sheet](#share-sheet) from a web app, with files, a title and a text. Example: `navigator.share({ files: [pdf], title: "Rechnung 2026-003", text: "…" })`. Supported on Android and iOS. Desktop support varies.

- See also: [File System Access API](#file-system-access-api)
