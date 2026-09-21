# Anti-Bloat & Complexity Guardrails

**Version:** 1.0.0 | **Updated:** 2026-07-02

## 1. Core Principle

Keep the frontend lean. Prefer the smallest implementation that delivers the current feature cleanly.

## 2. Rules

- Do not create new components, hooks, services, or files unless they are clearly needed.
- Prefer editing existing modules before introducing new abstractions.
- Avoid adding packages if the current setup already supports the task.
- Avoid large-scale refactors unless the current task requires them.
- Keep the implementation aligned with the MVP scope.

## 3. Avoid These Patterns

- Splitting a simple screen into many tiny files without clear benefit.
- Creating a custom hook for logic that is only used once.
- Overengineering UI state before the product flow is stable.
- Adding speculative features that are not part of the current request.

## 4. Before Adding Complexity

Ask:

1. Does this reduce maintenance complexity?
2. Is this required for the current feature?
3. Can the same outcome be achieved with existing code?
4. Will this make the codebase harder for the team to understand?
