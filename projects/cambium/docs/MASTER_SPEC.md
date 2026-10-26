# Opportunity Agent — Master Rebuild Specification

**Version:** 1.0 | **Date:** 2026-10-24 | **Status:** Codex implementation brief | **Language:** Chinese product detail, English identifiers

> **Instruction to Codex:** Rebuild this product from an empty repository. Do not assume the old computer, its repository, database or API keys are accessible. The deliverable is a working local MVP with genuine search capabilities wherever credentials and authorized endpoints are available, graceful fallback and demo fixtures when unavailable. Never pretend fixtures are live jobs.

## 0. Product thesis and decisions

Opportunity Agent is an AI-native opportunity discovery and action application, not a conventional job board, not an endless recommendations feed, and not a generic chatbot. The core innovation is **low-cost discovery of credible, otherwise overlooked opportunities from fragmented sources**, followed by **personalized contextual matching** and **a real route to contact**.

**Primary loop:** User message → Intent / profile extraction → Search plan → Multi-source adapters → Normalize + Evidence → Detect actual opportunities → Deduplicate → Hard constraints → Personal-fit ranking → Top 3 cards in the same conversation → Save / CV upload / next action / application tracking.

**User-facing invariant:** ONE ChatGPT-like thread/input surface. Cards are message content, not a separate results dashboard. Initial output has three credible opportunities *at most* (never pad with invented entries). Persisted Library and Profile may be accessible from left navigation, but don't introduce extensive dashboards.

**Scope decision, October 2026:** Build the original individual-facing Opportunity Agent first. The newly selected business strategy is B2B AI hiring intelligence for owner-led traditional companies, initially applied-AI/FDE implementation talent. Preserve the individual agent as talent-side acquisition/discovery; enterprise SaaS is future scope, not a prerequisite for this rebuild.

**Prior design history:** Early Work OS explored Calendar, Money, Projects, People and a business canvas. Those are postponed. No scheduling, accounting, general CRM, marketplace, or auto-bulk-apply in this MVP. The system's durable state is in a DB, not in ephemeral assistant text.

## 1. Audience and examples

Initial audience: skilled independent workers, AI practitioners, portfolio builders and professionals seeking flexible jobs, contracts, projects or customer leads. Support job, project, customer and partnership opportunities without equating every vague demand signal to an actual vacancy. First niche: AI roles, especially FDE / applied AI implementation, AI product, AI education, creative × AI, and enterprise AI transformation.

**Example intent 1:** “I want to work as an AI FDE, preferably Shanghai, early-stage companies, open to project-based work.”

**Example intent 2:** “Find two AI evaluation/training contracts and one founder-adjacent AI collaboration opportunity this week; remote international is fine, not 996.”

**Example intent 3:** “I build AI content agents for small Shanghai brands. Find businesses showing credible signs of needing outside AI implementation.”

Profile should support location, time zone, languages, skills, past projects, preferred sectors, work modality, hourly compensation expectations, refusal constraints, travel constraints, portfolio URLs, availability, source preferences. Onboarding must be progressive (from chat + uploaded résumé), not a giant form. Example individual preferences are illustrative only, never universal defaults.

## 2. Full user journeys

### 2.1 First visit / first message
1. Show minimal homepage with centered brand name, invitation to describe goal, one large unified composer, and 3–4 **clickable prompt suggestion chips** above it: “Find AI FDE opportunities”, “Find freelance AI projects”, “Find AI × creative roles”, “Find businesses that need my skills”. Clicking a chip **populates composer with editable text**, never silently runs a search.
2. User sends natural-language request. Save UserMessage immediately. Begin AssistantMessage and stream phases/progress: understand → searching sources → verification → ranking, with clear explanations and honest status.
3. Extract provisional intent & constraints. Only ask clarifying question if essential to prevent nonsense (e.g., no target at all); otherwise derive reasonable defaults and visibly state assumptions. Optional inline chips can refine location, full-time vs contract, compensation, etc. Do NOT force signup or résumé upload before first search.
4. Execute search, return up to 3 evidence-grounded cards in the same thread. Include a compact assistant explanation of search and source limitations.
5. After user sees relevant cards, offer optional contextual prompt: “Upload a résumé or portfolio to improve matching and draft tailored outreach.” Resume is **post-value** onboarding, not a pre-search gate.
6. User can click Save, Open original, Why it fits, Improve match, Prepare outreach, Not interested. These actions must persist and update the visible thread.

