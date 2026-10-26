import {hasFinance,hasFreelance} from './intent-relevance';
import {englishText} from './english';
import type { Intent, Opportunity, OpportunityBrief, ProfileData } from './types';
import { extractOpportunityFacts,publicLink } from './opportunity-facts';
const known=(s:string)=>!!s&&!/^(Unknown|Not disclosed|Not confirmed)$/i.test(s);
const skillTerms=['Python','TypeScript','JavaScript','Java','Go','Rust','SQL','Docker','Kubernetes','React','LangChain','RAG','LLM','客户交付','项目管理','数据分析'];
function contains(text:string,term:string){return /^[a-z0-9 ]+$/i.test(term)?new RegExp('\\b'+term+'\\b','i').test(text):text.toLowerCase().includes(term.toLowerCase());}
export function buildOpportunityBrief(o:Opportunity,intent?:Intent,profile?:ProfileData|null,at=Date.now()):OpportunityBrief {
 const facts=o.facts||extractOpportunityFacts(o.evidence+'\n'+o.summary,o.url);
 const source=publicLink(o.url);const evidence=[o.evidence,o.summary].join('\n');
 const published=o.publishedAt&&Number.isFinite(Date.parse(o.publishedAt))?o.publishedAt:null;
 const age=published?Math.max(0,Math.floor((at-Date.parse(published))/86400000)):null;
 const profileUsed=!!profile?.useForMatching;
 const skills=profileUsed?profile!.skills.split(/[,，;；\n]/).map(s=>s.trim()).filter(Boolean):[];
 const matched=skills.filter(s=>contains(evidence,s));
 const required=skillTerms.filter(s=>contains(facts.requirements.join(' '),s));
 const unverified=required.filter(s=>!skills.some(k=>k.toLowerCase()===s.toLowerCase()));
 const matches:string[]=[];
 if(intent?.industry==='Finance')matches.push(hasFinance(evidence)?'Finance-sector work is mentioned in the source.':'Finance-sector fit is not confirmed.');
 if(intent?.engagementPreference==='freelance')matches.push(hasFreelance(evidence+' '+o.engagement)?'Freelance, contract or part-time work is supported by the source.':'Freelance availability is not confirmed.');
 if(intent?.roles?.length)matches.push('Search focus: '+intent.roles.map(r=>englishText(r,'Your requested role')).join(' / ')+(o.matchTier==='adjacent'?'; this is an adjacent role. Check differences in responsibilities.':'.'));
 if(intent?.location)matches.push('Location preference: '+englishText(intent.location,'Your requested location')+'; source location: '+(known(o.location)?o.location:'location not disclosed')+'. ');
 if(profileUsed&&matched.length)matches.push('Confirmed skills also mentioned in the source: '+matched.map(s=>englishText(s,'confirmed skill')).join(', ')+'. This does not verify years of experience or proficiency.');
 if(profileUsed&&!matched.length)matches.push('No confirmed skills in your authorized profile directly match the source requirements yet.');
 const gaps=profileUsed
  ? [unverified.length?'Source skills to verify: '+unverified.map(s=>englishText(s,'source skill')).join(', ')+'. Missing profile evidence does not mean you lack these skills; check which requirements are optional.':'Education, years of experience and project outcomes still need to be checked against the source.',...facts.requirements.slice(0,2).map(r=>'Source requirement: '+r)]
  : ['No confirmed profile is authorized for matching yet. Personal skills and experience cannot be assessed.','Confirm your skills, real projects and experience before assessing strengths and gaps.'];
 if(!intent?.roles?.length)matches.unshift('No personal search goal has been provided. These are public opportunities.');
 const email=facts.emails[0]?.value||(o.contact?.startsWith('mailto:')?o.contact.slice(7):null);
 const application=facts.application||(o.contact&&!o.contact.startsWith('mailto:')&&publicLink(o.contact)?{url:o.contact,label:'Application page provided by source',sourceUrl:o.url}:null);
 const person=facts.contactName||(o.source.startsWith('Xiaohongshu')?'Note author':'Hiring team (name not disclosed)');
 const channel=email?'Email: '+email:application?'Application link in source':o.source.startsWith('Xiaohongshu')?'Log in to Xiaohongshu manually, then open the original note and message the author.':'Open the original posting to confirm how to apply';
 const message='Hello, I saw your posting for "'+o.title+'" and would like to learn more and apply. '+(profile?.useForDrafts&&profile.skills?'My relevant skills include '+englishText(profile.skills,'[Add your relevant skills in English]')+'. ':'')+'[Add one real, verifiable example of a relevant project.] Is this role still open, and what should I prepare for the next step?';
 return {
  version:1,
  whyThis:{description:o.summary||'Check the original posting for the full requirements.',responsibilities:facts.responsibilities,evidence:(o.evidence||o.summary).slice(0,300),sourceUrl:source,evidenceLevel:o.demo?'Fictional demo data':o.source.includes('note checked')?'Public project-request note retrieved':o.source.includes('article checked')?'Recruitment article retrieved':o.source==='Remotive'?'Job API source excerpt':'Search snippet only; full source not retrieved',uncertainty:o.caveat},
  whyYou:{basis:profileUsed?'Based on your confirmed, authorized skills and current search preferences.':'Only search preferences can be compared; personal fit has not been assessed.',matches,gaps,profileUsed},
  whyNow:{publishedAt:published,observedAt:o.observedAt||null,deadline:facts.deadline,reason:o.demo?'Demo data does not represent an active hiring window.':age===null?'The publication date is unconfirmed. Check that the posting is still active before acting.':age<=30?'This public posting was published within the last '+age+' days. Check whether applications are still accepted.':'This posting is approximately '+age+' days old. Confirm that the role is still open.',businessSignal:facts.businessSignal,uncertainty:facts.deadline?'The deadline comes from the source. Confirm any extension or early closure.':'The source provides no confirmed deadline; urgency is not inferred.'},
  conditions:{compensation:known(o.compensation)?o.compensation:'Not disclosed',location:known(o.location)?o.location:'Not disclosed',engagement:known(o.engagement)?o.engagement:'Not disclosed; a preference does not establish full-time employment',modality:known(o.modality)?o.modality:'Not disclosed',requirements:facts.requirements,restrictions:facts.restrictions},
  contactRoutes:{website:facts.website,original:source,application,person:facts.contactName,emails:email&&facts.emails.length===0?[{value:email,sourceUrl:o.url,evidence:'Application email previously extracted from the source; check the original posting again.'}]:facts.emails,provenance:'Contact details come only from the recruitment source. Emails and websites are never inferred from domains.',publisher:o.organization},
  nextAction:{person,channel,message,prepare:['Check that the role is open, the hiring entity, and the actual work location.','Prepare an updated resume and one verifiable relevant project example.','Follow source instructions for the email subject, attachments or form. Review before sending.'],followUp:'Suggestion: mark Contacted after applying. If there is no reply after 3–5 business days, follow up once. This is a suggested cadence, not an employer commitment.'}
 };
}
