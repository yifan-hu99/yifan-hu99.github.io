# Implementation status · 2026-10-24

Delivered a working local Cambium Opportunity Agent, based on both supplied rebuild kits with the later Cambium branding requirements applied. The original emblem is preserved unchanged. The second referenced brand-board image was absent from the archives.

## Implemented

- Next.js + TypeScript + React + Tailwind/CSS, Prisma, migration and local SQLite.
- Conversation-first responsive interface, editable prompt suggestions, structured streamed phases, at most three cards inside chat, restored conversations.
- Real Remotive adapter; fixed official public API, cached six hours; source attribution and original links.
- Optional Tavily search and DeepSeek structured intent planning, server-only secrets, explicit unconfigured/disabled states.
- Intent continuation, normalization/deduplication with origin retention, hard filters for common location/remote/engagement exclusions and 60-day freshness, local scoring and organization diversity.
- Durable saved items, status/notes, activity timestamps, rejected-item suppression.
- PDF/DOCX/TXT extraction and preview; manually editable facts and consent; local reranking; delete extracted text and profile.
- PDF parsing uses an isolated worker with a 15-second timeout and 192 MB old-generation heap limit. DOCX/TXT remain local parsers.
- Persistent editable outreach templates; copy is separate from user-confirmed sending elsewhere. No automatic sending or applying.
- Input validation, origin checks, loopback binding, local rate limiting, safe errors and external-text rendering.
- README, API/architecture/provider/evaluation docs, unit and browser tests, fictional document fixtures.

## Validation

- npm run lint: passed.
- npm run typecheck: passed.
- npm test: 52 pipeline, WeChat adapter and opportunity brief tests passed.
- npm run build: production build passed with Webpack. A build wrapper uses a fresh output directory and preserves the last successful build pointer to avoid Windows sandbox/cache permission collisions. Previous generated builds remain on disk until manually removed.
- Playwright: 6 of 6 production tests passed against a clean disposable database, covering chat, persistence, Library, profile confirmation/deletion, source/input safety, mobile navigation and actual PDF/DOCX parsing.
- Real Remotive app search completed successfully in this session; results were from the API, not fixtures. Current availability is not independently guaranteed.

## Ready for credentials; not live-tested

- Tavily: WEB_SEARCH_PROVIDER=tavily and WEB_SEARCH_API_KEY.
- DeepSeek: user-supplied backend credential is configured and real intent-planning calls passed.
- Just One API WeChat Article Search V2 and Article Details V4 are now connected and account-tested. BOSS and LinkedIn remain disabled. Xiaohongshu note search V4 and details V1 are connected and account-tested.

## Important departures and remaining work

This is a local single-user MVP, not completion of every production requirement in the historical specification.

SQLite replaces the proposed PostgreSQL dependency for a runnable zero-service setup. There is no authenticated multi-user tenancy, and the app must stay on loopback. Source snippets are labeled; inferred-demand leads, broad Chinese-platform coverage is incomplete; WeChat recruitment article retrieval is now implemented. Common English/Chinese intent rules are bounded; arbitrary geography, salary/visa/availability/language eligibility and nuanced negations need richer handling and evaluation. Profile location/preferences are stored but only confirmed skills currently affect ranking. Resume extraction suggests skills; it does not automatically infer complete work history/achievements or OCR scans. Outreach uses an editable template, not an LLM.

Ranking is a relative heuristic, not a success probability. Cost telemetry, distributed quotas/circuit breakers, detailed rejection reasons, expiry jobs, retention policies, large-corpus Precision@3 and production deployment remain open. API coverage reflects docs/API.md rather than every historical endpoint.

Clearing personal data deletes profile/resume/draft rows. Existing conversations may retain fit explanations containing facts used earlier; delete relevant conversations separately. No private résumé text is sent to search sources or DeepSeek. Conversation intent is sent to configured planning/search providers.

B2B hiring intelligence and the former Work OS roadmap remain deferred.

## Homepage refinement
Real Remotive listings appear below the main headline. Three compact, specific editable search prompts sit immediately above the composer, including Shanghai AI FDE roles. The default search mode is now live. The production build, typecheck and four browser workflows passed after this update.