### 2.2 Return visits
Left sidebar: New Search; conversations; Library; Profile/Resume; Settings. Each chat restores messages, cards, search runs and their origin. Follow-up “make these more startup-focused” should use prior conversation/selected search and update filters rather than reset context.

### 2.3 Resume flow
Upload PDF/DOCX/TXT via composer attachment or card CTA. Show parsing / PII review/confirmation preview. Extract skills, experience, project accomplishments, languages and evidence. Allow user to edit inferred facts, delete source file, and choose whether to use resume for matching or drafts. Re-rank current 3 opportunities on user confirmation; generate fit gaps separately from genuine eligibility. Never send résumé to sources by default. Avoid suggesting unverified claims in CV or outreach.

### 2.4 Action / conversion flow
Save to Library → Draft a tailored short email or WhatsApp/WeChat message (when a real contact method exists) → User reviews/copies/sends manually → mark Contacted → Waiting → In Progress → Won or Closed. Record timestamp, source URL, contact, note, user-confirmed action and rejection/response reasons. Don't claim an application was sent merely because a draft was created. A direct external apply link counts as a contact route, but the UI must label it correctly.

### 2.5 No-results / degradation
If fewer than 3 strong results pass validation, show 1–2 or zero, **not fake extras**. Say which constraints/sources limited the result; offer “broaden geography”, “allow adjacent title”, “search deeper”. When adapter is unavailable or credential absent, list unavailable sources and operate on known working public sources. Mock fixtures are permitted only in clearly labeled DEMO mode. Don't silently replace real mode with demo.

## 3. UI/UX design system

- A calm, minimal, ChatGPT-like desktop layout, light theme by default, responsive mobile.
- Left rail about 240–280px on desktop; center chat max width ~820–920px; generous whitespace, restrained grays, one accent. No dense job boards, admin-looking tiles, or sprawling analytics.
- Empty state: logo/heading, 1–2 line value proposition, editable prompt suggestions and single composer pinned within the main view.
- Conversation: messages with streaming text and embedded 3-card result section (vertical cards preferred for detailed content, 3 compact side-by-side only when sufficient width). Cards must remain readable on mobile.
- **Card minimum fields:** title, organization/client if known, location/remote, opportunity category, engagement type, compensation (unknown if unavailable), source + posted/discovered timestamps where supported, concise verified description, reason it matches this specific profile, any mismatch caveat, evidence badge (Published opportunity vs Inferred demand signal), direct source link, contact/application route (or explicitly “not found”), Save, View original, “Prepare contact”.
- A score can appear as optional relative fit estimate, never as a deceptive statistical probability or source credibility guarantee.
- Library: list with simple status filter and detail drawer, not a separate CRM suite.
- Privacy: a clear separate Resume/Profile screen for viewing/editing/deleting extracted data.
- UI states: empty, typing, streaming, searching, partial-results, zero-results, source-error, résumé-processing, résumé-error, offline/test/demo. Accessible keyboard, proper loading states, clickable URLs, helpful mobile layout.

