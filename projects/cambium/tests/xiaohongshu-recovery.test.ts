import {describe,it,expect,vi,afterEach} from 'vitest';
vi.mock('node:fs/promises',()=>({readFile:vi.fn().mockRejectedValue(new Error('no cache')),mkdir:vi.fn(),writeFile:vi.fn()}));
const note={id:'6aa2702200000000260089bc',title:'招募AI同声传译执行人员',desc:'负责 AI 翻译和口译。按项目结算。',timestamp:Math.floor(Date.now()/1000),user:{nickname:'Test author'}};
const response=(code:number,data?:unknown)=>new Response(JSON.stringify({code,data}),{headers:{'Content-Type':'application/json'}});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.resetModules();});
describe('Xiaohongshu live-route recovery',()=>{
 it('uses the observed V2 nested-note shape after V4 returns 301',async()=>{
  vi.stubEnv('JUSTONE_API_TOKEN','test-only');const mock=vi.fn(async(url:URL)=>String(url).includes('/v4')?response(301):response(0,{items:[{model_type:'note',note},{model_type:'hot_query'}]}));vi.stubGlobal('fetch',mock);
  const {searchRedNotes}=await import('../src/lib/xiaohongshu');const result=await searchRedNotes('上海 AI 翻译');expect(result.route).toBe('V2');expect(result.notes[0].id).toBe(note.id);expect(mock).toHaveBeenCalledTimes(2);
 });
 it('does not retry invalid credentials or permission failures',async()=>{vi.stubEnv('JUSTONE_API_TOKEN','test-only');const mock=vi.fn(async()=>response(600));vi.stubGlobal('fetch',mock);const {searchRedNotes}=await import('../src/lib/xiaohongshu');await expect(searchRedNotes('AI 翻译')).rejects.toMatchObject({code:600});expect(mock).toHaveBeenCalledTimes(1);});
 it('retains the first query results when the second query fails',async()=>{
  vi.stubEnv('JUSTONE_API_TOKEN','test-only');vi.stubGlobal('fetch',vi.fn(async(url:URL)=>{const u=new URL(url);if(u.pathname.includes('get-note-detail'))return response(301);if(u.pathname.endsWith('/v4'))return response(301);return u.searchParams.get('keyword')?.startsWith('上海')?response(0,{items:[{model_type:'note',note}]}):response(301);}));
  const {searchXiaohongshu,xiaohongshuDiagnostics}=await import('../src/lib/xiaohongshu');const i={query:'AI translation',roles:['translator'],roleFamily:'translation' as const,location:'Shanghai',remote:false,contract:false,excludeFullTime:false,horizon:60,aiRequired:true};const jobs=await searchXiaohongshu(i);expect(jobs).toHaveLength(1);expect(jobs[0].source).toContain('V2');expect(xiaohongshuDiagnostics(i)?.status).toBe('partial');expect(xiaohongshuDiagnostics(i)?.detail).toContain('successful results retained');
 });
 it('surfaces failure when both endpoints fail, rather than reporting zero successful results',async()=>{vi.stubEnv('JUSTONE_API_TOKEN','test-only');vi.stubGlobal('fetch',vi.fn(async()=>response(301)));const {searchRedNotes}=await import('../src/lib/xiaohongshu');await expect(searchRedNotes('AI 翻译')).rejects.toMatchObject({code:301});});
});
