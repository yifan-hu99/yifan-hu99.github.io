import {sourcePay} from './compensation';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {extractOpportunityFacts} from './opportunity-facts';
import {cityNames,JustOneError} from './wechat';
import {intentFamily,taskMatches} from './intent-relevance';
import type {Intent,Opportunity} from './types';
export const xiaohongshuConfigured=()=>!!process.env.JUSTONE_API_TOKEN&&process.env.XIAOHONGSHU_ENABLED!=='false';
const noteSchema=z.object({id:z.string().regex(/^[a-f0-9]{24}$/i),title:z.string().optional(),desc:z.string().optional(),timestamp:z.number().optional(),user:z.object({nickname:z.string().optional()}).optional(),mini_program_info:z.object({webpage_url:z.string().optional()}).optional()});
export type RedNote=z.infer<typeof noteSchema>;
export function readRedNotes(value:unknown):RedNote[]{return z.object({notes:z.array(noteSchema)}).parse(value).notes;}
export function readRedNotesV2(value:unknown):RedNote[]{return z.object({items:z.array(z.object({model_type:z.string().optional(),note:noteSchema.optional()}))}).parse(value).items.flatMap(item=>item.note?[item.note]:[]);}
export function redNoteQueries(i:Intent):string[]{
 const family=intentFamily(i),city=cityNames(i.location)[0];const zh:Record<string,string>={Shanghai:'上海',Beijing:'北京',Shenzhen:'深圳'};const place=city?zh[city]||city:i.location;
 if(family==='translation')return [(place+' AI 翻译 招募').trim(),((i.industry==='Finance'?'金融 ':'')+'AI 翻译 兼职 需求').trim()];
 if(family==='fde')return [(place+' AI FDE 招聘').trim(),(place+' AI 解决方案 招募').trim()];
 if(family==='creative')return [(place+' AI 内容 需求').trim(),'AI 内容 兼职 招募'];
 if(family==='evaluation')return [(place+' AI 评估 招募').trim(),'AI 标注 兼职 招聘'];
 return [(place+' AI '+i.roles.slice(0,2).join(' ')+' 招聘').trim(),'AI 项目 外包 需求'];
}
export function isBuyerDemand(title:string,body:string):boolean{
 const text=title+' '+body;
 if(/求职|找工作|求工作/i.test(title))return false;
 if(/体验官|免费体验|招学员|培训班|教程|手把手|副业分享|副业推荐|搞钱路数|接单中|可接单|承接.{0,12}(?:翻译|业务)|提供.{0,12}翻译服务|信息共享群/i.test(text))return false;
 if(/已招满|招聘结束|停止招募|已结束|no longer accepting|position closed/i.test(text))return false;
 return /招聘|招募|急招|急需|寻找.{0,16}(?:翻译|译员|人才|工程师)|找.{0,10}(?:翻译|译员|开发|工程师)|求.{0,6}(?:翻译|译员)|有偿|预算|hiring|seeking|looking for/i.test(text);
}
export function redNoteUrl(note:RedNote):string{
 const shared=note.mini_program_info?.webpage_url;
 if(shared)try{const u=new URL(shared);if(u.protocol==='https:'&&['www.xiaohongshu.com','xiaohongshu.com'].includes(u.hostname)&&!u.username&&!u.password&&!u.port&&u.pathname.endsWith('/'+note.id))return u.toString();}catch{}
 return 'https://www.xiaohongshu.com/explore/'+note.id;
}
const noteTitle=(note:RedNote)=>note.title?.trim()||note.desc?.trim().split('\n')[0].slice(0,110)||'';
export function normalizeRedNote(note:RedNote,i:Intent,checked=false):Opportunity|null{
 const title=noteTitle(note),body=note.desc?.trim()||'';
 if(!isBuyerDemand(title,body)||!taskMatches({title,summary:body,evidence:body},i,true))return null;
 const url=redNoteUrl(note),facts=extractOpportunityFacts(body,url);
 const worksite=body.match(/(?:工作地点|办公地点|工作城市|项目地点|地点|location)\s*[：:]\s*([^\n。]{1,100})/i)?.[1]||'';
 const cities=cityNames(title+' '+worksite);
 const compensation=sourcePay(title)||sourcePay(body)||body.match(/\d+(?:\s*[-–~至]\s*\d+)?\s*(?:元|[kK万])(?:\s*[\/／每一]\s*(?:小时|天|日|月|字|千字|篇))?/)?.[0]||'Not disclosed';
 const engagement=/实习|internship/i.test(title)?'Internship':/兼职|part.time/i.test(title+' '+body)?'Part-time':/全职|full.time/i.test(title+' '+body)?'Full-time':/按项目|项目制|contract|freelance/i.test(body)?'Project-based':'Unknown';
 const date=note.timestamp?new Date(note.timestamp*1000).toISOString():null;
 return {id:'',title,organization:note.user?.nickname||'Note author',summary:body.slice(0,500),location:cities.join(' / ')||'Unknown',modality:/远程|线上|remote/i.test(body)?'Remote':'Unknown',engagement,compensation,type:'PUBLISHED',source:'Xiaohongshu · Just One API · '+(checked?'note checked':'search excerpt'),url,sources:[url],publishedAt:date,observedAt:new Date().toISOString(),evidence:body.slice(0,2200),why:[],caveat:(checked?'Public note text retrieved.':'Search excerpt only.')+' The author is not independently verified. Confirm the task, budget, work location and availability directly. Author IP location is not used as a worksite.',demo:false,score:0,contact:facts.emails[0]?'mailto:'+facts.emails[0].value:null,nextAction:'Log in to Xiaohongshu manually, then open the original note and message the author.',matchTier:'exact',facts};
}
async function request(endpoint:string,params:Record<string,string>,signal?:AbortSignal):Promise<unknown>{
 const u=new URL('https://api.justoneapi.com'+endpoint);u.search=new URLSearchParams({...params,token:process.env.JUSTONE_API_TOKEN!}).toString();
 let r:Response;try{r=await fetch(u,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(60000),redirect:'error'});}catch{throw new Error('JUSTONE_TIMEOUT_OR_UNAVAILABLE');}
 if(!r.ok)throw new Error('UPSTREAM_HTTP_'+r.status);const d=z.object({code:z.number(),data:z.unknown().optional()}).parse(await r.json());if(d.code!==0)throw new JustOneError(d.code);return d.data;
}

