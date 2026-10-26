import {afterEach,describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {guard} from '../src/lib/security';
import {validAccess} from '../src/lib/access';
import {railwayRuntime} from '../scripts/runtime-config.mjs';
import {resolve} from 'node:path';
const password='test-password-123456789';
const auth='Basic '+Buffer.from('cambium:'+password).toString('base64');
afterEach(()=>vi.unstubAllEnvs());
describe('hosted deployment boundaries',()=>{
 it('keeps local development accessible and fails closed on Railway without a password',()=>{vi.stubEnv('APP_BASE_URL','http://localhost:3000');vi.stubEnv('RAILWAY_ENVIRONMENT_ID','');vi.stubEnv('RAILWAY_PUBLIC_DOMAIN','');vi.stubEnv('APP_ACCESS_PASSWORD','');expect(validAccess(null)).toBe(true);vi.stubEnv('RAILWAY_ENVIRONMENT_ID','test');expect(validAccess(null)).toBe(false);});
 it('requires exact Basic credentials',()=>{expect(validAccess(auth,password)).toBe(true);expect(validAccess(null,password)).toBe(false);expect(validAccess('Basic '+Buffer.from('other:'+password).toString('base64'),password)).toBe(false);});
 it('allows configured deployment hosts and rejects foreign origins and hosts',()=>{vi.stubEnv('APP_ACCESS_PASSWORD',password);vi.stubEnv('APP_BASE_URL','https://cambium-test.up.railway.app');vi.stubEnv('RAILWAY_PUBLIC_DOMAIN','cambium-test.up.railway.app');const request=(host:string,origin:string)=>new NextRequest('https://'+host+'/api/state',{headers:{host,origin,authorization:auth}});expect(()=>guard(request('cambium-test.up.railway.app','https://cambium-test.up.railway.app'))).not.toThrow();expect(()=>guard(request('cambium-test.up.railway.app','https://foreign.example'))).toThrow('origin');expect(()=>guard(request('foreign.example','https://foreign.example'))).toThrow('host');});
 it('requires durable storage and an access password before starting Railway',()=>{expect(()=>railwayRuntime({})).toThrow('volume');expect(()=>railwayRuntime({RAILWAY_VOLUME_MOUNT_PATH:resolve('prisma')})).toThrow('PASSWORD');});
 it('derives the public origin and keeps SQLite inside the mounted volume',()=>{const volume=resolve('prisma','railway-test');const result=railwayRuntime({RAILWAY_VOLUME_MOUNT_PATH:volume,RAILWAY_PUBLIC_DOMAIN:'cambium-test.up.railway.app',APP_ACCESS_PASSWORD:password,PORT:'3002'});expect(result.DATABASE_URL).toContain(volume);expect(result.APP_BASE_URL).toBe('https://cambium-test.up.railway.app');expect(()=>railwayRuntime({...result,DATABASE_URL:'file:'+resolve('outside.db')})).toThrow('inside');});
});
