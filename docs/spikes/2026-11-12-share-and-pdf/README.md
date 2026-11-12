# Share and PDF spike: test page

A throwaway test page for the share and PDF spike, built on 12 November 2026.
It settles [OPEN-B](../../requirements.md#open-b), [OPEN-G](../../requirements.md#open-g) and the save path of [REQ-019](../../requirements.md#req-019).
The [spike report](../2026-11-12-share-and-pdf.md) holds the results; this folder is the evidence behind it.
It is not product code and is deleted or frozen once the report is merged.

## Running it

The page is published with GitHub Pages from the branch `spike/share-and-pdf`, folder `docs/`:
<https://thomaswening.github.io/abendkasse/spikes/2026-11-12-share-and-pdf/>.

Locally, from the repository root:

```bash
python -m http.server 8765 --directory docs
```

Then open `http://localhost:8765/spikes/2026-11-12-share-and-pdf/`.
Sharing and the folder picker need a secure context, which `localhost` and GitHub Pages are.

The reference hash of the PDF comes from Node:

```bash
node docs/spikes/2026-11-12-share-and-pdf/tools/reference-hash.js
```

If `invoice-pdf.js` changes, update `NODE_REFERENCE_HASH` in `spike.js` to its output.

## Files

| File | Purpose |
|---|---|
| `index.html`, `spike.css`, `spike.js` | The page: one section per spike question, observation fields, results as Markdown. |
| `invoice-pdf.js` | Draws the invented test invoice with pdf-lib; runs in the browser and in Node. |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Make the page installable; `sw.js` also serves the generated PDF under a same-origin URL for the drag test. |
| `tools/reference-hash.js` | Builds the same PDF in Node and prints its SHA-256. |
| `vendor/`, `fonts/` | Pinned third-party code and fonts, loaded from this host only ([REQ-024](../../requirements.md#req-024)). |

## Vendored files

| File | Source | Licence | SHA-256 |
|---|---|---|---|
| `vendor/pdf-lib-1.17.1.min.js` | npm `pdf-lib@1.17.1`, `dist/pdf-lib.min.js` | MIT (`vendor/pdf-lib-LICENSE.txt`) | `0f9a5cad07941f0826586c94e089d89b918c46e5c17cf2d5a3c6f666e3bc694f` |
| `vendor/fontkit-1.1.1.umd.min.js` | npm `@pdf-lib/fontkit@1.1.1`, `dist/fontkit.umd.min.js` | MIT (per its `package.json`) | `d8df561b9fba98e24f2e5130e40948809281bbbc55a20c412359f1a0a5eb35a6` |
| `fonts/NotoSans-Regular.ttf` | [notofonts](https://github.com/notofonts/notofonts.github.io), `fonts/NotoSans/hinted/ttf/` | SIL Open Font License 1.1 (`fonts/OFL.txt`) | `478c558ea716033cd60c03438f628dfa75694dcf6b5f6d505a2f05fd2b4f3823` |
| `fonts/NotoSans-Bold.ttf` | as above | as above | `1df075a380fc7cb898acf64c1f7b3b4dd780de3caa860178bf929de35817a913` |

All invoice data on the page is invented ([REQ-024](../../requirements.md#req-024)).
