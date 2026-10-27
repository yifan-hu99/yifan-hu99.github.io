import {describe,it,expect} from 'vitest';
import {NextRequest} from 'next/server';
import {proxy} from '../src/proxy';
import {newVisitor,visitorCookie,visitorOwner} from '../src/lib/visitor';
import {requestOwner} from '../src/lib/security';
describe('private visitor workspaces',()=>{
 it('opens the application without a password challenge and forwards a fresh private cookie',()=>{const r=proxy(new NextRequest('https://cambium.example/'));const cookie=r.cookies.get(visitorCookie);expect(r.status).toBe(200);expect(r.headers.has('www-authenticate')).toBe(false);expect(cookie?.httpOnly).toBe(true);expect(cookie?.secure).toBe(true);expect(cookie?.sameSite).toBe('lax');expect(visitorOwner(cookie?.value)).toMatch(/^visitor_/);expect(r.headers.get('x-middleware-request-cookie')).toContain(cookie?.value);});
 it('keeps valid visitor identity across requests and never trusts owner headers',()=>{const token=newVisitor();const req=new NextRequest('https://cambium.example/api/state',{headers:{cookie:visitorCookie+'='+token,'x-owner-id':'legacy'}});expect(requestOwner(req)).toBe(visitorOwner(token));expect(proxy(req).cookies.get(visitorCookie)).toBeUndefined();expect(visitorOwner(newVisitor())).not.toBe(visitorOwner(token));});
 it('replaces invalid cookies and rejects requests without a visitor identity',()=>{expect(visitorOwner('legacy')).toBeNull();expect(visitorOwner('a'.repeat(63))).toBeNull();expect(()=>requestOwner(new NextRequest('https://cambium.example/api/state',{headers:{'x-owner-id':'legacy'}}))).toThrow('Refresh');expect(visitorOwner(proxy(new NextRequest('https://cambium.example/',{headers:{cookie:visitorCookie+'=legacy'}})).cookies.get(visitorCookie)?.value)).toMatch(/^visitor_/);});
});
