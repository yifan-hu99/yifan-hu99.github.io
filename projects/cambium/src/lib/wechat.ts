import {cachePath} from './storage-path';
import {sourcePay} from './compensation';
import {intentFamily,taskMatches} from './intent-relevance';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { Intent, Opportunity } from './types';
import { extractOpportunityFacts } from './opportunity-facts';

export const wechatConfigured=()=>!!process.env.JUSTONE_API_TOKEN && process.env.WECHAT_ENABLED!=='false';
export class JustOneError extends Error {
 code:number; constructor(code:number){super('JUSTONE_'+code);this.code=code;}
}
export function articleText(html:string):string {
 return html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
 .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi,' ')
 .replace(/<\/(?:p|div|section|li|h[1-6])\s*>|<br\s*\/?\s*>/gi,'\n')
 .replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
 .replace(/&#(\d+);/g,(_,n)=>{const c=Number(n);return c>0&&c<=0x10ffff?String.fromCodePoint(c):' ';})
 .replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
export function wechatUrl(value:string):string|null {
 try {
  const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.hostname!=='mp.weixin.qq.com'||u.pathname!=='/s'||u.username||u.password||u.port)return null;
  u.protocol='https:';u.hash='';
  for(const key of [...u.searchParams.keys()])if(!['__biz','mid','idx','sn'].includes(key))u.searchParams.delete(key);
  return u.toString();
 }catch{return null;}
}
const cityAliases:Record<string,string[]>={Shanghai:['Shanghai','上海'],Beijing:['Beijing','北京'],Shenzhen:['Shenzhen','深圳'],Hangzhou:['Hangzhou','杭州'],Guangzhou:['Guangzhou','广州'],London:['London','伦敦']};
export function cityNames(text:string):string[] {
 return Object.entries(cityAliases).filter(([,aliases])=>aliases.some(a=>text.toLowerCase().includes(a.toLowerCase()))).map(([name])=>name);
}
export function wechatQueries(intent:Intent):string[] {
 const family=intentFamily(intent);
 const city=cityNames(intent.location)[0]||intent.location;
 const zh=cityAliases[city]?.[1]||city;
 if(family==='translation'){const ai=intent.aiRequired?'AI ':'';const gig=intent.engagementPreference==='freelance'?'兼职 ':'';return [(zh+' '+ai+'翻译 '+gig+'招募').trim(),(zh+' '+(intent.industry==='Finance'?'金融 ':'')+ai+'翻译 招聘').trim()];}
 if(family==='fde')return [zh+' FDE 招聘',zh+' AI 应用 实施 解决方案 招聘'].map(x=>x.trim());
 if(family==='evaluation')return [zh+' AI 评估 招募',zh+' 大模型 训练 招聘'].map(x=>x.trim());
 if(family==='creative')return [zh+' AI 内容 招聘',zh+' AI 创意 项目 招募'].map(x=>x.trim());
 return [(zh+' '+intent.roles.slice(0,2).join(' ')+' 招聘').trim(),(zh+' AI 应用 招聘').trim()];
}
const itemSchema=z.object({title:z.string(),desc:z.string().optional(),doc_url:z.string(),date:z.number().optional(),timestamp:z.number().optional(),source:z.object({title:z.string()}).optional()});
export type WechatItem=z.infer<typeof itemSchema>;
const searchPayload=z.object({data:z.array(z.object({items:z.array(itemSchema).optional()}))});
export function readWechatItems(value:unknown):WechatItem[] {return searchPayload.parse(value).data.flatMap(g=>g.items||[]);}
export function isRecruitment(title:string,body:string):boolean {
 if(/是什么|揭秘|最紧缺的|一张图|职业趋势|招聘暴涨|人才报告|培训班|零基础怎么|为什么被抢|大厂都在招|招.*最多的不是|招聘指南|岗位分析|岗位解读/.test(title.replace(/\s+/g,'')))return false;
 const call=/招聘|招募|招贤|诚邀加入|诚聘|岗位速递|社招|hiring|open role|vacanc/i.test(title);
 const detail=/工程师|岗位|简历|应聘|投递|工作地点|招聘要求|职位|翻译|译员|译审|本地化|translator|linguist|engineer|apply|requirements/i.test(title+' '+body);
 return call&&detail&&!/招聘已结束|已招满|停止招聘|不再接受|职位已关闭|no longer accepting|position closed/i.test(title+' '+body);
}
function relevant(title:string,body:string,intent:Intent,adjacent:boolean):boolean {return taskMatches({title,summary:body,evidence:body},intent,adjacent);}
function emailIn(text:string):string|null {
 const matches=[...text.matchAll(/[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)];
 return matches.find(m=>/简历|投递|应聘|申请|联系|邮箱|邮件|apply|resume|contact|email/i.test(text.slice(Math.max(0,m.index!-100),m.index!+m[0].length+70)))?.[0]||null;
}
export function normalizeWechatItem(item:WechatItem,intent:Intent,fullText?:string,adjacent=false,html?:string):Opportunity|null {
 const title=articleText(item.title),snippet=articleText(item.desc||''),body=fullText||snippet,url=wechatUrl(item.doc_url);
 if(!url||!isRecruitment(title,body)||!relevant(title,snippet+'\n'+body,intent,adjacent))return null;
 const cities=cityNames(title+' '+snippet);
 if(!cities.length){
  const locationLine=body.match(/(?:工作地点|办公地点|工作城市|工作地|Location)\s*[：:]?\s*([^\n]{1,100})/i)?.[1];
  if(locationLine)cities.push(...cityNames(locationLine));
 }
 const email=emailIn(body+'\n'+snippet);
 const published=item.date||item.timestamp;
 const compensation=sourcePay(title)||sourcePay(body)||sourcePay(snippet)||(body+'\n'+snippet).match(/\d+\s*[-–~至]\s*\d+\s*[kK万](?:\s*[·x×*]\s*\d+\s*薪)?/)?.[0]||'Not disclosed';
 const engagement=/实习|internship/i.test(title)?'Internship':/兼职|part.time/i.test(title)?'Part-time':/全职|full.time/i.test(body)?'Full-time':/项目制|合同制|contract/i.test(body)?'Contract':'Unknown';
 const exact=intentFamily(intent)==='fde'?/fde|forward.?deployed|前沿部署|前线部署/i.test(title+' '+snippet):taskMatches({title,summary:snippet,evidence:body},intent);
 return {id:'',title,organization:articleText(item.source?.title||'Publisher not confirmed'),summary:snippet||body.slice(0,350),location:cities.length?cities.join(' / '):'Unknown',modality:/远程|remote/i.test(body)?'Remote':'Unknown',engagement,compensation,type:'PUBLISHED',source:'WeChat · Just One API'+(fullText?' · article checked':' · search excerpt'),url,sources:[url],publishedAt:published&&Number.isFinite(published)?new Date(published*1000).toISOString():null,observedAt:new Date().toISOString(),evidence:(fullText?body:snippet).slice(0,2200),why:[],caveat:[fullText?'Article text was retrieved through the authorized provider.':'Search excerpt only; full article was not retrieved.',exact?'':'Related implementation role; not an exact FDE title.',cities.length?'Confirm worksite, engagement type and whether the opening is still active.':'Work location is not confirmed in the available evidence.', 'Organization shown is the publishing account; confirm the employing entity in the post.'].filter(Boolean).join(' '),demo:false,score:0,contact:email?'mailto:'+email:null,nextAction:email?'Email your résumé to the address published in this recruitment post.':'Open the original recruitment post for application instructions.',matchTier:exact?'exact':'adjacent',facts:extractOpportunityFacts(body+'\n'+snippet,url,html)};
}
function acceptable(o:Opportunity,i:Intent):boolean {
 const wanted=cityNames(i.location)[0]||i.location;
 if(wanted&&o.location!=='Unknown'&&!o.location.toLowerCase().includes(wanted.toLowerCase()))return false;
 if(i.excludeFullTime&&/full.time/i.test(o.engagement))return false;
 if(i.contract&&/full.time|internship/i.test(o.engagement))return false;
 if(o.publishedAt&&Date.now()-Date.parse(o.publishedAt)>i.horizon*86400000)return false;
 return true;
}
const pending=new Map<string,Promise<Opportunity[]>>();
const memory=new Map<string,{at:number;jobs:Opportunity[]}>();
async function cached(key:string,fetcher:()=>Promise<Opportunity[]>):Promise<Opportunity[]>{
 const hash=createHash('sha256').update(key).digest('hex').slice(0,24);
 const file=cachePath('wechat',hash+'.json');
 const current=memory.get(hash);if(current&&Date.now()-current.at<3600000)return current.jobs;
 if(pending.has(hash))return pending.get(hash)!;
 const task=(async()=>{
  try{const saved=JSON.parse(await readFile(file,'utf8'));if(Date.now()-saved.at<3600000){memory.set(hash,saved);return saved.jobs as Opportunity[];}}catch{}
  const jobs=await fetcher();const value={at:Date.now(),jobs};memory.set(hash,value);
  try{await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(value));}catch{}
  return jobs;
 })().finally(()=>pending.delete(hash));
 pending.set(hash,task);return task;
}
async function officialRequest(endpoint:string,form:URLSearchParams,post:boolean):Promise<unknown>{
 const url=new URL('https://api.justoneapi.com'+endpoint);
 const fields=new URLSearchParams(form);fields.set('token',process.env.JUSTONE_API_TOKEN!);
 if(!post)url.search=fields.toString();
 let response:Response;
 try{response=await fetch(url,{method:post?'POST':'GET',headers:post?{'Content-Type':'application/x-www-form-urlencoded'}:{},body:post?fields:undefined,signal:AbortSignal.timeout(60000),redirect:'error'});}catch{throw new Error('JUSTONE_TIMEOUT_OR_UNAVAILABLE');}
 if(!response.ok)throw new Error('UPSTREAM_HTTP_'+response.status);
 const data=z.object({code:z.number(),data:z.unknown().optional()}).parse(await response.json());
 if(data.code!==0)throw new JustOneError(data.code);
 return data.data;
}
async function articleBody(url:string):Promise<{text:string;html:string}>{
 const raw=await officialRequest('/api/weixin/get-article-detail/v4',new URLSearchParams({articleUrl:url}),false);
 const payload=z.object({data:z.object({html:z.string()})}).parse(raw);
 return {text:articleText(payload.data.html).slice(0,40000),html:payload.data.html};
}
export async function searchWechat(intent:Intent):Promise<Opportunity[]> {
 if(!wechatConfigured())return [];
 const key=JSON.stringify({schema:'wechat-v4-task-relevance',queries:wechatQueries(intent),location:intent.location,roles:intent.roles,contract:intent.contract,excludeFullTime:intent.excludeFullTime,horizon:intent.horizon,roleFamily:intent.roleFamily,aiRequired:intent.aiRequired,industry:intent.industry,engagementPreference:intent.engagementPreference,industryRequired:intent.industryRequired,allowAdjacent:intent.allowAdjacent});
 return cached(key,async()=>{
  const opportunities:Opportunity[]=[];const seen=new Set<string>();let detailsUsed=0;
  const queries=wechatQueries(intent);
  for(let stage=0;stage<queries.length;stage++){
   const data=await officialRequest('/api/weixin/search-article/v2',new URLSearchParams({keyword:queries[stage],subSearchType:'ALL',currentPage:'1',offset:'0'}),true);
   const items=readWechatItems(data);
   const candidates=items.map(item=>({item,op:normalizeWechatItem(item,intent,undefined,stage>0)})).filter((x):x is {item:WechatItem;op:Opportunity}=>!!x.op&&acceptable(x.op,intent));
   candidates.sort((a,b)=>Number(b.op.location!=='Unknown')-Number(a.op.location!=='Unknown')||Number(!!b.op.contact)-Number(!!a.op.contact));
   for(const candidate of candidates){
    if(seen.has(candidate.op.url))continue;seen.add(candidate.op.url);let op=candidate.op;
    if(detailsUsed<3){detailsUsed++;try{const body=await articleBody(op.url);const checked=normalizeWechatItem(candidate.item,intent,body.text,stage>0,body.html);if(!checked||!acceptable(checked,intent))continue;op=checked;}catch(error){if(error instanceof JustOneError&&[100,600,601,602].includes(error.code))op.caveat+=' Full-article access unavailable (provider code '+error.code+').';}}
    opportunities.push(op);
    if(opportunities.filter(o=>o.location!=='Unknown').length>=8)break;
   }
   if(opportunities.filter(o=>o.location!=='Unknown').length>=3)break;
  }
  return opportunities;
 });
}
