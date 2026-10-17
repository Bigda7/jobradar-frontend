# CI dependency and history security gates

October 13, 2026: locally implemented and verified, not published or deployed.

Approved overrides pin brace-expansion5.0.12 and source-map-js1.2.2. Only these two
package-lock entries change; all other entries and declared runtime dependencies
remain unchanged. The reviewed lock installs successfully using npm ci without edits.

Node22.23.3 is pinned through .node-version and actions/setup-node. It satisfies the
existing engines range; no major Node/React/Vite or project version change.
Local verification used the official portable Windows Node22.23.3/npm10.9.9, not
system Node24.15.0. Archive SHA256 matched the official HTTPS SHASUMS list:
2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71.
No PGP-signature verification is claimed; system Node was not replaced.

CI now requires production audit(--omit=dev) and complete development audit
(--include=dev) before tests/builds. Both use --audit-level=high: High/Critical block,
lower severities remain visible. Checkout fetch-depth0 supplies full branch/tag
history; the existing pinned Gitleaks image explicitly scans all refs and merge
parent diffs using --log-opts="--all --full-history -m",100% redaction and exit-code1.
Six Vitest cases protect these settings and the approved package/runtime pins.

Local checks:88 tests, ESLint, TypeScript/production build, both npm audits and diff
checks passed; zero vulnerabilities. Non-shallow fresh-fetched history:81 reachable
commits/50 branch,remote,tag refs; Gitleaks processed79 nonempty patch commits, zero
leaks. Existing scanner image labelv8.30.0 reports executablev8.30.1, digest unchanged.

Positive gate fixtures: an explicitly HEAD-only Git scan passed(exit0); full-ref
scan found a synthetic token on a separate branch(exit1), value redacted. An independent
lock-only fixture containing old vulnerable dev versions passed production audit(exit0)
and failed full dev audit(exit1,two High packages). Vulnerable fixture code was not
installed. The generated fixture directory remains in ignored work/ because command
execution policy rejected its validated recursive cleanup; no alternative deletion
method was attempted. Portable Node is also retained in ignored work/.

No GitHub workflow execution, push, publication, deployment or production changes.
Windows checks do not replace later exact-commit Linux CI. Layout/API/matching/source/
notification behavior unchanged. Docker Desktop was started and left running; existing
resources preserved. No automatic monitoring was created.
