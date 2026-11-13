# Architecture decision records

Each file records one significant decision: its context, the decision, the alternatives considered and the consequences.
Records are numbered and never rewritten.
If a decision changes, a new record supersedes the old one.
The old one's status is updated to point to it.

Status values: **Proposed** (direction chosen, not yet validated), **Accepted**, **Superseded by ADR-NNNN**.
Each record is proposed in its own pull request and accepted by merging it, so `main` holds only accepted records.

A record that settles an open decision of [requirements.md](../requirements.md) names it in its title and links it.
The decision's entry in the requirements points back here.
Evidence that was measured rather than argued lives in [spikes](../spikes/) and is linked from the record.

New records copy [template.md](template.md).

| Record | Title | Status |
|---|---|---|
| [ADR-0001](0001-share-on-phones-gmail-compose-on-computers.md) | Phones share the PDF; computers save it, download it and open a pre-filled email (resolves OPEN-B) | Proposed |
