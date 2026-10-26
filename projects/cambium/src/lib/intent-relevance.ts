import type {Intent,Opportunity} from './types';
export type RoleFamily='translation'|'fde'|'evaluation'|'creative'|'engineering';
export function detectRoleFamily(text:string):RoleFamily|undefined {
 if(/翻译|译员|口译|笔译|同传|传译|本地化|译审|interpret(?:er|ing|ation)|translation|translat(?:or|ing|e)|locali[sz]ation|linguist|bilingual.{0,15}(?:review|edit)/i.test(text))return 'translation';
 if(/\bfde\b|forward.?deployed|前沿部署|前线部署|落地|实施/i.test(text))return 'fde';
 if(/evaluat|评估|训练|model.training/i.test(text))return 'evaluation';
 if(/creative|创意|content|内容/i.test(text))return 'creative';
 if(/engineer|developer|工程师|开发/i.test(text))return 'engineering';
 return undefined;
}
export const intentFamily=(i:Intent):RoleFamily|undefined=>i.roleFamily||detectRoleFamily(i.query.split(';').at(-1)||'')||detectRoleFamily(i.roles.join(' '));
export const hasAI=(text:string)=>/\bAI\b|artificial intelligence|machine.learning|\bLLMs?\b|large.language.model|人工智能|大模型|智能体|生成式|机器学习/i.test(text);
export const hasFinance=(text:string)=>/financ|fintech|banking|investment|securities|金融|财经|证券|银行|投研|投资/i.test(text);
export const hasFreelance=(text:string)=>/freelance|contract|part.time|gig|project.based|兼职|零工|项目制|合同制|外包|自由职业|按篇|按字|稿酬/i.test(text);
export function taskMatches(o:Pick<Opportunity,'title'|'summary'|'evidence'>,i:Intent,adjacent=false):boolean {
 const text=[o.title,o.summary,o.evidence].join(' ');const family=intentFamily(i);
 if(family==='translation'){
  const task=/翻译|译员|口译|笔译|同传|传译|译审|译后编辑|本地化|interpret(?:er|ing|ation)|translat(?:ion|or|ing|e)|locali[sz]ation|linguist/i;
  const engineer=/\bfde\b|forward.?deployed|前沿部署|前线部署|engineer|developer|algorithm|工程师|开发|算法/i.test(o.title);
  if(engineer&&!/译员|译审|译后编辑|翻译审校|翻译人员|translator|linguist|interpreter/i.test(o.title))return false;
  const titleTask=task.test(o.title)&&!/(?:翻译|translation).{0,15}(?:公司|有限公司|co\.|ltd|company)/i.test(o.title);
  const actualTask=titleTask||/(?:负责|工作内容|岗位职责|任务|需求|项目)[^\n。]{0,60}(?:翻译|译审|译后编辑|本地化)|(?:translate|translation|locali[sz]ation)[^.!\n]{0,60}(?:content|documents|texts|review|project|work)/i.test(o.summary+' '+o.evidence);
  return actualTask&&(!i.aiRequired||hasAI(text));
 }
 if(family==='fde')return /\bfde\b|forward.?deployed|前沿部署|前线部署/i.test(text)||(adjacent&&hasAI(text)&&/实施|解决方案|应用工程师|客户交付|solutions engineer|implementation engineer/i.test(text));
 if(family==='evaluation')return /evaluat|评估|训练|model.training/i.test(text);
 if(family==='creative')return /creative|content|创意|内容|文案/i.test(text);
 if(family==='engineering')return /engineer|developer|algorithm|工程师|开发|算法/i.test(o.title);
 return i.roles.some(r=>!/^AI$/i.test(r)&&text.toLowerCase().includes(r.toLowerCase()))||i.roles.every(r=>/^AI|machine learning$/i.test(r))&&hasAI(text);
}