const pending=new Map<string,Promise<Opportunity[]>>();
type Diagnostics={detail:string;status?:'partial'};
const reports=new Map<string,Diagnostics>();let v4UnavailableUntil=0;
const cacheKey=(i:Intent)=>createHash('sha256').update(JSON.stringify({version:'rednote-v3-resilient',queries:redNoteQueries(i),location:i.location,roles:i.roles,aiRequired:i.aiRequired,industry:i.industry,industryRequired:i.industryRequired,contract:i.contract,excludeFullTime:i.excludeFullTime,remote:i.remote,horizon:i.horizon})).digest('hex');
export const xiaohongshuDiagnostics=(i:Intent)=>reports.get(cacheKey(i));
const transient=(e:unknown)=>e instanceof JustOneError?[301,500].includes(e.code):e instanceof z.ZodError||e instanceof Error&&/TIMEOUT|UNAVAILABLE|UPSTREAM_HTTP_5/.test(e.message);
const errorCode=(e:unknown)=>e instanceof JustOneError?'provider code '+e.code:e instanceof z.ZodError?'response format changed':'source unavailable';
export async function searchRedNotes(keyword:string,signal?:AbortSignal):Promise<{notes:RedNote[];route:'V4'|'V2'}>{
 if(Date.now()>=v4UnavailableUntil){
  try{return {notes:readRedNotes(await request('/api/xiaohongshu/search-note/v4',{keyword,page:'1',sortType:'general',timeFilter:'HALF_YEAR'},signal)),route:'V4'};}
  catch(error){if(!transient(error))throw error;v4UnavailableUntil=Date.now()+5*60*1000;}
 }
 let last:unknown;
 for(let attempt=0;attempt<2;attempt++){
  try{return {notes:readRedNotesV2(await request('/api/xiaohongshu/search-note/v2',{keyword,page:'1',sort:'general',noteTime:'HALF_YEAR'},signal)),route:'V2'};}
  catch(error){last=error;if(!transient(error)||signal?.aborted)throw error;}
 }
 throw last;
}
export async function searchXiaohongshu(i:Intent):Promise<Opportunity[]>{
 if(!xiaohongshuConfigured())return [];
 const key=cacheKey(i),file=path.join(process.cwd(),'data','xiaohongshu',key+'.json');
 try{const d=JSON.parse(await readFile(file,'utf8'));if(Date.now()-d.at<(d.diagnostics?.status==='partial'?120000:3600000)){reports.set(key,d.diagnostics);return d.jobs;}}catch{}
 if(pending.has(key))return pending.get(key)!;
 const task=(async()=>{
  const jobs:Opportunity[]=[];const seen=new Set<string>(),routes=new Set<string>(),failures:string[]=[];let details=0,succeeded=0,lastError:unknown;
  const signal=AbortSignal.timeout(75000);
  for(const keyword of redNoteQueries(i)){
   let found:{notes:RedNote[];route:'V4'|'V2'};
   try{found=await searchRedNotes(keyword,signal);succeeded++;routes.add(found.route);}
   catch(error){lastError=error;failures.push(errorCode(error));continue;}
   for(const note of found.notes){
    if(seen.has(note.id)||!isBuyerDemand(noteTitle(note),note.desc||'')||!taskMatches({title:noteTitle(note),summary:note.desc||'',evidence:note.desc||''},i,true))continue;seen.add(note.id);
    let current=note,checked=false;
    if(details<3&&!signal.aborted){details++;try{const full=z.array(noteSchema).parse(await request('/api/xiaohongshu/get-note-detail/v1',{noteId:note.id},signal));const match=full.find(n=>n.id===note.id);if(match){current=match;checked=true;}}catch{}}
    const o=normalizeRedNote(current,i,checked);if(o){o.source+=' · '+found.route;if(failures.length)o.caveat+=' Some search queries were unavailable.';jobs.push(o);}
   }
  }
  if(!succeeded)throw lastError||new Error('JUSTONE_UNAVAILABLE');
  const diagnostics:Diagnostics={detail:'Search '+[...routes].join('/')+' succeeded'+(routes.has('V2')?' using the supported fallback':'')+'.'+(failures.length?' '+failures.length+' query failed ('+failures.join(', ')+'); successful results retained.':''),...(failures.length?{status:'partial' as const}:{})};reports.set(key,diagnostics);
  try{await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify({at:Date.now(),jobs,diagnostics}));}catch{}
  return jobs;
 })();pending.set(key,task);try{return await task;}finally{pending.delete(key);}
}