**Text wireframe:**
```text
┌──────────────┬─────────────────────────────────────────────────────────────────┐
│ + New Search │                  OPPORTUNITY AGENT                              │
│ Conversations│  Find opportunities you wouldn't have searched for.            │
│  - AI FDE    │                                                                 │
│  - Creator   │  [ Find AI FDE roles ] [ Freelance AI ] [ AI × Creative ]       │
│ Library      │                                                                 │
│ Profile      │   User: Find applied AI FDE opportunities in Shanghai.          │
│ Settings     │   Agent: I searched verified sources; here are the top matches. │
│              │    ┌── Opportunity A ────────────────────────────┐             │
│              │    │ Type | location | fit | evidence | why fit │             │
│              │    │ [Original] [Save] [Prepare contact]         │             │
│              │    └────────────────────────────────────────────┘             │
│              │    ┌── Opportunity B ... ┐                                    │
│              │    └─────────────────────┘                                    │
│              │    ┌── Opportunity C ... ┐                                    │
│              │    └─────────────────────┘                                    │
│              │ [ 📎 ] Ask for opportunities / refine results... [ Send ↗ ]    │
└──────────────┴─────────────────────────────────────────────────────────────────┘
```

## 4. Retrieval pipeline — genuine opportunity search is the product

### 4.1 Planner
LLM (initially DeepSeek) extracts a structured `SearchIntent`: desired roles / tasks; domain; projects; employment forms; geography; on-site/remote; salary floor; language; exclusion constraints; freshness horizon; number of results = 3; preferred sources; positive and negative skill affinity. Generate Chinese and English synonyms and source-specific query variants, e.g. FDE, Forward Deployed Engineer, applied AI engineer, solutions engineer, AI implementation, AI转型实施, AI落地顾问. Avoid keyword-only search.

### 4.2 Source adapters
Interface `SourceAdapter`: `{id, capabilities, isConfigured(), search(query, options), getDetails?(id), healthCheck?()}`. Adapters are isolated and individually feature-flagged. All source results carry timestamp and provenance, not just a title. Prefer sanctioned APIs and authorized third-party providers; **do not bypass logins, CAPTCHA, restrictions, or rate limits**.

| Priority | Adapter | Role | Implementation guidance |
|---|---|---|---|
| P0 | PublicWebSearchAdapter | broad discovery, startup sites, company pages, posting pages | use a configured and documented search API; fetch public pages only when allowed |
| P0 | JustOneApiWechatAdapter | WeChat public account and article discovery | verify exact supported endpoint and entitlement in up-to-date Just One API docs; obtain article content if permitted |
| P0 | JustOneApiBossAdapter | BOSS 直聘 targeted role search | endpoint must be verified, legal/authorized; if unsupported mark source unavailable, do not invent endpoint |
| P1 | JustOneApiXiaohongshuAdapter | social posts, informal calls for contributors | require extractable post text and stable original link; classify informal signal separately |
| P1 | LinkedInAdapter | international roles | use authorized API/provider or public indexed listings; no fake direct API support |
| P2 | Handshake / niche career sites / startup boards | optional coverage | add behind adapter contract and rate budget |

Previous discussions cited Just One API / JustOneAPI, an independent JustSERP reference, and other retrieval concepts. These names must **not** be treated as interchangeable providers. Verify current documentation, domain, endpoint, auth, costs and ToS for each. No hardcoded scraped URLs or undocumented APIs.

### 4.3 Evidence extraction
Normalized result object: original source; title; organization; description/body; source_url; canonical_url; external_id; published_at; fetched_at; source_type; original snippet/full text; contact methods; eligibility; location; pay; engagement form; confidence flags; evidence excerpt and location; raw payload reference. Store links/source evidence so a user can verify claims. Respect access limits: do not assert full content was read if only snippet was available.

### 4.4 Opportunity detection
Classify each candidate as:
- `PUBLISHED`: explicit open role, contractor/project call, paid collaboration, application form or named contact.
- `INFERRED_SIGNAL`: credible business demand but **not** an advertised job. Label “Potential lead — outreach required” and explain evidence.
- `NOT_OPPORTUNITY`: thought leadership, educational post, stale closed call, self-promo, vague AI news, spam, duplicated repost.