## Shanghai FDE search repair
The former zero-result response was caused by searching Remotive alone, not by absence of Shanghai FDE roles. WeChat now participates in the actual orchestrator. Chinese recruitment queries, explicit opportunity detection, article checks, email extraction, geographic aliases, bounded follow-up retrieval and honest coverage explanations are implemented. Unit fixtures are isolated from live provider caches. The exact Shanghai FDE prompt returned three real WeChat recruitment cards in the production browser; all five browser workflows passed. The exact-role explanation was regression-tested again after bilingual alias handling was corrected. Evidence is in docs/SHANGHAI_FDE_VERIFICATION.json.

## Six-part cards and conversation onboarding
All recommendation cards and Library details show the six requested sections with source evidence, explicit unknowns, consent-aware personal fit and actual Library follow-up status. Public emails retain evidence URLs; websites, contacts, qualifications and urgency are never invented. Homepage previews open full detail dialogs.

The three primary navigation tabs now sit horizontally in the top header. One round is an entire persisted conversation. Follow-ups remain available; only new conversations require confirmed skills, matching consent and a résumé or portfolio after the first conversation. Both UI and API enforce this rule. The selected conversation restores after refresh. The profile onboarding migration has been applied.

Final validation: 52 unit tests, 6 browser tests (including real Shanghai FDE retrieval), lint, typecheck and production build passed. Mobile preview had no horizontal overflow or browser errors.

## English-only presentation
All fixed interface copy, profile dialogs, card labels, generated matching explanations and outreach suggestions are English. Chinese recruitment source text is translated and cached server-side; identifiers, original links and published emails are preserved. Public source records remain stored in their original form. No profile or resume content is sent for translation. Validation: 55 unit tests and all six browser workflows passed, including three real Shanghai FDE cards with no Chinese characters in displayed card text.

## Concise interface
Removed decorative slogans, repeated descriptions and composer microcopy. Kept all six opportunity sections, pay emphasis, contact links and actions. Source excerpts and suggested outreach text are expandable.

## Resume prompt timing
No profile modal opens automatically on page load or refresh. An incomplete profile is prompted one second after the first completed search results render. Existing chats restore and remain available; new chats retain the profile confirmation gate.

## Relevance, compact cards and demand sources
Latest explicit tasks replace stale FDE context. Translation/localization work is checked before ranking; company names alone are insufficient task evidence. AI evidence is the largest ranking contribution (60), above finance (35) and freelance (20) preferences. Cards show Work, Fit and Next; the six-part brief is expandable. Invalid earlier results are hidden on conversation reads with an explicit explanation.

Xiaohongshu Search V4 and Details V1 were account-tested successfully. Buyer requests are normalized with public original-note links, and free trials, tutorials and supplier advertisements are excluded. No worksite is inferred from an author IP. BOSS and LinkedIn remain disabled and were not searched.

Validation: 70 unit tests, lint, typecheck, production build and six browser workflows passed. The exact Chinese translation brief returned translation/interpreting opportunities during live verification, with finance and location gaps disclosed. Latest browser preview had no Chinese card text, overflow or browser errors.

## Specific source titles after translation failures
Translation validation now keeps successful fields when another field fails, retries a missing title independently, and derives an emergency role label only from literal source-title facts. Generic Recruitment opportunity titles are no longer used. Explicit hourly pay in source titles is retained in the salary field. The current third card was verified in the production browser as Invisible Chinese AI Translation Evaluator, from CNY 40/hour, with finance relevance unconfirmed and its original WeChat URL preserved. Validation: 73 unit tests, lint, typecheck, production build and targeted browser verification passed.

## Compact detail accordions
Replaced the large six-section grid with six collapsed summary rows. One row can open at a time. Repeated translation placeholders and unknown fields are omitted or grouped once. Work and fit summaries are capped in length. The screenshot translation-model development engineer is rejected for translator searches. Validation: 74 unit tests, five browser workflows (live-provider regression intentionally skipped), lint, typecheck and production build passed. Actual production detail panel measured 289 pixels high with all six rows collapsed; mobile had no horizontal overflow.
