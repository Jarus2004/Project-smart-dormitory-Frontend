# Frontend Engineering Spec

**Version:** 1.0.0 | **Updated:** 2026-07-02

## 1. Component Rules

- Use functional components and React hooks.
- Keep components focused on presentation.
- Move data fetching and transforms into hooks or services.

## 2. UX Rules

- Show loading, empty, and error states clearly.
- Keep forms validated and user-friendly.
- Keep interactions simple for MVP delivery.

## 3. API Integration Rules

- Use a shared API layer under src/services.
- Centralize auth handling in the service layer or interceptors.
- Avoid hardcoded backend URLs.
