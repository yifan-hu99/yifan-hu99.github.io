# Deploy Cambium on Railway

This is a password-protected single-user workspace. Everyone with the access password shares the same conversations, profile and Library. It is not a multi-user SaaS deployment.

1. Connect `yifan-hu99/yifan-hu99.github.io`, branch `main`.
2. Set the service Root Directory to `/projects/cambium`.
3. Set Railway Config File to `/projects/cambium/railway.json` (this path is relative to the repository root, even when Root Directory is set).
4. Attach one persistent volume at `/data`. Keep one service replica for this SQLite deployment.
5. Generate a public Railway domain. Set the following service variables:

```dotenv
DATABASE_URL=file:/data/cambium.db
APP_ACCESS_USERNAME=cambium
APP_ACCESS_PASSWORD=<a unique password of at least 16 characters>
DEMO_MODE=false
JUSTONE_API_TOKEN=<your Just One API token>
WECHAT_ENABLED=true
XIAOHONGSHU_ENABLED=true
DEEPSEEK_API_KEY=<your DeepSeek API key>
DEEPSEEK_MODEL=deepseek-flash
```

The server derives `APP_BASE_URL` from `RAILWAY_PUBLIC_DOMAIN`. For a custom domain, set `APP_BASE_URL=https://your-domain.example` explicitly. Railway supplies `PORT` and `RAILWAY_VOLUME_MOUNT_PATH`.

The Dockerfile builds with Node 24 and includes OpenSSL for Prisma. The start command validates storage and access settings, creates a missing SQLite file, applies existing Prisma migrations and listens on `0.0.0.0:$PORT`. Migrations run at service start because Railway volumes are unavailable during build and pre-deploy.

Health check: `/api/health`. It performs a database query and returns only a generic status without authentication. Pages, conversations, profiles and all other APIs require the workspace credentials. Use HTTPS. Do not commit real credentials or upload the local database to GitHub.

A new deployment starts with an empty workspace. Provider caches are disposable. Calendar events remain in the user's browser. Existing local chat/profile data is not automatically copied; an intentional database backup can be transferred privately to the Railway volume after stopping writes, if needed.

Official Railway references: [monorepo root/config paths](https://docs.railway.com/deployments/monorepo), [volumes and startup migrations](https://docs.railway.com/volumes), [environment variables](https://docs.railway.com/variables).
