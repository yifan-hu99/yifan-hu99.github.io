'use client';
import { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, Globe2, Loader2 } from 'lucide-react';
import type {Starter} from '@/lib/discovery-history';
import type { Opportunity } from '@/lib/types';
import OpportunityBriefPanel from '@/components/opportunity-brief';
import { buildOpportunityBrief } from '@/lib/opportunity-brief';

export default function DiscoverPreview({onStarters}:{onStarters?:(starters:Starter[])=>void}) {
 const [selected,setSelected]=useState<Opportunity>();const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(selected&&!dialog.current?.open)dialog.current?.showModal();if(!selected&&dialog.current?.open)dialog.current.close();},[selected]);
 const [personalized,setPersonalized]=useState(false);
 const [items,setItems]=useState<Opportunity[]>([]);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/discover',{signal:controller.signal}).then(async response=>{
   if(!response.ok)throw new Error('Unavailable');
   const data=await response.json();setItems(data.opportunities);setPersonalized(!!data.personalized);onStarters?.(data.starters||[]);setState('ready');
  }).catch(()=>{if(!controller.signal.aborted)setState('error');});
  return()=>controller.abort();
 },[onStarters]);
 return <section className="home-discovery" aria-label="Real opportunities">
  <div className="discovery-heading"><h2>{personalized?'Based on your recent searches':'Real opportunities to explore'}</h2><span><i/>{personalized?'Previously found':'From Remotive'}</span></div>
  {state==='loading'?<div className="discovery-empty" role="status"><Loader2 size={15} className="spin"/>Loading real opportunities…</div>:items.length?<div className="home-opportunities">{items.map(o=><article className="home-opportunity" key={o.id}><a className="home-preview-link" href={o.url} target="_blank" rel="noopener noreferrer">
   <div className="preview-company"><span>{o.organization.slice(0,1)}</span>{o.organization}<ArrowUpRight size={15}/></div>
   <h3>{o.title}</h3>
   <p className="preview-location" title={o.location}><Globe2 size={12}/><span>{o.location}</span></p>
   <div className="preview-terms"><span>{o.engagement}</span><strong>{o.compensation==='Not disclosed'?'Pay not disclosed':o.compensation}</strong></div>
   <div className="preview-source"><span>{o.source}</span><span>{o.publishedAt?'Posted '+new Date(o.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'Posting date unavailable'}</span></div>
  </a><button className="home-brief-button" onClick={()=>setSelected(o)}>View details <ArrowUpRight size={12}/></button></article>)}</div>:<div className="discovery-empty">{state==='error'?'Live listings are unavailable right now.':personalized?'No matching recent results in your search history.':'No recent AI listings are available from this source.'} Describe your search below to explore.</div>}
  
 <dialog ref={dialog} className="opportunity-detail-dialog" aria-label="Full opportunity details" onClose={()=>setSelected(undefined)}><button className="icon-button modal-close" aria-label="Close opportunity details" onClick={()=>setSelected(undefined)}>×</button>{selected&&<><p className="eyebrow">{selected.organization}</p><h2>{selected.title}</h2><OpportunityBriefPanel o={selected} brief={selected.brief||buildOpportunityBrief(selected,selected.matchContext)}/></>}</dialog>
 </section>;
}