Require direct evidence for published claim; don't hallucinate hiring, compensation, deadline, sponsor, contact, openness or availability. For inferred cases, must explain the observable signal and why outreach is worthwhile.

### 4.5 Deduplication and qualification
Normalize URLs; dedupe same org + similar title + location + posting time, with fuzzy matching and stable canonical opportunity ID. Retain multiple source appearances under `OpportunitySource`, favor highest quality original. Hard filters for explicitly excluded full-time/onsite/geography/visa/salary conditions; unknown details remain unknown rather than rejected unless a hard eligibility requirement truly demands proof. Expire/archive stale opportunities, allow status `UNVERIFIED` and broken link detection.

### 4.6 Personalized ranking
Proposed initial scoring (tunable, not scientific):
`fit = 0.30 semantic_intent + 0.25 profile_skills + 0.15 engagement_and_location + 0.10 recency + 0.10 actionability + 0.10 novelty`.
Run hard constraints first. Show natural-language why it fits *and* uncertainties. Novelty penalizes repeats across search history. Diversity re-rank final set so cards aren't three near-duplicates. If evidence/quality poor, do a second search only within strict budget; never chase 3 by lowering credibility threshold arbitrarily. Embeddings/vector DB **optional**: start with keyword retrieval + LLM structured assessment; add embedding rerank if evaluation demonstrates improvement. JEV/Agentic Search/Agent-Reach and MCP are research options, not dependencies.

### 4.7 Search budgets and quality
Search budget: configurable max queries, max fetched details, max LLM calls, max token spend, timeouts, per-source quotas, concurrency cap, cache TTL, circuit breaker. Log query, adapter, source success/error, counts at each stage, latency, estimated cost, candidate rejection reasons. Implement evaluation fixtures for obscure AI roles, Chinese informal sources, fresh company calls, duplicates and negative examples. Core metrics: Precision@3, new unique actionable opportunities per session, valid contact-route rate, duplicate rate, false-positive inferred hiring rate, cost / 3 viable opportunities, saved / contacted / reply / won rates.

## 5. Assistant conversation rules

System prompt responsibilities:
1. Interpret the user goal from current turn, conversation history and opted-in Profile.
2. Search external sources when they are requested or needed; do not fabricate results, dates or links.
3. Keep distinct facts from source, inference and recommendation.
4. Respect explicit user constraints, especially contract-only, location, pay, travel and industry exclusions.
5. Reply with concise summary and up to 3 structured opportunity cards; every card must have a provenance link and action path or explicitly report its absence.
6. On follow-up, preserve unnamed constraints; change only the named dimension.
7. After first meaningful results, suggest résumé upload, never demand it.
8. Do not auto-apply, auto-email, auto-publish, or transmit private résumé externally without explicit user review and authorization.
9. If all relevant sources fail, say it, provide partial public verified results where possible; demo fixtures never masquerade as real results.

Use typed, structured tool actions (`search_opportunities`, `save_opportunity`, `get_profile`, `update_preferences`, `parse_resume`, `draft_outreach`, `update_pipeline_status`, `search_saved`) and only perform actions the user requests. Streaming chat text and card payload should be separate structured events; do not try to parse opportunity cards from prose.

## 6. Suggested implementation architecture

Stack: Next.js App Router + React + TypeScript (strict), Tailwind CSS, Zod, Prisma ORM, PostgreSQL, server-side DeepSeek client, file storage adapter (local dev / cloud later), robust search provider integration; optional pgvector later. Use Vitest or equivalent for unit/integration and Playwright for E2E. Single repository, no premature microservices. All API keys server-only, `.env.example` placeholders, no secrets in git.

