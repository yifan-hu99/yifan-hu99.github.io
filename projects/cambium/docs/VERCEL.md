# Deploy Cambium on Vercel

Target team: `evelyn233s-projects`. Source repository: `yifan-hu99/yifan-hu99.github.io`, branch `main`, Root Directory `projects/cambium`.

## Persistent database

Create a PostgreSQL database using Vercel Marketplace (for example Neon) and connect it to this project. The database and API credentials belong in Vercel environment variables, not GitHub. The Vercel runtime does not use a local SQLite file.

Configure these variables for Production. Use a separate database or database branch for Preview before enabling Preview builds:

```dotenv
DATABASE_URL=<PostgreSQL application connection string>
DIRECT_URL=<PostgreSQL direct connection string for migrations, optional>
APP_ACCESS_USERNAME=cambium
APP_ACCESS_PASSWORD=<a unique password of at least 16 characters>
JUSTONE_API_TOKEN=<existing Just One API token>
DEEPSEEK_API_KEY=<existing DeepSeek API key>
DEEPSEEK_MODEL=deepseek-flash
DEMO_MODE=false
WECHAT_ENABLED=true
XIAOHONGSHU_ENABLED=true
```

`DIRECT_URL` defaults to `DATABASE_URL`; use the provider's direct URL when the application URL is a transaction pooler. Never prefix database credentials or provider keys with `NEXT_PUBLIC_`.

## Build and deploy

The framework is Next.js, Node.js 24. `vercel.json` sets `npm ci` for installation and `npm run vercel-build` for the build. The build validates configuration, generates the PostgreSQL Prisma client, applies the checked-in PostgreSQL migrations, and builds Next.js into `.next`.

The local SQLite schema and migrations remain available for local development. Both providers use the same application models. Existing local user data is not automatically migrated into the cloud database.

Pages and private APIs require the workspace username/password over HTTPS. All password holders share the same workspace; this is not isolated multi-user hosting. The app accepts its Vercel deployment hostname and production project hostname; set `APP_BASE_URL` for an additional custom domain.

Health check: `/api/health` returns a generic status after querying the database. Provider caches go to disposable temporary storage on Vercel. Conversations, profiles, saved opportunities and parsed résumé data go to PostgreSQL. Calendar entries remain in the user's browser. Search API duration is capped at 300 seconds; enable Fluid compute for a Hobby project.

Deploy a production build, test password protection, database health, chat/save behavior and a real source search, then verify the production domain. A successful build alone does not establish that the application is usable.

References: [Marketplace storage](https://vercel.com/docs/marketplace-storage), [monorepo projects](https://vercel.com/docs/monorepos), [environment variables](https://vercel.com/docs/environment-variables).
