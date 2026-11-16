# Security

## Open by design

Every Signal belongs to whoever deployed it, and there's no sign-in: anyone with the link can read
the feed, change Setup and chat with Ask Signal, on the deployer's Vercel account. Setup and the
README say so. What's guarded is cost, and the platform keeps a Signal private when its owner wants:

- **An AI Gateway budget** caps the project's AI spend; Setup shows the credits left and the command.
- **Ask Signal** stops each conversation at $0.50 (`agent/agent.ts`), and starts at most 30 a day
  (`agent/channels/eve.ts`, counted atomically in `chat_days`).
- **Interest changes**, which rescore recent stories, are limited as below.
- **Vercel Authentication** or Password Protection can put the whole deployment behind a login.

## Rescore admission and spending bounds

- Trimmed, validated profiles with sorted/deduplicated topics are compared atomically
  in PostgreSQL. Unchanged saves preserve scores and send no queue message. Changed
  profiles are admitted at most once every 15 minutes across web instances; earlier
  changes are rejected without changing the stored profile or scores.
- Queue messages are only wake-up hints, not authority to spend. The worker atomically
  claims the current database profile version at most once, with a durable 15-minute
  cooldown shared by daemon instances. Duplicates, old messages, and preview hints
  cannot rescore an already-claimed production profile. Periodic scans also check
  pending versions, recovering missed sends or changes deferred by the worker quota.
- Each admitted rescore considers only the 100 newest articles from the last three
  days. Local relevance filtering happens before paid calls. A process-wide semaphore
  allows at most four simultaneous AI calls across scans and rescores. Each call has
  a 30-second timeout, a 1,536-token output limit, and no SDK retries.
- Claims are persisted **before** paid work. A failed/interrupted rescore can leave
  partial results; replay does not retry that version and incur additional charges.
  A later admitted profile change can request another bounded batch. Older articles
  outside the batch remain unscored after a profile change. This is a deliberate
  cost-safety trade-off, not an exactly-once completion guarantee.

The API remains private behind its service binding. Queue sends use the shared
partition read by the daemon; merge this fix instead of the queue-only fix in #2.
Scheduled news ingestion is independent of profile changes and is not counted as
part of the rescore quota.

## Untrusted article destinations

Article reads accept only HTTP(S) URLs without credentials. Every hop is resolved
and all returned addresses must be public unicast; private, loopback, link-local,
reserved, mapped, and IPv6 translation/tunneling destinations are rejected. The
HTTP connection is made to a validated numeric IP, not to the hostname, so a
second DNS answer cannot redirect the connection into the daemon's private network.
The original Host header and HTTPS SNI/certificate name are preserved, with normal
certificate verification enabled. Environment proxies, shared connections, and
cookie forwarding are disabled for these reads. Redirects are handled explicitly,
validated again, and limited to ten hops.

A rejected or failed read returns no extracted text or metadata to the scan, so it
cannot become an article excerpt. The original source-feed summary remains the
fallback. This change does not audit or remove text already in the database; any
suspected historical exposure requires a separate data review. Platform-level
egress filtering remains useful defense in depth; this patch enforces the article
reader's destination restrictions in code and does not change infrastructure.

Run the focused, offline regression with the scorer's dependencies installed:

```sh
python scorer/check_article_fetch.py
```

It exercises the real HTTP transport against fake TCP peers, including DNS
rebinding, redirects, TLS hostname/verification settings, and public extraction.
