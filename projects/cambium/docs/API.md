# Local API

All paths are /api-prefixed. Local-only access; malformed requests return JSON `{error:{code,message}}`. Request contracts and upstream payloads use Zod. Shared response types are in src/lib/types.ts. This build does not implement every endpoint proposed in the historical brief.

| Method | Path | Behavior |
|---|---|---|
| GET | /discover | Up to three current public Remotive AI listings; never fixtures, 503 on source failure |
| GET | /state | Conversations, confirmed profile, Library with events, resume file metadata, source status, default mode and onboarding state |
| POST | /chat | {message, conversationId?, demo:boolean}; NDJSON phases + saved assistant message; new conversations return PROFILE_REQUIRED (403) after the first conversation until onboarding is complete |
| GET | /conversations | Persisted conversations |
| GET | /conversations/:id | Full messages and most recent search run |
| DELETE | /conversations/:id | Delete chat/messages/search runs; Library remains |
| GET | /search/:id | Stored search diagnostics and result payloads |
| GET | /source-health | Configured/disabled provider capabilities; no secrets |
| GET | /profile | Local profile |
| PATCH | /profile | All fields: name, location, skills, preferences, portfolio, useForMatching, useForDrafts; updates local card fit |
| POST | /profile/resume | multipart file, PDF/DOCX/TXT ≤5 MB; extracted preview and suggested skills |
| DELETE | /profile/resume/:id | Delete extracted text and resume record |
| GET | /library | Items, opportunity payloads and events |
| POST | /library | {opportunityId}; idempotent save of a server-known result |
| PATCH | /library/:id | {status?,notes?}; persists timestamped action event |
| POST | /opportunities/:id/outreach-draft | Template draft stored on server, never sends |
| PATCH | /drafts/:id | {body?,status?}; DRAFT / COPIED / USER_CONFIRMED_SENT |
| DELETE | /privacy | Remove profile, resumes and drafts; preserve chats and Library |

Library statuses: SAVED, CONTACTED, WAITING, IN_PROGRESS, WON, CLOSED. A manually selected stage records the user's action. Preparing a draft never changes contact stage.

NDJSON event examples:
```json
{"type":"conversation","id":"stored-id","title":"Find remote AI work"}
{"type":"phase","text":"Searching available sources"}
{"type":"result","message":{"id":"stored-message-id","role":"assistant","text":"Summary","blocks":{"opportunities":[],"report":[],"intent":{},"metrics":{}}}}
```

Empty opportunity arrays are valid. Demo cards have `demo:true`, an explicit fictional label, no source URL and no contact. Real cards require source provenance; only explicit calls are included. Inferred-demand detection is not enabled.

Errors: INVALID_INPUT (400), LOCAL_ONLY / ORIGIN_REJECTED (403), NOT_FOUND (404), TOO_LARGE (413), PARSE_FAILED / NO_TEXT (422), RATE_LIMIT (429), SERVER_ERROR (500). Source failures are isolated in report rows: BAD_UPSTREAM_SCHEMA, UPSTREAM_HTTP_n, SOURCE_UNAVAILABLE_OR_TIMEOUT. A stream-level failure produces a saved failure message. No invented source result replaces it.

Opportunity payloads include a six-part brief, source-extracted facts and the matching intent. Conversation and Library reads hydrate older cards using current confirmed profile consent. Onboarding requires skills, useForMatching and a résumé or valid portfolio; existing conversation IDs are exempt from the new-chat gate.