```text
src/
  app/ (chat homepage, library, profile, settings)
  app/api/ (chat, search, profile, uploads, library, source-health)
  components/ (composer, conversation, cards, source badge, upload)
  lib/ai/ (intent, planner, chat, scoring, classifier, prompt)
  lib/search/ (adapter contract, orchestrator, normalize, dedupe, evaluator)
  lib/search/adapters/ (public-web, justone-wechat, boss, xiaohongshu, linkedin)
  lib/profile/ (resume parsing, preference merge)
  lib/storage/ (db, file storage)
  lib/security/ (validation, sanitization, rate limiting)
  tests/ (unit, integration, e2e, fixtures)
prisma/schema.prisma
scripts/seed-demo.ts
.env.example
README.md
IMPLEMENTATION_STATUS.md
```

### Data schema (logical, implement in Prisma)
- User: id, createdAt, preferences, consentVersions.
- Profile: userId, location, remotePreference, contractPreference, skills JSON, interests, languages, compensation preferences, availability, constraints JSON, inferredFactsProvenance.
- Resume: id, userId, filePath, filename, mimeType, parsedText, extractedFacts JSON, useForMatching, uploadedAt, deletedAt.
- Conversation: id, userId, title, createdAt, updatedAt.
- Message: id, conversationId, role, text, attachments JSON, structuredBlocks JSON, createdAt.
- SearchRun: id, conversationId, userId, intent JSON, sourceHealth JSON, metrics JSON, status, createdAt, completedAt.
- Opportunity: id, fingerprint, type PUBLISHED|INFERRED_SIGNAL, title, organization?, summary, location?, modality?, engagement?, compensationRaw?, sourceDate?, detectedAt, verifiedAt?, expiryAt?, evidenceLevel, contactStatus, parsedFields JSON.
- OpportunitySource: id, opportunityId, provider, externalId?, sourceUrl, canonicalUrl?, sourceSnippet?, sourceBody?, observedAt, publishedAt?, rawPayload JSON.
- SearchResult: id, searchRunId, opportunityId, rank, fitScore?, whyFit JSON, uncertainty JSON, constraintsPassed.
- LibraryItem: id, userId, opportunityId, status SAVED|CONTACTED|WAITING|IN_PROGRESS|WON|CLOSED, notes, savedAt, updatedAt.
- ActionEvent: id, userId, libraryItemId, type, metadata, createdAt.
- SourceQueryLog: id, searchRunId, source, query, counts, latencyMs, errorCode?, costEstimate?.
- OutreachDraft: id, userId, opportunityId, channel, body, status DRAFT|COPIED|USER_CONFIRMED_SENT, createdAt.

Use proper indexes, foreign keys, unique(userId, opportunityId) for Library, retention policy for raw scraped bodies and resume, ownership checks on every route.

### API contracts
- `POST /api/chat` `{conversationId?, message, attachments?}` → streamed phases, assistant text, `opportunities` structured event and conversation id.
- `POST /api/search` `{intent, conversationId?}` → async job/searchRun id or stream, results and source report.
- `GET /api/search/:id` → normalized results/diagnostic counters.
- `GET /api/conversations`, `GET /api/conversations/:id`, `DELETE /api/conversations/:id`.
- `POST /api/profile/resume` multipart; validate content type, magic bytes and size; return extraction preview.
- `GET/PATCH /api/profile` and `DELETE /api/profile/resume/:id`.
- `GET/POST /api/library`, `PATCH /api/library/:id`, `POST /api/library/:id/events`.
- `POST /api/opportunities/:id/outreach-draft` (draft only).
- `GET /api/source-health` (public-safe status; no credentials).

All responses typed with Zod and documented in `/docs/API.md`. Never expose the full server-side raw source payload or résumé data to another user.

### Authentication
Use a low-friction local demo/single-user mode for initial dev and a proper login/session model for multi-user deployment. Do not use fixed identity headers or unauthenticated mutable production endpoints. Secure cookies, CSRF protections where applicable, server-side ownership checks.

## 7. Provider integration and verification

**DeepSeek** — Official docs: https://api-docs.deepseek.com/api/create-chat-completion/ ; check currently supported model, structured output, streaming and tool calls during implementation. `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` configurable. Never pin an assumed model alias without verifying.

