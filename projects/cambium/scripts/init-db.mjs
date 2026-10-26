import { DatabaseSync } from 'node:sqlite';
import { existsSync,readFileSync,mkdirSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
// Work around Prisma's Windows initialization issue with a missing SQLite file.
const env=existsSync('.env')?readFileSync('.env','utf8'):'';
const url=process.env.DATABASE_URL || env.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1] || 'file:./cambium.db';
if(url.startsWith('file:')){const file=resolve('prisma',url.slice(5));mkdirSync(dirname(file),{recursive:true});new DatabaseSync(file).close();}
