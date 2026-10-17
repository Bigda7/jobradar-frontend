# Explore score range

Implemented locally on October 16, 2026. Not published or deployed.

The match score selector now includes `Explore 35–54`. It requests both score bounds
from the backend, so the total and pagination cover the selected range rather than
filtering an arbitrary already-loaded page. It is separate from main recommendations
at 55+ and does not alter Telegram settings or delivery behavior.

The URL and match links retain `max_score`. Query cache keys include it, and placeholder
data is reused only when both bounds agree. Returning to an ordinary score preset
clears the upper bound; selecting an incompatible main tier also restores a compatible
range and resets pagination. Source/sort changes preserve the selected range.

An explanatory notice tells users that these records have gaps or uncertainty and
that the concerns should be read. Explore is not synonymous with suitability. Mobile
range/sort controls occupy separate full-width rows so labels are not clipped.

101 frontend tests, lint, TypeScript and production build passed on existing
Node 22.23.3. Browser verification used an in-memory synthetic backend: default main
selection, Explore query, reload, opening concerns, keyboard selection, switching
back to ordinary tiers, both themes and 390px mobile without horizontal overflow.
No tracker changes, external collection or real notification delivery were involved.

Requires the matching backend's new optional `max_score` parameter. Deploy the backend
and finish v16 evaluation before publishing this UI; an older backend ignores the
upper bound. No response-schema change or dependency update is required.
