# Provider setup

Documentation checked during this build on 2026-10-24. User-supplied credentials are stored only in the local backend .env and are excluded from source delivery. Never put keys in client code.

## Remotive — implemented and live-tested

Official documentation: https://github.com/remotive-com/remote-jobs-api
Endpoint: GET https://remotive.com/api/remote-jobs
No key. REMOTIVE_ENABLED=true enables it. Cambium caches the complete feed for six hours and filters locally. The feed's notices require attribution and original Remotive links; both are shown on cards. Listings are delayed by 24 hours. Discovery has no signup gate. Data availability and source posting eligibility are still controlled by Remotive.

A real app request completed successfully in this session, returning source-backed records without fixtures. Coverage is remote roles; this does not provide complete Shanghai, WeChat or BOSS coverage. Check the original posting before acting.

## Tavily — implemented, requires key, not live-tested

Official documentation: https://docs.tavily.com/documentation/api-reference/endpoint/search
Endpoint: POST https://api.tavily.com/search
Authorization: Bearer key.

Set WEB_SEARCH_PROVIDER=tavily and WEB_SEARCH_API_KEY in .env, then restart. Adapter uses one basic query with max_results=10; no generated answer or raw full-page content. Explicit hiring/application signals must appear in a snippet. Cards state snippet-only evidence, unknown eligibility, and no verified contact route. A search page link is not represented as a verified application form. Account access, charges and terms must be reviewed by the key owner.

## DeepSeek — implemented and live-tested with user-supplied credentials

Official documentation: https://api-docs.deepseek.com/api/create-chat-completion/
Endpoint: POST https://api.deepseek.com/chat/completions
Set DEEPSEEK_API_KEY and DEEPSEEK_MODEL. Current checked documentation lists deepseek-flash and deepseek-v4-pro; default is configurable deepseek-flash.

Only current chat intent and prior intent are submitted for planning. Résumé text and profile are not submitted. JSON output is validated; failures visibly degrade to deterministic extraction. DeepSeek is not required for the demo or Remotive search. Ranking and outreach are currently deterministic/local; no AI-generated outreach claim.

## Just One API WeChat — implemented and live-tested

Official search documentation: https://docs.justoneapi.com/en/api/wechat-official-accounts/article-search-v2
POST https://api.justoneapi.com/api/weixin/search-article/v2
Authentication for this specific POST route: token in application/x-www-form-urlencoded body. Keyword, subSearchType=ALL, currentPage=1 and offset=0 are sent as documented.

Official article documentation: https://docs.justoneapi.com/en/api/wechat-official-accounts/article-details-v4
GET https://api.justoneapi.com/api/weixin/get-article-detail/v4
Authentication: token query parameter; articleUrl is restricted to a known mp.weixin.qq.com article URL. V4 returns full article HTML; V5 is lightweight metadata and is not used as full-body evidence.

JUSTONE_API_TOKEN enables the adapter unless WECHAT_ENABLED=false. Account success was confirmed with business code 0 for both routes. Requests have a 60-second timeout, two search queries maximum and three full-article lookups maximum per search; normalized results are cached for one hour. No cookies or tokens are persisted in provider caches. Body markup/scripts are removed, never executed. Credentials and full provider URLs are not sent to the browser.

For FDE searches the adapter searches Chinese FDE recruitment terms first, then related AI implementation terms if fewer than three location-backed candidates are found. Editorial articles, salary/trend commentary and closed calls are excluded. Related roles are labeled. City aliases normalize Shanghai/上海. An email is only shown if it appears with application/contact context in retrieved text. Publisher name is not automatically treated as proof of employer identity. Original source and uncertainty remain visible.

## Other proposed sources

BOSS and LinkedIn remain disabled. Xiaohongshu search V4 with V2 failover and details V1 are connected and account-tested. They are not silently enabled by the WeChat credential. Just One API and JustSERP are distinct services. No BOSS route was invented.

## Xiaohongshu
Uses JUSTONE_API_TOKEN and XIAOHONGSHU_ENABLED (default true). Official GET /api/xiaohongshu/search-note/v4 and GET /api/xiaohongshu/get-note-detail/v1 were account-tested with business code 0. Up to two queries and three note details per search, cached for one hour. Only explicit buyer demands with matching tasks are candidates. Note author identity, budget and current availability are unverified; public original links are retained. API access does not imply a note is independently verified.


## Source recovery verification — 2026-10-26

Xiaohongshu V4 returned business code 301 for the Shanghai AI translation query; the supported V2 search returned code 0 using its nested items[].note schema. Search now falls back on transient V4 failures, retries V2 once, and retains successful earlier queries if later queries fail. Partial reports are explicit and cached for only two minutes; complete searches retain the one-hour cache. Authentication/permission failures are not retried as transient errors.

The application search returned two Xiaohongshu buyer-demand candidates through V2. Both had original note links; failed detail retrieval remained labeled search excerpt. Final top-three selection still uses relevance and constraints across sources, so a connected source is not guaranteed a card.

BOSS public search redirected to the homepage; a subsequent ordinary browser visit reached its security verification page with zero job links. No verification bypass was attempted. The configured Just One API account has no validated BOSS search endpoint. BOSS remains disabled pending a documented provider endpoint and usable access.