**Just One API** — Official docs: https://docs.justoneapi.com/en/usage and https://docs.justoneapi.com/zh/api/ ; documented base URL `https://api.justoneapi.com`, but exact BOSS/Wechat/Xiaohongshu endpoint and authentication specifics need endpoint-by-endpoint verification. Keep `JUSTONE_API_TOKEN` server only. Do not conflate with JustSERP provider, whose documentation/keys differ.

**Public search** — Define `WEB_SEARCH_PROVIDER` and `WEB_SEARCH_API_KEY`, with documented supported choice; choose from actual credential availability. If no account, support a labeled demo seed and an honest setup-needed error; do not fake search. URL fetching requires SSRF protection (deny private IP/metadata endpoints), timeouts and allowlist/safety rules.

**LinkedIn/BOSS/WeChat:** A proposed integration is not proof of API access. If coverage not authorized, adapter remains disabled with a reason and TODO; no credential bypass.

`.env.example` must include `DATABASE_URL`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `JUSTONE_API_TOKEN`, `WEB_SEARCH_PROVIDER`, `WEB_SEARCH_API_KEY`, `APP_BASE_URL`, `DEMO_MODE`, file-storage config and authentication secret placeholders. Configure via feature flags for each source.

## 8. Delivery phases (Codex execute sequentially, not stop at planning)

**Phase 0 — Setup.** Create app repo, `.gitignore`, README, `.env.example`, scripts, DB setup and migrations. Make `npm install`, `npm run dev`, `npm run build` work. Seed clearly marked demo fixtures.

**Phase 1 — Complete clickable UI.** Single composer, suggestion chips, streaming UI states, message history, 3 opportunity cards, save and Library, responsive layout. Use demo data ONLY as labeled DEMO fixtures.

**Phase 2 — Genuine search.** Implement and validate at least one authorized real public web-search provider (with configured credentials); orchestrator, structured search plan, normalize/dedupe, evidence collection, hard filters and ranking; UI switch shows honest source status. Add WeChat and BOSS adapters when endpoint credentials documented; independently test each.

**Phase 3 — Profile and CV.** File upload, server parsing, extraction preview + user correction, profile persistence and reranking. Optional post-result CTA in chat.

**Phase 4 — Action workflows.** Save → draft → copied / contacted / waiting / in progress / won / closed; contact validity checking and event log.

**Phase 5 — Quality.** Evaluation suite, tests, source degradation, performance & cost instrumentation, docs and deployment readiness.

**Phase 6 — Future, NOT part of current completion:** B2B client conversation → business process/AI capability brief → consent-based FDE/applied AI talent shortlist and matching → human review; team/seat usage models. Separate organization tenancy and explicit candidate opt-in before exposing individual profiles.

## 9. Acceptance tests (must demonstrate)

1. New visitor can edit preset FDE prompt and press Send, chat persists without navigating to job-board results page.
2. Demo mode shows exactly three labeled **fake fixture** cards; real mode only shows evidenced results and may return fewer than three.
3. A real search request uses configured backend search provider and generates source links, date/source metadata and Why it fits tied to user intent.
4. Hard constraint “remote contract only, no full-time” blocks explicit incompatible opportunities, with transparent logging.
5. Same opportunity returned by multiple providers is displayed once; origin links retained.
6. “Make it Shanghai only” changes geography without forgetting AI FDE and contract requirement.
7. Resume upload occurs after a search, extracts preview, user edits it, reranks and can delete file.
8. Save on card persists across reload; Library status and timeline are durable and isolated to user.
9. Generated outreach remains a draft until user explicitly confirms sending elsewhere.
10. Missing Just One API credential leaves usable app, source marked disabled, never fake BOSS results.
11. API returns structured error on timeout, bad upstream schema, or budget exhaustion, without leaking secrets.
12. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` and selected Playwright E2E must pass.

## 10. Codex execution prompt — paste verbatim into Codex

```text
You are the principal engineer and product designer. Read OPPORTUNITY_AGENT_MASTER_SPEC.md fully, then implement it in THIS NEW EMPTY REPOSITORY. The old laptop/repository is lost. You are authorized to build files, run package commands and tests, and create schema/migrations. Do not ask for confirmation at every step. Execute phases 0–5 to the extent possible, in order; prioritize a genuinely working individual-facing Opportunity Agent over speculative enterprise SaaS features.

