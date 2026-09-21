# AI Index - Frontend

## Purpose

This file is the frontend entry point for AI-assisted development guidance.
It helps future agents find the most relevant implementation and documentation files quickly.

## Primary Documents

- [AGENTS.md](AGENTS.md) — project rules and workflow guardrails
- [BLUEPRINT.md](BLUEPRINT.md) — architecture, stack, and planned modules
- [CHANGELOG.md](CHANGELOG.md) — project change history

`AGENTS.md` is the primary rule file. Focused guidance lives under
`.docs/ai-context/` and does not override the root rules.

## Focused Context

- [.docs/ai-context/spec-backend.md](.docs/ai-context/spec-backend.md) — backend API contract alignment
- [.docs/ai-context/spec-frontend.md](.docs/ai-context/spec-frontend.md) — frontend component and UX conventions
- [.docs/ai-context/spec-consistency.md](.docs/ai-context/spec-consistency.md) — domain names, statuses, and errors
- [.docs/ai-context/anti-bloat.md](.docs/ai-context/anti-bloat.md) — complexity control
- [.docs/ai-context/pre-dormitory-checklist.md](.docs/ai-context/pre-dormitory-checklist.md) — final verification checklist
- [SYSTEM-DIAGRAMS.md](SYSTEM-DIAGRAMS.md) — current system diagrams

## History

- [.docs/AI-CHANGELOG/](.docs/AI-CHANGELOG/) — AI-assisted change notes
- [ai-CHANGELOG.md](ai-CHANGELOG.md) — legacy AI change log; do not add new entries here

## Frontend Module Map

- [src/modules/auth](src/modules/auth) — login, registration, auth screens
- [src/modules/admin](src/modules/admin) — admin dashboard and management screens
- [src/modules/student](src/modules/student) — student-facing dashboard and views
- [src/modules/billing](src/modules/billing) — billing UI and slip upload flow
- [src/modules/maintenance](src/modules/maintenance) — maintenance request UI
- [src/modules/visitor](src/modules/visitor) — visitor registration and tracking UI
- [src/modules/ocr](src/modules/ocr) — OCR upload workflow UI

## Current Alignment Notes

- The frontend must stay aligned with the backend API contracts.
- Face Detection / Face Verification is out of scope for this term.
- The project should prioritize a working MVP over advanced features.
