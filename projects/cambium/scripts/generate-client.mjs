import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
const hosted=!!process.env.VERCEL||/^postgres(?:ql)?:/.test(process.env.DATABASE_URL||'');
const env=hosted?{...process.env,DATABASE_URL:process.env.DATABASE_URL||'postgresql://build:build@localhost:5432/build',DIRECT_URL:process.env.DIRECT_URL||process.env.DATABASE_URL||'postgresql://build:build@localhost:5432/build'}:process.env;
const args=['node_modules/prisma/build/index.js','generate','--schema',hosted?'prisma/postgres/schema.prisma':'prisma/schema.prisma'];
const result=spawnSync(process.execPath,args,{stdio:'inherit',env});process.exit(result.status??1);
