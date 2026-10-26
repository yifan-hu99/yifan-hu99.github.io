import { describe,it,expect,vi,afterEach } from 'vitest';
import { matchesTerm,extractIntent,qualifies,dedupe,fixtures,rank,safeUrl,search,tavily,plan,selectOpportunities } from '../src/lib/search';
describe('opportunity evidence and intent pipeline',()=>{
 afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
 it('preserves FDE and contract constraints on location-only followup',()=>{
  const first=extractIntent('Find remote AI FDE roles, contract only, no full-time');
  const next=extractIntent('Make it Shanghai only',first);
  expect(next.roles).toEqual(first.roles);expect(next.location).toBe('Shanghai');expect(next.remote).toBe(true);expect(next.excludeFullTime).toBe(true);
 });
 it('blocks explicit full-time and onsite work under hard constraints',()=>{
  const i=extractIntent('remote AI contract only, no full-time');
  expect(qualifies({...fixtures()[0],engagement:'full time'},i)).toBe(false);
  expect(qualifies({...fixtures()[0],modality:'On-site'},i)).toBe(false);
  expect(qualifies(fixtures()[0],i)).toBe(true);
 });
 it('blocks wrong locations and expired listings',()=>{
  const i=extractIntent('AI FDE in Shanghai');
  expect(qualifies({...fixtures()[0],location:'London'},i)).toBe(false);
  expect(qualifies({...fixtures()[0],publishedAt:'2020-01-01T00:00:00Z'},i)).toBe(false);
 });
 it('deduplicates repeated roles while retaining origin links',()=>{
  const a={...fixtures()[0],demo:false,url:'https://example.com/jobs/1',sources:['https://example.com/jobs/1']};
  const b={...a,url:'https://another.org/job',sources:['https://another.org/job']};
  const unique=dedupe([a,b]);expect(unique).toHaveLength(1);expect(unique[0].sources).toHaveLength(2);
 });
 it('never treats fixture URLs or contacts as real',()=>{
  expect(fixtures()).toHaveLength(3);for(const o of fixtures()){expect(o.demo).toBe(true);expect(o.url).toBe('');expect(o.contact).toBeNull();}
 });
 it('uses confirmed profile skills only when opted in',()=>{
  const i=extractIntent('AI opportunities'),items=fixtures();
  const profile={name:'',location:'',skills:'evaluation, training, Python',preferences:'',portfolio:'',useForMatching:false,useForDrafts:false};
  expect(rank(items,i,profile).some(o=>o.why.some(w=>w.includes('confirmed skills')))).toBe(false);
  expect(rank(items,i,{...profile,useForMatching:true})[0].id).toBe('demo-eval');
 });
 it.each(['http://example.com','https://127.0.0.1/a','https://10.0.0.1','https://192.168.1.1','https://169.254.169.254','https://[::1]','https://foo.local','javascript:alert(1)','https://user:pass@example.com'])('rejects unsafe source link %s',url=>expect(safeUrl(url)).toBeNull());
 it('does not mistake Rails or training for the word AI',()=>{expect(matchesTerm('Rails training','AI')).toBe(false);expect(matchesTerm('Applied AI engineer','AI')).toBe(true);});
 it('accepts a public https source link',()=>expect(safeUrl('https://remotive.com/remote-jobs/test')).toBeTruthy());
 it('runs the complete demo pipeline with three clearly fictional cards',async()=>{const result=await search(extractIntent('Find remote AI FDE opportunities, contract only, no full-time'),true);expect(result.opportunities).toHaveLength(3);expect(result.opportunities.every(o=>o.demo)).toBe(true);});
 it('does not fall back to fixtures when all live sources are disabled',async()=>{
  vi.stubEnv('REMOTIVE_ENABLED','false');vi.stubEnv('WEB_SEARCH_API_KEY','');
  const r=await search(extractIntent('AI FDE'),false);expect(r.opportunities).toHaveLength(0);expect(r.report.some(x=>x.id==='Demo')).toBe(false);
 });
 it('returns explicit upstream schema and timeout failures without fixtures',async()=>{
  vi.stubEnv('REMOTIVE_ENABLED','false');vi.stubEnv('WEB_SEARCH_PROVIDER','tavily');vi.stubEnv('WEB_SEARCH_API_KEY','secret-not-for-client');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({results:'invalid'}))));
  let r=await search(extractIntent('AI'),false);expect(r.report.find(x=>x.id==='Tavily')?.detail).toBe('BAD_UPSTREAM_SCHEMA');expect(r.opportunities).toHaveLength(0);expect(JSON.stringify(r)).not.toContain('secret-not-for-client');
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('Timeout')));
  r=await search(extractIntent('AI'),false);expect(r.report.find(x=>x.id==='Tavily')?.status).toBe('error');expect(r.opportunities).toHaveLength(0);
 });
 it('rejects news and closed calls in web snippets',async()=>{
  vi.stubEnv('WEB_SEARCH_API_KEY','test');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({results:[{title:'AI news',url:'https://example.com/news',content:'New AI models launched.'},{title:'Old opening',url:'https://example.com/old',content:'Hiring closed; no longer accepting applications.'},{title:'Open project',url:'https://example.com/call',content:'We are hiring an AI engineer. Apply now.'}]}))));
  const jobs=await tavily.search(extractIntent('AI engineer'));expect(jobs).toHaveLength(1);expect(jobs[0].contact).toBeNull();expect(jobs[0].source).toContain('snippet only');
 });
 it('degrades the planner without disclosing upstream errors',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','secret');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('secret')));
  const p=await plan('Find AI FDE');expect(p.intent.roles).toContain('FDE');expect(p.warning).toContain('unavailable');expect(JSON.stringify(p)).not.toContain('secret');
 });
});
describe('recommendation source diversity',()=>{
 it('includes a matching Xiaohongshu candidate instead of three WeChat cards',()=>{
  const base=fixtures()[0];const jobs=['WeChat','WeChat','WeChat','Xiaohongshu'].map((source,i)=>({...base,id:String(i),organization:'Employer '+i,source,score:90-i,demo:false,matchTier:'exact' as const}));
  const result=selectOpportunities(jobs);expect(result).toHaveLength(3);expect(result[0].id).toBe('0');expect(result.some(o=>o.source==='Xiaohongshu')).toBe(true);
 });
 it('does not replace exact roles with an adjacent role just to diversify sources',()=>{
  const base=fixtures()[0];const jobs=['WeChat','WeChat','WeChat','Xiaohongshu'].map((source,i)=>({...base,id:String(i),organization:'Employer '+i,source,matchTier:i===3?'adjacent' as const:'exact' as const}));
  expect(selectOpportunities(jobs).every(o=>o.matchTier==='exact')).toBe(true);
 });
});
