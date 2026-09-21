# Backend Contract Alignment Spec

**Version:** 1.0.0 | **Updated:** 2026-07-02

## 1. Backend Contract Priority

Frontend must follow the backend implementation that actually exists in the backend repository.

## 2. API Expectations

- Use the backend route names and payload structure that already exist.
- Match response shape from the backend standard response wrapper.
- Do not invent new endpoint paths or fields without confirmation.

## 3. Auth Rules

- Protected routes must use JWT-based authentication.
- Handle 401 and 403 responses consistently.

## 4. Billing / Maintenance / Visitor

- UI flows should reflect backend statuses and transitions.
- Keep the frontend state consistent with backend enums and statuses.
