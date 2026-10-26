# Cambium · Opportunity Agent

A running, local, single-user rebuild of the attached opportunity-agent kits. Conversation-first discovery, up to three opportunity cards, a durable Library, résumé review, and outreach drafts.

## Start

Requires Node.js 24 and npm.

```powershell
npm install
Copy-Item .env.example .env
npm run db:setup
npm run dev
```

Open http://localhost:3000. For a production local build, run `npm run build`, then `npm start`. Stop a dev server on port 3000 before starting production.

Default mode is **Live search**. The homepage shows up to three real source listings before a search. Compact, specific prompts above the composer only fill editable text; they never submit automatically. The top-right mode control still offers an explicitly labeled Demo mode. Remotive is connected without a key. It covers remote jobs, with source attribution and direct links; its public feed has a 24-hour delay. No account is required. The first conversation allows unlimited follow-ups. Before starting another conversation, confirm skills, enable matching, and add a résumé or portfolio.

## What works

- Editable starter prompts; streamed search phases; cards embedded in a saved conversation.
- Remotive public API, cached for six hours. Just One API WeChat recruitment search and DeepSeek intent planning are connected when server credentials are configured; Tavily remains optional.
- Normalization, URL/organization deduplication, explicit hard constraints, heuristic ranking, source diagnostics.
- Save, search and filter Library; stage tracking, durable notes and timestamped history.
- PDF, DOCX and TXT extraction, review before profile confirmation, optional local skills matching, deletion.
- Editable template-based outreach drafts. Copying never marks a message sent. Explicit confirmation records sending elsewhere.
- Responsive mobile navigation, keyboard controls and modal focus management.

## Check

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
# Start the app in a separate terminal:
npm run test:e2e
```

For a different local test port set `TEST_BASE_URL`. For an existing Chromium executable set `PLAYWRIGHT_EXECUTABLE_PATH`. E2E tests create test conversations, a demo Library item and a test profile; use a disposable database.

## Deliberate scope and limits

This is a **local MVP**, not a hosted multi-user service. Scripts bind to 127.0.0.1; API guards reject non-local and cross-origin requests. No authentication or user tenancy is claimed. Do not expose it through a public proxy.

SQLite + Prisma is the runnable default instead of requiring PostgreSQL installation. See [architecture](docs/ARCHITECTURE.md) for the migration path. The full historical schema and every production requirement are not implemented. See [implementation status](IMPLEMENTATION_STATUS.md).

Source-backed does not mean independently verified hiring availability. Check original sources. Tavily results use snippets only, with uncertainties explicitly stated. No scraping or arbitrary URL fetching is performed. No jobs, contact identities or application sends are invented.

## Brand provenance

`public/brand/original-emblem.png` is the unchanged “Organic Olive C-Ring Emblem.png” from Cambium_Opportunity_Agent_Codex_Rebuild_Kit.zip. The kit referenced a second asset, “Cambium Organic Logo Identity.png”, but it was absent from both supplied archives. The UI uses text for the Cambium wordmark and the original emblem; it does not recreate the missing brand board. Original requirements are preserved in `docs/MASTER_SPEC.md` as reference material.

[API](docs/API.md) · [Providers](docs/PROVIDER_SETUP.md) · [Evaluation](docs/EVALUATION.md)

The existing installed workspace can also be started with Start-Cambium.cmd. It expects dependencies, a migrated database and a successful build. Generated builds are stored in .cambium-build; .build-dir selects the last successful one. Webpack and constrained build concurrency avoid Windows sandbox filesystem issues.

Shanghai FDE discovery now uses authorized WeChat Article Search V2 and Article Details V4 through Just One API, with original links and source-published application emails. BOSS and LinkedIn remain unconnected. Xiaohongshu search V4 with V2 failover and details V1 are connected and account-tested. To run the optional real-provider browser regression, set RUN_LIVE_PROVIDER_TESTS=true; this uses configured provider credits.

## Opportunity details and conversations

Discover, Library and Profile & résumé are horizontal tabs in the top header. Recommendations show Work, Fit and Next; View details and Library detail show Why this, Why you, Why now, actual conditions, source-backed contact paths and Next action. Homepage previews open the same six-part detail. Unknown facts remain explicitly undisclosed; personal fit requires matching consent, and draft personalization has separate consent.

One round means one conversation, with unlimited follow-up messages. A profile dialog appears after the first conversation; it blocks a new conversation until skills, matching consent and a résumé or valid portfolio are confirmed. Existing conversations remain usable. Refresh restores the selected conversation. Deleting the original résumé after completed confirmation does not by itself revoke that confirmation.

## English interface

All interface copy and generated six-part briefs are in English. Chinese public source fields are translated server-side using the configured DeepSeek credential, with cached translations. Original source records, links and public email addresses are retained. The translation provider receives public source text only, never personal profile or resume data. If translation fails, the interface shows an English availability message and the original source link; later reads can retry. User-entered messages, notes and profile text remain user-authored.

## Task relevance and priority
Explicit new tasks replace stale role context. Translation/localization is checked before ranking, so unrelated FDE or content-creation roles are excluded. AI evidence has the largest ranking weight (60), followed by finance preference (35) and freelance preference (20). Ideally/prefer are soft preferences; explicit only/must constraints remain hard. Cards show three concise highlights, with the six-part brief available through View details. Xiaohongshu buyer-demand notes join the real provider search; unpaid trials, provider advertisements and tutorials are excluded. Worksite is never inferred from author IP location.

## Calendar
Calendar is an independent top navigation feature alongside Profile. It supports manually scheduled follow-ups, application deadlines, interviews and other events, optional saved-opportunity links, completion and deletion. Events are stored only in the current browser localStorage and use the device time zone; there is no external calendar synchronization or background notification delivery.

## Personalized home discovery
With real search history, homepage cards reuse qualifying historical results for the most recent search intent, excluding dismissed and expired listings. Cards are labeled Previously found. Suggested prompts are reconstructed in English from up to three distinct recent search intents. Raw chat text and profiles are not needed to build these prompts. New users retain the default Remotive preview. No background provider search is triggered by reading history.

## Railway deployment

See [Railway setup](docs/RAILWAY.md) for a Docker deployment with a persistent SQLite volume, startup migrations, health checks and password-protected access. Source lives in `projects/cambium` in the GitHub repository. This remains one shared private workspace, not isolated user accounts.

## Vercel deployment

See [Vercel setup](docs/VERCEL.md). Set Root Directory to `projects/cambium`, connect PostgreSQL storage, and configure server-side secrets in Vercel. Production builds generate the PostgreSQL client and apply its migrations. Local development still uses SQLite.
