# Tracker current-record indication

The tracker page passes the currently open record ID to the desktop/mobile table and
pipeline columns. Rows and cards use a theme-aware background and a three-pixel inset
accent marker. The detail-opening button exposes `aria-current` for the current record;
selection is not persisted in browser storage. Closing or removing the current record
clears its indication. Hidden or filtered records do not select a different visible row.

The existing theme tokens, focus indicators, reduced-motion CSS, status controls and
drag handles are preserved. Drag previews do not announce themselves as the current
record. Selected cards must not also receive `shadow-sm`, which overrides the inset
marker in generated CSS. Eight SSR regressions cover the selection markup and wiring.

October16 local browser checks covered both themes, desktop and 390px mobile layouts,
mouse and Enter selection, switching rows, switching to Pipeline, normal Escape/close,
and opening a different row's status menu without changing selection. No production
tracker data was used; synthetic records were stored on an isolated localhost origin.

An existing separate issue remains: Escape inside a status dropdown also closes the
details drawer. The shared drawer keyboard listener predates this visual change and
was not modified. A follow-up should make Escape dismiss only the uppermost popup and
verify tracker, job and match drawers together.
