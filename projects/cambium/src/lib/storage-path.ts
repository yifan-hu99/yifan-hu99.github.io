import path from 'node:path';
import {tmpdir} from 'node:os';
/** Provider caches are disposable; durable user data lives in the database. */
export function cachePath(...parts:string[]){return path.join(process.env.VERCEL?path.join(tmpdir(),'cambium-cache'):path.join(process.cwd(),'data'),...parts);}
