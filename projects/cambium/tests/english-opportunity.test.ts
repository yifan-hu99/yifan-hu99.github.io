import {describe,it,expect,vi,afterEach} from 'vitest';
vi.mock('node:fs/promises',()=>({readFile:vi.fn().mockRejectedValue(new Error('no cache')),mkdir:vi.fn(),writeFile:vi.fn()}));
import {englishOpportunity,sourceTitleFallback} from '../src/lib/english-opportunity';
import {buildOpportunityBrief} from '../src/lib/opportunity-brief';
import {fixtures} from '../src/lib/search';
const source={...fixtures()[0],demo:false,title:'招聘工程师',organization:'测试公司',summary:'负责部署',evidence:'投递 jobs@example.com',compensation:'10–20k·13薪',url:'https://example.com/jobs',sources:['https://example.com/jobs'],contact:'mailto:jobs@example.com',facts:{requirements:[],responsibilities:[],restrictions:[],deadline:null,contactName:null,emails:[{value:'jobs@example.com',sourceUrl:'https://example.com/jobs',evidence:'投递 jobs@example.com'}],website:null,application:null,businessSignal:null}};
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('English opportunity display',()=>{
 it('translates public fields while preserving links and email',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','test-only');
  vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{const body=JSON.parse(init.body);const values=JSON.parse(body.messages[1].content);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({translations:values.map((v:string)=>v.includes('@')?'Apply: jobs@example.com':'English source text')})}}]}));}));
  const result=await englishOpportunity(source);expect(result.title).toBe('English source text');expect(result.id).toBe(source.id);expect(result.url).toBe(source.url);expect(result.contact).toBe(source.contact);expect(result.facts?.emails[0].value).toBe('jobs@example.com');expect(JSON.stringify(buildOpportunityBrief(result))).not.toMatch(/\p{Script=Han}/u);
 });
 it('keeps English source-backed fallbacks when translation is unavailable',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','');const result=await englishOpportunity(source);expect(result.url).toBe(source.url);expect(result.title).toBe('Engineer');expect(result.caveat).toContain('could not be translated');expect(JSON.stringify(buildOpportunityBrief(result))).not.toMatch(/\p{Script=Han}/u);
 });
 it('keeps a valid title when another field fails English validation',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','test-only');vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{const values=JSON.parse(JSON.parse(init.body).messages[1].content);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({translations:values.map((v:string,i:number)=>i===0?'AI Translation Evaluator':v.includes('@')?'jobs@example.com':'翻译失败')})}}]}));}));
  const result=await englishOpportunity(source);expect(result.title).toBe('AI Translation Evaluator');expect(result.contact).toBe(source.contact);expect(result.caveat).toContain('could not be translated');
 });
 it('retries a failed title independently from the rest of the source',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','test-only');const fetchMock=vi.fn(async(_url,init)=>{const values=JSON.parse(JSON.parse(init.body).messages[1].content);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({translations:values.map((v:string,i:number)=>values.length===1?'Recovered source title':i===0?'未翻译':v.includes('@')?'jobs@example.com':'English text')})}}]}));});vi.stubGlobal('fetch',fetchMock);
  const result=await englishOpportunity(source);expect(result.title).toBe('Recovered source title');expect(fetchMock).toHaveBeenCalledTimes(2);
 });
 it('uses only source title facts for a specific fallback when the provider is unavailable',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','');const title='Invisible | 翻译出海！招募中文AI翻译评估 时薪40元起';const result=await englishOpportunity({...source,title,compensation:'Not disclosed'});expect(result.compensation).toBe('From CNY 40/hour');expect(result.title).toBe('Invisible — Chinese-language AI Translation Evaluator · from CNY 40/hour');expect(result.title).not.toContain('Recruitment opportunity');expect(sourceTitleFallback('未知岗位招聘')).toContain('English title unavailable');
 });
 it('skips translation for English-only sources',async()=>{const mock=vi.fn();vi.stubGlobal('fetch',mock);await englishOpportunity(fixtures()[0]);expect(mock).not.toHaveBeenCalled();});
});
