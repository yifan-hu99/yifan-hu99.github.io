import type {Intent,Opportunity} from './types';
import {dedupe,qualifies,rank,selectOpportunities} from './search';
import {englishText} from './english';
export type Starter={title:string;prompt:string};
export type DiscoveryRun={intent:Intent;results:Opportunity[];demo?:boolean};
export function historyDiscovery(runs:DiscoveryRun[],closed:string[]=[]){
 const live=runs.filter(r=>!r.demo&&r.intent?.roles?.length);
 const intent=live[0]?.intent;
 const starters:Starter[]=[];
 for(const run of live){const i=run.intent;const role=englishText(i.roles[0],'AI opportunities'),title=[role,i.location&&englishText(i.location,'')].filter(Boolean).join(' · ');if(starters.some(s=>s.title===title))continue;
 const prompt=`Find ${i.aiRequired?'AI-related ':''}${i.roles.map(r=>englishText(r,'AI opportunities')).join(' / ')} opportunities${i.location?' in '+englishText(i.location,'my preferred location'):''}.${i.remote?' Remote only.':''}${i.contract?' Contract or freelance only; no full-time roles.':i.engagementPreference==='freelance'?' Prefer freelance or part-time work.':i.engagementPreference==='full-time'?' Prefer full-time work.':''}${i.industry?' '+(i.industryRequired?'Only':'Prefer')+' '+englishText(i.industry,'my preferred industry')+' opportunities.':''} Include the original posting and how to apply.`;
 starters.push({title,prompt});if(starters.length===3)break;
 }
 const candidates=intent?dedupe(live.flatMap(r=>r.results).filter(o=>!o.demo&&!closed.includes(o.id)&&!!o.url)).filter(o=>qualifies(o,intent)):[];
 return {intent,starters,opportunities:intent?selectOpportunities(rank(candidates,intent)):[]};
}
