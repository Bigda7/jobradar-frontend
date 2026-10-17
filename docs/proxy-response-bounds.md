# Bounded upstream API responses

The local October 17 security package fixes audit S07 in the server-side proxy.
The existing maximum remains 10,000,000 bytes and the deadline remains 10 seconds.
The browser does not receive the upstream bearer token.

Before reading a body, the proxy checks the declared length and JSON content type.
It then reads chunks and counts actual bytes returned by fetch, including decoded
bytes for compressed responses. Missing, inaccurate, negative or invalid length
headers do not bypass the body limit. Exactly the limit is accepted; the first
chunk that would exceed it causes a 502 and upstream cancellation without copying
that chunk into the result buffer or consuming the rest of the body.

A capped growing buffer avoids keeping an unbounded list of tiny chunk objects.
An upstream chunk and fetch transport buffers already exist before inspection;
this is not a promise that total process memory is capped at exactly 10 MB. The
accumulated response data is bounded, and normal small responses do not allocate
a full-size buffer in advance. Concurrent requests still need service-level
resource controls, outside this package.

The deadline covers connection/headers and body consumption. A client abort is
combined with the deadline and a local cancellation controller. The body reader
is cancelled on abort and released in finally; errors/early returns also abort
upstream and cancel unused bodies. Cancellation rejection or a stalled cancellation
callback must not replace the primary result or extend its wait indefinitely.

Successful JSON and JSON error statuses remain intact, as do no-store/nosniff,
query forwarding, the GET-only boundary and redirect refusal. Valid JSON-typed
204/205/304 responses are returned without forbidden response bodies. This also
avoids their prior Response-constructor error. Non-JSON failures retain their
existing safe error policy. Connection failures return 502; deadline expiry
returns 504. Client cancellation returns the existing generic upstream error shape,
not a new public API status/contract.

Tests include bounded synthetic streams (tail read counts, cancellation, byte
boundaries, empty chunks, multibyte JSON, aborts and safe error text), plus real
ephemeral loopback HTTP servers for gzip expansion, early connection closure on a
chunked response, and deadlines before headers/during a stalled body. Servers use
synthetic data and are closed after each test. No external service is contacted.

These are local Node 22.23.3 results, not tests of deployed Vercel behavior, a
production load test or a guarantee about every platform adapter's disconnect
signals. No deployment settings, dependencies or lockfiles were changed. See the
shared workspace `API_PROXY_SECURITY_PACKAGE_2026-10-17.md` for final counts and
remaining work.
