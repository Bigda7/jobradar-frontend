# Tracker responsive list and detail panel

Implementation verified on October 17, 2026. Frontend package version: 1.1.11.
Publication and production acceptance are tracked separately in the workspace handoff.

## Cause and changes

The list previously chose its desktop table using the viewport's `md` breakpoint.
Its 900px minimum width could exceed the space remaining after the 248px navigation
and 430px inline details panel. An inner horizontal scroller obscured the date columns
at the panel boundary and separated the sticky header from the vertical list scroller.

The table now uses its own named inline-size container. Below 900px of actual list
space, compact cards keep the vacancy and activity dates available. At 900px and above,
a fixed-layout table reserves widths for the platform, status and date columns; the
title receives the remaining space. The inner horizontal scroll container is removed.
The list reserves a stable vertical scrollbar gutter and an 8px content gap.

Tracker details become inline at `100rem` (1600 CSS pixels with the default browser
font), leaving room for the table beside the navigation. Below that breakpoint they
remain a modal drawer with a backdrop, focus containment and scroll locking. The
accessibility hook accepts a matching media query; other drawers retain their existing
1279px default. Breakpoint units match Tailwind's built-in responsive variants so the
inline 430px panel width takes precedence over the smaller-screen 480px maximum.

Selection highlighting, status controls, notes persistence and browser-local storage
are unchanged. Very long compact-card titles can wrap without widening the page.
Long table titles still truncate intentionally; opening details reveals the full title.

## Verification

- Nine new SSR regressions cover container-based layout, dates, modal semantics across
  tracker breakpoints, and the unchanged default query for other drawers.
- Full frontend checks: 148 Vitest tests, ESLint and the TypeScript/Vite production build.
- Actual local browser checks used the real tracker page with 40 synthetic records and
  an in-memory storage replacement, never the user's tracker data or production API.
- Nine viewport sizes from 390 to 1920 CSS pixels, including both sides of 1599/1600,
  showed no horizontal page/list/panel overflow. Visible table date columns stayed
  inside the list boundary. Browser zoom was accounted for using measured CSS widths.
- Both themes, a 180-character unbroken title, modal-to-inline resizing, forward/backward
  Tab containment, focus restoration on normal dismissal, and nested-menu Escape
  ownership passed. The first Escape closes the menu, the next closes the drawer.
- The temporary test page and bootstrap were removed, the local server was stopped,
  and the browser viewport override was reset. Screenshot evidence remains ignored
  under `.deploy/tracker-layout-fixed-dark.png`.

No dependencies, API contracts, tracker schema, real notes, production settings,
notifications, publication or deployment changed. Native mobile devices and additional
browser engines were not exercised; these checks used the available Chromium browser.
