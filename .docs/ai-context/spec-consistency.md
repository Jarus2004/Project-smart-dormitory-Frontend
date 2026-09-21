# Frontend-Backend Consistency Spec

**Version:** 1.0.0 | **Updated:** 2026-07-02

## 1. Consistency Rules

- UI labels, statuses, and routes should reflect backend terminology.
- If the backend changes model names, the frontend should be updated in the same change.
- Do not add frontend-only concepts that conflict with backend domain language.

## 2. State Alignment

- Billing states should match backend bill status values.
- Maintenance states should match backend ticket statuses.
- Visitor statuses should match backend visitor workflow statuses.

## 3. Error Handling

Frontend should show user-friendly errors that correspond to backend errors and HTTP status meanings.
