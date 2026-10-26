# Evaluation

Automated tests exercise actual local UI/API and pure pipeline behavior. Browser scenarios are tested against a running local app; no external emails/applications are sent.

Unit suite: follow-up intent preservation; remote/contract/full-time hard filters; geography and freshness; duplicate origin retention; fictional provenance; profile consent; HTTPS link screening; full demo orchestration; zero live results when sources are unavailable; malformed/timeout provider responses; snippet non-opportunities; safe planner fallback; whole-word AI matching.

Browser suite: editable starter does not search automatically; three demo cards; save survives reload and chat reopening; Library stage/event and notes; draft-only safety; optional resume TXT extraction and confirmation/deletion; input/origin rejection; invalid PDF; mobile navigation and no horizontal overflow.

Manual checks: production build; Remotive live retrieval; desktop/mobile visual inspection. PDF and DOCX extraction paths use actual parsers; scanned PDF OCR is unsupported. A further document-fixture smoke test is included in the recorded implementation status when executed.

Not measured: labeled Precision@3, broad Chinese-source recall, reply/won conversion, multi-user isolation, provider billing/cost accuracy. This suite is not evidence of production search quality. Live data changes; exact result counts and titles are not hardcoded as tests.

Final validation: 22 unit tests and 4 browser tests passed. Actual PDF and DOCX extraction/deletion passed. Lint, typecheck and the production build passed.

Shanghai FDE repair: 40 offline unit tests passed. All five browser workflows passed with the opt-in live provider regression enabled, including exactly three original-linked Shanghai FDE recruitment cards and published contact email extraction. That live test was repeated after correcting expanded-English versus Chinese-FDE matching explanations.


2026-10-26 source recovery: 79 unit tests passed; targeted ESLint, typecheck and production build passed. Added tests cover observed V2 schema recovery after V4 code 301, no retries for permission failures, retention of successful partial results, and failure propagation when both routes fail. Live application search confirmed Xiaohongshu V2 success with two candidates. BOSS browser verification encountered a security verification page; integration is not claimed. Production /api/app-version confirmed build-b7a6668a.

Source selection repair: 81 unit tests, targeted lint and production build passed. Live application verification returned three cards including a Xiaohongshu Korean-Chinese Physical AI forum interpreting request with its original note URL. Source diversity is applied only after eligibility filtering; exact-role candidates remain ahead of adjacent roles. Existing conversation results remain historical snapshots; subsequent searches use the new selection.

Calendar: production build and targeted lint passed. Real browser verification passed event creation, persistence after reload, completion, deletion and 390px mobile overflow checks. Desktop and mobile screenshots inspected/captured. Xiaohongshu Next action now explicitly instructs manual login before opening and messaging on the original note.

History-based home: 85 unit tests, targeted lint and production build passed. Four new tests verify latest-task relevance, dismissed/expired/demo exclusion, empty-history fallback and prompt deduplication without raw personal chat text. Production API and browser verified three historical translation opportunities including Xiaohongshu, personalized prompts, accurate history labels and mobile overflow.

Explicit pay repair: 97 unit tests, targeted lint and production build passed. Chinese hourly/daily source rates and translated CNY rates are extracted without guessing unspecified periods. Historical reads now recover missing compensation from explicit title/evidence/summary. Production discovery API verified CNY 65–70/hour in both the card compensation and practical-details field.

Railway preparation: 102 unit tests, targeted ESLint and Next.js production build passed. A fresh isolated SQLite database was created and migrated by the actual startup script. HTTP smoke verified health 200, anonymous private API 401, authenticated API 200 and foreign-origin 403. Restart reapplied no migrations and preserved a synthetic profile. Docker image execution and Railway-hosted availability remain unverified until a Railway service is connected.

Vercel preparation: 107 unit tests and targeted ESLint passed. PostgreSQL client generation, initial migration SQL generation and a local Next.js production build with the PostgreSQL client passed. The standard .next Windows smoke build hit the existing local EPERM cache issue, so the successful PostgreSQL build used the isolated build directory. Hosted PostgreSQL connectivity, cloud migrations and Vercel runtime are not yet verified. Deployment requires the target team grant and database provisioning.
