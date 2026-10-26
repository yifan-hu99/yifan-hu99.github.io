import type { OpportunityFacts } from './types';
export function publicLink(value:string):string|null {
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||u.hostname.includes(':')||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)||/\.(local|internal)$/.test(u.hostname))return null;return u.toString();}catch{return null;}
}
const textOnly=(s:string)=>s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<\/(?:p|div|section|li)>|<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/[ \t]+/g,' ').trim();
export function extractOpportunityFacts(text:string,sourceUrl:string,html?:string):OpportunityFacts {
 const body=textOnly(text);const lines=body.split(/\n+|[。；;]+|(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=4&&x.length<=500);
 const unique=(items:string[],n:number)=>[...new Set(items)].slice(0,n).map(x=>x.length>180?x.slice(0,180)+'…':x);
 const requirements=unique(lines.filter(s=>/熟悉|熟练|掌握|学历|本科|硕士|博士|工作经验|年.{0,5}经验|years?.{0,20}experience|experience.{0,20}(with|in)|proficien|required|must have/i.test(s)),5);
 const responsibilities=unique(lines.filter(s=>/负责|搭建|部署|实施|交付|客户.{0,15}(需求|场景)|responsib|you will|build|deploy|implement/i.test(s)),4);
 const restrictions=unique(lines.filter(s=>/出差|签证|国籍|工作许可|时区|必须到岗|on.site|travel|visa|citizenship|work authori|timezone/i.test(s)),3);
 const deadline=body.match(/(?:截止(?:日期|时间)?|申请截至|报名截至|deadline)\s*[：:]?\s*((?:20\d{2}[年/-])?\d{1,2}[月/-]\d{1,2}日?(?:[ T]\d{1,2}:\d{2})?)/i)?.[1]||null;
 const name=body.match(/(?:联系人|招聘联系人|Contact person)\s*[：:]\s*([^\n，,。；;：:<>]{2,35})/i)?.[1]?.trim()||null;
 const contactName=name&&!/@|https?:/i.test(name)?name:null;
 const emails=[...body.matchAll(/[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)].filter(m=>/简历|投递|应聘|申请|联系|邮箱|邮件|apply|resume|contact|email/i.test(body.slice(Math.max(0,m.index!-100),m.index!+m[0].length+70))).map(m=>({value:m[0],sourceUrl,evidence:body.slice(Math.max(0,m.index!-55),m.index!+m[0].length+65).trim()})).filter((m,i,a)=>a.findIndex(x=>x.value===m.value)===i).slice(0,3);
 let website:OpportunityFacts['website']=null,application:OpportunityFacts['application']=null;
 if(html)for(const match of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const url=publicLink(match[1].replace(/&amp;/g,'&'));const label=textOnly(match[2]);if(!url||url===sourceUrl)continue;
  if(!website&&/官网|官方网站|公司网站|official website|company website/i.test(label))website={url,label:label||'原文标注官网',sourceUrl};
  if(!application&&(/申请|应聘|投递|apply now|apply here|submit.*resume/i.test(label)||/\/(careers?|jobs?|apply|recruit|positions?)(\/|\?|$)/i.test(new URL(url).pathname)))application={url,label:label||'原文申请入口',sourceUrl};
 }
 const businessSignal=unique(lines.filter(s=>/新团队|新产品|新项目|扩招|新增岗位|近期启动|new team|new project|expanding.{0,20}team/i.test(s)),1)[0]||null;
 return {requirements,responsibilities,restrictions,deadline,contactName,emails,website,application,businessSignal};
}
