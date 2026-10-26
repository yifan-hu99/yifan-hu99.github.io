import type { ReactNode } from 'react';
import type { LibraryItem, Opportunity, OpportunityBrief } from '@/lib/types';
import { buildOpportunityBrief } from '@/lib/opportunity-brief';
import { detailLines,shortDetail,usableDetail } from '@/lib/opportunity-summary';
const formatDate=(v:string|null)=>v&&Number.isFinite(Date.parse(v))?new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):null;
const stages:Record<string,string>={SAVED:'Saved',CONTACTED:'Contacted',WAITING:'Awaiting reply',IN_PROGRESS:'In progress',WON:'Completed',CLOSED:'Closed'};
function Source({url,label='Original posting'}:{url:string|null;label?:string}){return url?<a href={url} target="_blank" rel="noopener noreferrer" className="brief-source-link">{label} ↗</a>:null;}
function Lines({items}:{items:string[]}){const values=detailLines(items);return values.length?<ul className="brief-list">{values.map((v,i)=><li key={i}>{v}</li>)}</ul>:null;}
function Row({id,label,preview,group,children}:{id:string;label:string;preview:string;group:string;children:ReactNode}){return <section className="brief-section" data-section={id}><details className="brief-accordion" name={group}><summary><h4>{label}</h4><span className="brief-preview">{shortDetail(preview)}</span><span className="brief-chevron" aria-hidden="true">⌄</span></summary><div className="brief-content">{children}</div></details></section>;}
export default function OpportunityBriefPanel({o,brief,tracking}:{o:Opportunity;brief?:OpportunityBrief;tracking?:LibraryItem}){
 const b=brief||o.brief||buildOpportunityBrief(o,o.matchContext),group='brief-'+o.id;
 const responsibilities=detailLines(b.whyThis.responsibilities),requirements=detailLines(b.conditions.requirements),restrictions=detailLines(b.conditions.restrictions);
 const work=responsibilities[0]||(usableDetail(b.whyThis.description)?b.whyThis.description:'Work scope needs confirmation');
 const matches=detailLines(b.whyYou.matches).filter(v=>!/^Search focus:|^Location preference:/i.test(v));
 const fit=b.whyYou.profileUsed?(matches.find(v=>/^Confirmed skills/i.test(v))||matches[0]||'Skill fit needs confirmation'):'Personal fit not assessed';
 const published=formatDate(b.whyNow.publishedAt),deadline=usableDetail(b.whyNow.deadline)?b.whyNow.deadline:null;
 const conditions=[['Pay',b.conditions.compensation],['Location',b.conditions.location],['Engagement',b.conditions.engagement],['Work arrangement',b.conditions.modality]].filter(([,v])=>usableDetail(v));
 const unknown=['pay','location','engagement','work arrangement'].filter((_,i)=>!usableDetail([b.conditions.compensation,b.conditions.location,b.conditions.engagement,b.conditions.modality][i]));
 const terms=conditions.length?conditions.map(([,v])=>v).join(' · '):'Pay & terms unconfirmed';
 const contact=b.contactRoutes,contactSummary=contact.emails[0]?.value||(contact.application?'Application link available':contact.original?'Original posting available':'No verified contact route');
 const next=b.nextAction,channel=next.channel==='Open the original posting to confirm how to apply'?'Check original posting to apply':next.channel;
 return <div className="opportunity-brief brief-compact" aria-label="Six-part opportunity brief">
  <Row id="why-this" label="Why this" preview={work} group={group}>
   <Lines items={responsibilities.slice(0,2)}/>{usableDetail(b.whyThis.evidence)&&<blockquote>{b.whyThis.evidence}</blockquote>}<Source url={b.whyThis.sourceUrl}/><p className="brief-muted">{o.demo?'Fictional demo.':'Source claim; availability needs confirmation.'}</p>
  </Row>
  <Row id="why-you" label="Why you" preview={fit} group={group}>
   <Lines items={matches}/>{b.whyYou.profileUsed?<Lines items={b.whyYou.gaps.slice(0,2)}/>:<p>Confirm your skills to assess personal fit.</p>}
  </Row>
  <Row id="why-now" label="Why now" preview={[published?'Posted '+published:'',deadline?'Deadline '+deadline:''].filter(Boolean).join(' · ')||'Timing unconfirmed'} group={group}>
   {usableDetail(b.whyNow.businessSignal)&&<p>{b.whyNow.businessSignal}</p>}<Source url={b.whyThis.sourceUrl} label="Check current availability"/>
  </Row>
  <Row id="conditions" label="Practical details" preview={terms} group={group}>
   {conditions.length>0&&<dl className="brief-fields">{conditions.map(([label,value])=><div className="brief-field-pair" key={label}><dt>{label}</dt><dd className={label==='Pay'?'brief-compensation':undefined}>{value}</dd></div>)}</dl>}
   {requirements.length>0&&<><strong className="brief-subheading">Requirements</strong><Lines items={requirements.slice(0,3)}/></>}{restrictions.length>0&&<><strong className="brief-subheading">Restrictions</strong><Lines items={restrictions.slice(0,2)}/></>}
   {unknown.length>0&&<p className="brief-muted">Not confirmed: {unknown.join(', ')}.</p>}<Source url={contact.original}/>
  </Row>
  <Row id="contact-routes" label="Contact routes" preview={contactSummary} group={group}>
   {usableDetail(contact.publisher)&&<p>{contact.publisher}</p>}<Source url={contact.original}/>{contact.website&&<Source url={contact.website.url} label="Website"/>}{contact.application&&<Source url={contact.application.url} label="Apply"/>}{contact.person&&<p>{contact.person}</p>}
   {contact.emails.map(e=><div className="brief-email" key={e.value}><a href={'mailto:'+e.value}>{e.value}</a> <Source url={e.sourceUrl} label="Source"/></div>)}
  </Row>
  <Row id="next-action" label="Next action" preview={channel} group={group}>
   <p>{next.person} · {channel}</p><span className="brief-status">{tracking?stages[tracking.status]||tracking.status:'Not contacted'}</span><Lines items={next.prepare.slice(0,2)}/>
   <details className="brief-message-details"><summary>Suggested message</summary><p className="brief-message">{next.message}</p></details><p className="brief-muted">Suggested follow-up: 3–5 business days after applying.</p>
   {tracking?.events[0]&&<p className="brief-latest">{tracking.events[0].detail} · {formatDate(tracking.events[0].createdAt)}</p>}
  </Row>
 </div>;
}
