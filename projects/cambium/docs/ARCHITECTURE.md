# Architecture

## Runtime and data flow

Next.js App Router + TypeScript + React; Tailwind's CSS pipeline and a custom olive/off-white theme. No remote fonts or runtime asset CDNs. Prisma + local SQLite provides durable state.

Composer → POST /api/chat → immediate User Message → intent planner → parallel configured adapters → normalize → deduplicate → hard constraints → rank/diversify → at most three cards → persist search run and assistant structured blocks → NDJSON event.

Conversation context stores intent independently of prose. Location-only follow-ups keep existing role, remote and contract constraints. Without DeepSeek, extraction uses documented heuristics for common English/Chinese examples; arbitrary language, negation, salary, visa, time-zone and subtle preferences are not fully interpreted. Profile skills influence ranking only after explicit confirmation/consent. Location and preference text are stored for review; chat constraints currently drive filtering.

## Persistence

Conversation, Message, SearchRun, Opportunity, LibraryItem, ActionEvent, Profile, Resume, OutreachDraft. Opportunity payloads and search diagnostics use JSON. Origin URLs stay within payloads. Library uniqueness makes repeated saves idempotent. Chat messages survive reload and can be reopened from the rail. Raw binary résumés are discarded after parsing; extracted text remains until deletion. Source cache retains normalized Remotive descriptions for six hours before refresh. No automatic résumé expiry is implemented.

## Providers and budgets

Adapters expose id, capabilities, isConfigured(), search(intent). Remotive: one full feed fetch per six hours, deduplicated in-flight inside a process. Tavily: one basic request, max 10 hits per search. DeepSeek: max one intent-planning call, max 500 output tokens. Upstreams have 12–15 second timeouts. Local mutations limited to 40/minute per process. Metrics record candidates, rejected count, deduplication count and latency; exact billed cost and granular rejection reasons are future work. No retry loop or distributed circuit breaker. Single-process local cache is intentional.

External content is untrusted and rendered as text. No provider HTML is injected. API keys never leave server code. Fetch destinations are fixed official provider origins. Arbitrary user URLs are never fetched. HTTPS source links are screened; no SSRF-capable URL-fetch route exists. Upload type, header signature and 5 MB size are checked; encrypted/scanned/invalid documents fail gracefully. Rich-document parsers are for trusted local use; hostile multi-tenant uploads need isolated parsing and stronger archive expansion limits.

## Local-only security

Loopback listener, request hostname restriction, Origin/Sec-Fetch-Site checks, input validation, safe public diagnostics. A fixed single local profile exists by design. This is not production authentication or tenancy. Provider keys must be server environment variables. Delete personal data removes profile, extracted résumés and draft rows; prior chat fit explanations may still mention facts already used in a conversation. Delete those conversations separately when needed.

## PostgreSQL / deployment path

The brief preferred PostgreSQL. For this zero-setup local delivery, SQLite was chosen intentionally. PostgreSQL is not required or tested. A hosted evolution must first add authenticated sessions, per-user ownership and organization isolation, CSRF/session defenses and isolated document parsing. Then change the Prisma provider to postgresql, regenerate SQL migrations from this logical schema for PostgreSQL, add user keys/constraints, migrate existing data and test against that service. Existing SQLite migrations cannot be applied to PostgreSQL.

Deferred: enterprise B2B product, automatic applications/sends, inferred-demand classification, semantic embeddings, detailed skill/experience/eligibility extraction, OAuth source accounts, continuous health monitoring, broader geographic/salary constraints, evaluation against a large labeled corpus.
