# Frontend Skill Notes

This file contains only frontend-specific conventions that are not already
covered by `AGENTS.md`. The repository uses React, Vite, and TypeScript.

## Frontend Conventions

- Keep feature code under `src/modules/<feature>/`.
- Keep shared UI in `src/components/`, API access in `src/services/`, reusable
  logic in `src/hooks/`, and shared types in `src/types/`.
- Keep components focused on presentation and move reusable data logic into
  services or hooks.
- Use the existing Axios API layer and verify request and response shapes
  against the backend before adding a new endpoint or field.
- Use React hooks and TypeScript types; avoid `any` unless there is a clear
  boundary that cannot be typed safely.
- Prefer the existing CSS approach in the touched module. Do not introduce a
  styling framework or package for a single screen.

For project-wide rules, package commands, security, scope, and verification,
follow `AGENTS.md`.
