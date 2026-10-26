import { describe,it,expect,vi,afterEach } from 'vitest';
import { articleText,wechatUrl,isRecruitment,normalizeWechatItem,wechatQueries,searchWechat,JustOneError,readWechatItems } from '../src/lib/wechat';
import { extractIntent,qualifies,rank,searchSummary } from '../src/lib/search';
vi.mock('node:fs/promises',()=>({readFile:vi.fn().mockRejectedValue(new Error('No test cache')),mkdir:vi.fn().mockResolvedValue(undefined),writeFile:vi.fn().mockResolvedValue(undefined)}));
const intent={query:'Find AI Forward Deployed Engineer jobs in Shanghai, full-time preferred.',roles:['FDE','Forward Deployed Engineer'],location:'Shanghai',remote:false,contract:false,excludeFullTime:false,horizon:60};
const item=(id:string,organization='Fixture Publisher')=>({title:'招聘｜FDE 前沿部署工程师 '+id,desc:'工作地点：上海。全职岗位。简历投递：hiring@fixture.example。Python 和 AI 客户交付。',doc_url:'http://mp.weixin.qq.com/s?__biz=fixture&mid='+id+'&idx=1&sn=test&scene=7#rd',date:Math.floor(Date.now()/1000),source:{title:organization}});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('authorized Chinese recruitment discovery',()=>{
 it('generates a Chinese Shanghai FDE search and a related implementation followup',()=>{expect(wechatQueries(intent)[0]).toBe('上海 FDE 招聘');expect(wechatQueries(intent)[1]).toContain('实施');});
 it('upgrades WeChat article links to HTTPS and removes tracking',()=>{const u=wechatUrl(item('1').doc_url)!;expect(u).toMatch(/^https:/);expect(u).toContain('mid=1');expect(u).not.toContain('scene');expect(u).not.toContain('#');});
 it.each(['http://127.0.0.1/s','https://evil.example/s','https://mp.weixin.qq.com.evil.example/s','https://mp.weixin.qq.com:1234/s'])('rejects non-article or unsafe URL %s',u=>expect(wechatUrl(u)).toBeNull());
 it('extracts nested V2 search results with no generic recursive guessing',()=>{expect(readWechatItems({data:[{items:[item('1')]},{items:[item('2')]}]})).toHaveLength(2);});
 it('rejects editorials and closed recruitment instead of treating mentions as jobs',()=>{
  expect(isRecruitment('FDE 工资揭秘：月薪最高55K','很多公司招聘')).toBe(false);
  expect(isRecruitment('招聘 暴涨729%，国家给 FDE 立标准','工程师')).toBe(false);
  expect(isRecruitment('招聘 FDE 工程师','职位已关闭')).toBe(false);
  expect(isRecruitment('FDE 工程师招聘','岗位要求：Python')).toBe(true);
 });
 it('extracts only a published application email and explicit source city',()=>{
  const o=normalizeWechatItem(item('3'),intent)!;expect(o.location).toBe('Shanghai');expect(o.contact).toBe('mailto:hiring@fixture.example');expect(o.demo).toBe(false);expect(o.matchTier).toBe('exact');
  expect(normalizeWechatItem({...item('4'),desc:'招聘 AI 落地工程师。'},intent)?.location).toBe('Unknown');
 });
 it('never uses account IP location as a workplace',()=>{const o=normalizeWechatItem({...item('5'),desc:'FDE 工程师招聘，欢迎投递。'},intent)!;expect(o.location).toBe('Unknown');});
 it('strips scripts and display markup while keeping article text',()=>{const t=articleText('<script>secret</script><p>上海&nbsp;FDE</p><p>hiring@fixture.example</p>');expect(t).not.toContain('script');expect(t).not.toContain('secret');expect(t).toContain('上海 FDE');});
 it('matches Shanghai/上海 consistently and still rejects Beijing-only work',()=>{const o=normalizeWechatItem(item('6'),intent)!;expect(qualifies({...o,location:'上海'},intent)).toBe(true);expect(qualifies({...o,location:'Beijing'},intent)).toBe(false);});
 it('prioritizes known locations over unconfirmed-location candidates',()=>{const a=normalizeWechatItem(item('7'),intent)!;expect(rank([{...a,id:'unknown',location:'Unknown'},a],intent)[0].location).toBe('Shanghai');});
 it('returns three actual provider-shaped recruitment records through the adapter',async()=>{
  vi.stubEnv('JUSTONE_API_TOKEN','fixture-token');vi.stubEnv('WECHAT_ENABLED','true');
  vi.stubGlobal('fetch',vi.fn(async(url:URL)=>new Response(JSON.stringify(String(url).includes('/search-article/')?{code:0,data:{data:[{items:[item('11','Fixture A'),item('12','Fixture B'),item('13','Fixture C')]}]}}:{code:0,data:{data:{html:'<p>上海 FDE 全职工程师招聘</p><p>简历投递：hiring@fixture.example</p>'}}}),{headers:{'Content-Type':'application/json'}})));
  const jobs=await searchWechat({...intent,roles:['FDE adapter-case-3']});expect(jobs).toHaveLength(3);expect(jobs.every(o=>o.source.includes('article checked'))).toBe(true);expect(new Set(jobs.map(o=>o.url)).size).toBe(3);
 });
 it('exposes business-code failures without echoing credentials',async()=>{
  vi.stubEnv('JUSTONE_API_TOKEN','private-test-token');
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({code:100,data:null}))));
  await expect(searchWechat({...intent,roles:['FDE invalid-token-case']})).rejects.toBeInstanceOf(JustOneError);
  try{await searchWechat({...intent,roles:['FDE invalid-token-case-2']});}catch(e){expect((e as Error).message).toBe('JUSTONE_100');expect((e as Error).message).not.toContain('private-test-token');}
 });
 it('English expanded role names retain exact Chinese FDE fit explanations',()=>{
  const expanded={...intent,roles:['AI Forward Deployed Engineer','Forward Deployed Engineer','AI Solutions Engineer']};
  const o=normalizeWechatItem(item('english-alias-case'),expanded)!;
  const result=rank([o],expanded)[0];expect(result.why[0]).toContain('Explicit FDE');expect(result.why[0]).not.toContain('Adjacent');expect(result.why.join(' ')).toContain('Shanghai');
 });
 it('zero results explain coverage limits, rather than implying no vacancies exist',()=>{const text=searchSummary({opportunities:[],intent,report:[{id:'Remotive',status:'ok',detail:'Remote board only'}],metrics:{candidates:0,rejected:0,duplicates:0,durationMs:1}},false);expect(text).toContain('coverage limit');expect(text).toContain('BOSS and LinkedIn have not been searched');});
 it('retains full-time preference without creating a contract-only restriction',()=>{const i=extractIntent('Find FDE jobs in Shanghai. Full-time preferred.');expect(i.contract).toBe(false);expect(i.excludeFullTime).toBe(false);});
});
