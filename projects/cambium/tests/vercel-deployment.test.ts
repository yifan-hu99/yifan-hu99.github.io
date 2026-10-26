import {describe,it,expect,vi,afterEach} from 'vitest';
import {vercelRuntime} from '../scripts/vercel-config.mjs';
import {cachePath} from '../src/lib/storage-path';
import {validAccess} from '../src/lib/access';
import {guard} from '../src/lib/security';
import {NextRequest} from 'next/server';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
afterEach(()=>vi.unstubAllEnvs());
describe('Vercel deployment',()=>{
 it('rejects local SQLite and missing database credentials',()=>{expect(()=>vercelRuntime({DATABASE_URL:'file:./cambium.db',APP_ACCESS_PASSWORD:'test-password-123456'})).toThrow('PostgreSQL');expect(()=>vercelRuntime({})).toThrow('PostgreSQL');});
 it('requires password protection and supports a separate migration connection',()=>{expect(()=>vercelRuntime({DATABASE_URL:'postgresql://test:test@localhost/db'})).toThrow('PASSWORD');const env=vercelRuntime({DATABASE_URL:'postgresql://test:test@localhost/db',DIRECT_URL:'postgresql://test:test@localhost/direct',APP_ACCESS_PASSWORD:'test-password-123456'});expect(env.DIRECT_URL).toContain('/direct');expect(env.VERCEL).toBe('1');});
 it('puts only disposable provider caches in serverless temporary storage',()=>{vi.stubEnv('VERCEL','1');expect(cachePath('english','test.json')).toBe(join(tmpdir(),'cambium-cache','english','test.json'));});
 it('fails closed without a password on Vercel and accepts only configured deployment origins',()=>{vi.stubEnv('VERCEL','1');vi.stubEnv('APP_ACCESS_PASSWORD','');expect(validAccess(null)).toBe(false);vi.stubEnv('APP_ACCESS_PASSWORD','test-password-123456');vi.stubEnv('VERCEL_URL','cambium-preview.vercel.app');const headers={host:'cambium-preview.vercel.app',origin:'https://cambium-preview.vercel.app',authorization:'Basic '+Buffer.from('cambium:test-password-123456').toString('base64')};expect(()=>guard(new NextRequest('https://cambium-preview.vercel.app/api/state',{headers}))).not.toThrow();});
 it('keeps local and hosted data models identical',()=>{const local=readFileSync('prisma/schema.prisma','utf8');const hosted=readFileSync('prisma/postgres/schema.prisma','utf8').replace('provider = "postgresql"','provider = "sqlite"').replace('\n  directUrl = env("DIRECT_URL")','');expect(hosted.replace(/\r/g,'')).toBe(local.replace(/\r/g,''));});
});