Preserve the UX: one ChatGPT-like conversation input; user-entered or prefilled editable starter prompts; maximum three validated opportunity cards embedded in chat; optional resume upload AFTER initial results; stateful Library and action tracking. Use Next.js + TypeScript + Tailwind + Prisma + PostgreSQL, DeepSeek server client, pluggable web/Just One API adapters, Zod validation and test coverage.

Do not hallucinate live opportunities or third-party endpoints. Verify current API docs when network access is available. For unconfigured providers, make an explicit unconfigured adapter state; use visible DEMO fixtures only in demo mode. Implement a real source integration where feasible with an actual key and documented endpoint. Do not try to bypass source authentication or crawling restrictions.

Build and run the app, execute lint/typecheck/test/build, fix failures, and create: README.md with start instructions, .env.example, docs/ARCHITECTURE.md, docs/API.md, docs/PROVIDER_SETUP.md, docs/EVALUATION.md, and IMPLEMENTATION_STATUS.md reporting what genuinely works, what needs credentials, and any remaining limitations. Never claim the app is fully live without real source checks.

Start now by creating the project and Phase 1, then progressively implement the backend. Do not stop at a design or a mock screenshot.
```

## 11. Source evidence and provenance of requirements

This brief consolidates prior design discussion and preexisting documents identified as `Opportunity_Agent_V2_Codex_Brief.docx`, `Opportunity_Agent_V2_Codex_START_HERE.md`, `opportunity_agent_demo(1).png`, and `Opportunity_Agent_Business_Plan.pptx`. The original brief assumed auditing an existing codebase; THIS rebuild intentionally supersedes that instruction because the computer/repository is unavailable. Enterprise B2B strategy informs future extensibility only. Specific provider availability and API endpoints must be verified during development, rather than inferred from historical plans.



## 12. Recovered brand identity: Cambium

**Confirmed historical brand spelling: Cambium.** Use this as the public-facing master brand, while **Opportunity Agent** remains the functional product name. The prior logo was created September 28, 2026. This is a recovered brand direction, not a trademark/domain clearance.

### Original visual assets included
- `assets/Cambium Organic Logo Identity.png`: wordmark and complete brand board; olive concentric C symbol, modern black sans-serif wordmark, light/dark icon treatments.
- `assets/Organic Olive C-Ring Emblem.png`: standalone C-ring mark requested as the simplified PNG.

### Required UI integration
- Display Cambium name and logo in app header, chat empty state, sign-in shell and favicon; identify the search experience as **Opportunity Agent**.
- Keep wordmark and product/module name independently configurable.
- Muted olive/sage, off-white, near-black; sparse modern typography, calm editorial style. No generic robot mascot, neon styling or crowded job board.
- Use the original PNGs as source/reference; their backgrounds may be opaque. For production SVG/favicon, faithfully trace rather than invent a substitute. Do not crop brand board to make an icon blindly.
- Keep the single ChatGPT-style composer, editable prompts, and exactly up to three validated result cards unchanged.
- Copy production-ready brand assets to `public/brand` and document the provenance in README.
- Brand assets do not authorize changes to search logic, ranking or the enterprise roadmap.

### Brand acceptance criteria
1. Cambium appears consistently in page title, main UI and favicon.
2. Opportunity Agent remains product/module descriptor.
3. Both original images remain in the repository, with any derived production variants separately named.
4. Light/dark accessible contrast maintained; existing conversation-first UX preserved.
