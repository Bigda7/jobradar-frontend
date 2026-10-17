# Command palette focus styling

Verified locally on October 16, 2026. Not published or deployed.

The unlayered shared `:focus-visible` rule overrode Tailwind's layered
`outline-none` utility. The full-height command input consequently drew a clipped
rectangular outline inside the rounded dialog header.

The command input now has a scoped outline override. Its search row provides a
subtle fill and inset bottom indicator through `:focus-within`, using existing
theme tokens and a 160 ms transition. Shared focus indicators elsewhere remain
unchanged, and the existing reduced-motion override still applies.

Verification:

- 98 Vitest tests across 22 files, including two CSS/component regression guards.
- ESLint, TypeScript and the production Vite build on existing Node 22.23.3.
- Browser checks in light/dark themes, desktop and 390 px mobile layouts.
- Ctrl+/ opening, active input without its old outline, arrow selection, Escape
  closing and mobile close control; no horizontal overflow.
- The remote API search flow was not exercised with a two-character query; search
  logic, handlers, API contracts and dependencies were not changed.

The separate tracker status-menu Escape/drawer propagation issue is not included.
