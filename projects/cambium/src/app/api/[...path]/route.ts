import {historyDiscovery} from '@/lib/discovery-history';
import { englishOpportunity } from '@/lib/english-opportunity';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import mammoth from 'mammoth';
import { parsePdf } from '@/lib/resume';
import { buildOpportunityBrief } from '@/lib/opportunity-brief';
import { publicLink } from '@/lib/opportunity-facts';
import { db } from '@/lib/db';
import { guard, requestOwner, ApiError } from '@/lib/security';
import { plan, search, sourceHealth, rank, searchSummary, remotive, dedupe, qualifies, extractIntent } from '@/lib/search';
import { statuses, type Intent, type Opportunity, type ChatMessage, type ProfileData } from '@/lib/types';
export const runtime='nodejs';
export const maxDuration=300;
export const dynamic='force-dynamic';
const json=(v:unknown)=>JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
const profileSchema=z.object({name:z.string().max(200),location:z.string().max(300),skills:z.string().max(5000),preferences:z.string().max(5000),portfolio:z.string().max(1000),useForMatching:z.boolean(),useForDrafts:z.boolean()});
async function withBrief(o:Opportunity,p:ProfileData,intent?:Intent):Promise<Opportunity> {if(/^Recruitment opportunity$/i.test(o.title)){const original=await db.opportunity.findUnique({where:{id:o.id}});if(original&&(original.payload as Opportunity).title!==o.title)o={...o,...original.payload as Opportunity};}const translated=await englishOpportunity(o);return {...translated,brief:buildOpportunityBrief(translated,intent||o.matchContext,p)};}
function fail(e:unknown) { if(e instanceof ApiError) return NextResponse.json({error:{code:e.code,message:e.message}},{status:e.status}); if(e instanceof z.ZodError || e instanceof SyntaxError) return NextResponse.json({error:{code:'INVALID_INPUT',message:'Please check your input and try again.'}},{status:400}); console.error('API request failed:',e instanceof Error?e.name:'Unknown'); return NextResponse.json({error:{code:'SERVER_ERROR',message:'The request could not be completed. Please retry.'}},{status:500}); }
async function handle(req:NextRequest,ctx:{params:Promise<{path:string[]}>}) {
 try {
  const requested=(await ctx.params).path.join('/');
  if(requested==='health'&&req.method==='GET'){try{await db.$queryRaw`SELECT 1`;return NextResponse.json({status:'ok'});}catch{return NextResponse.json({status:'unavailable'},{status:503});}}
  guard(req);
  const ownerId=requestOwner(req);
  async function profile(){ return db.profile.upsert({where:{id:ownerId},create:{id:ownerId},update:{}}); }
async function onboarding() {
 const p=await profile();const complete=p.onboardingCompleted&&p.useForMatching&&!!p.skills.trim();
 return {complete,requiredForNewChat:!complete&&(await db.conversation.count({where:{ownerId}}))>0};
}
async function libraryItems(){
 const [items,p]=await Promise.all([db.libraryItem.findMany({where:{ownerId},include:{opportunity:true,events:{orderBy:{createdAt:'desc'}}},orderBy:{updatedAt:'desc'}}),profile()]);
 return Promise.all(items.map(async item=>({...item,opportunity:{...item.opportunity,payload:await withBrief(item.opportunity.payload as Opportunity,p)}})));
}

  const p=(await ctx.params).path; const route=p.join('/'); const method=req.method;
  if(route==='app-version'&&method==='GET')return NextResponse.json({version:process.env.NEXT_PUBLIC_CAMBIUM_VERSION||'development'},{headers:{'Cache-Control':'no-store, max-age=0'}});
  if(route==='state' && method==='GET') return NextResponse.json({conversations:await db.conversation.findMany({where:{ownerId},orderBy:{updatedAt:'desc'},select:{id:true,title:true}}),profile:await profile(),library:await libraryItems(),onboarding:await onboarding(),resumes:await db.resume.findMany({where:{ownerId},select:{id:true,filename:true,createdAt:true}}),sources:sourceHealth(),defaultDemo:process.env.DEMO_MODE!=='false'});
  if(route==='discover' && method==='GET') {
   const [runs,closed]=await Promise.all([db.searchRun.findMany({where:{conversation:{ownerId}},orderBy:{createdAt:'desc'},take:30}),db.libraryItem.findMany({where:{ownerId,status:'CLOSED'},select:{opportunityId:true}})]);
   const history=historyDiscovery(runs.map(r=>({intent:r.intent as Intent,results:r.results as Opportunity[],demo:JSON.stringify(r.report).includes('"id":"Demo"')})),closed.map(c=>c.opportunityId));
   if(history.intent){const currentProfile=await profile();const opportunities=await Promise.all(history.opportunities.map(o=>withBrief(o,currentProfile,history.intent)));return NextResponse.json({opportunities,starters:history.starters,personalized:true,source:'Based on recent searches'},{headers:{'Cache-Control':'no-store'}});}

   if(!remotive.isConfigured())throw new ApiError(503,'SOURCE_DISABLED','Live listings are unavailable.');
   try{
    const intent=extractIntent('Find remote AI engineer opportunities');
    const opportunities=await Promise.all(rank(dedupe(await remotive.search(intent)).filter(o=>qualifies(o,intent)),intent).slice(0,3).map(o=>withBrief(o,{} as ProfileData,intent)));
    return NextResponse.json({opportunities,source:'Remotive'},{headers:{'Cache-Control':'no-store'}});
   }catch{throw new ApiError(503,'SOURCE_UNAVAILABLE','Live listings are unavailable right now.');}
  }
  if(route==='source-health' && method==='GET') return NextResponse.json(sourceHealth());
  if(p[0]==='conversations') {
   if(p.length===1 && method==='GET') return NextResponse.json(await db.conversation.findMany({where:{ownerId},orderBy:{updatedAt:'desc'}}));
   if(p.length===2 && method==='GET') { const c=await db.conversation.findUnique({where:{id:p[1],ownerId},include:{messages:{orderBy:{createdAt:'asc'}},runs:{orderBy:{createdAt:'desc'},take:1}}}); if(!c) throw new ApiError(404,'NOT_FOUND','Conversation not found.'); const currentProfile=await profile();for(const m of c.messages){const b=m.blocks as ChatMessage['blocks'];if(b.opportunities){const original=b.intent||c.intent as Intent;const messageIntent=extractIntent(original.query?.split(';').at(-1)||'',original);const matched=b.opportunities.filter(o=>qualifies(o,messageIntent));if(matched.length!==b.opportunities.length)m.text='Previous results did not match this request and have been hidden. Search again to get relevant opportunities.';b.intent=messageIntent;b.opportunities=await Promise.all(matched.map(o=>withBrief(o,currentProfile,messageIntent)));}} return NextResponse.json(c); }
   if(p.length===2 && method==='DELETE') {await db.conversation.deleteMany({where:{id:p[1],ownerId}}); return NextResponse.json({ok:true});}
  }
  if(route==='chat' && method==='POST') {
   const body=z.object({message:z.string().trim().min(2).max(4000),conversationId:z.string().optional(),demo:z.boolean()}).parse(await req.json());
   if(!body.conversationId&&(await onboarding()).requiredForNewChat)throw new ApiError(403,'PROFILE_REQUIRED','Confirm your skills and add a resume or portfolio before starting a new chat. You can keep asking questions in the current chat.');
   let c=body.conversationId ? await db.conversation.findUnique({where:{id:body.conversationId,ownerId}}) : null;
   if(body.conversationId && !c) throw new ApiError(404,'NOT_FOUND','Conversation not found.');
   const old=c?.intent as Intent|undefined;
   if(!c) c=await db.conversation.create({data:{ownerId,title:body.message.slice(0,55),intent:{}}});
   const conversation=c;
   await db.message.create({data:{conversationId:c.id,role:'user',text:body.message,blocks:{}}});
   const stream=new ReadableStream({async start(controller) {
    const emit=(v:unknown)=>{try{controller.enqueue(new TextEncoder().encode(JSON.stringify(v)+'\n'));}catch{}};
    emit({type:'conversation',id:conversation.id,title:conversation.title}); emit({type:'phase',text:'Understanding your goal'});
    try {
     const planned=body.demo?{intent:extractIntent(body.message,old?.roles?old:undefined)}:await plan(body.message,old?.roles?old:undefined); const intent=planned.intent;
     await db.conversation.update({where:{id:conversation.id},data:{intent:json(intent)}});
     emit({type:'phase',text:body.demo?'Loading clearly labeled demo examples':'Searching available sources'});
     const result=await search(intent,body.demo,await profile());
     if(planned.warning) result.report.push({id:'Planner',status:'degraded',detail:planned.warning});
     const closed=await db.libraryItem.findMany({where:{ownerId,status:'CLOSED'},select:{opportunityId:true}});
     result.opportunities=result.opportunities.map(o=>({...o,id:ownerId+':'+o.id}));
     result.opportunities=result.opportunities.filter(o=>!closed.some(x=>x.opportunityId===o.id));
     emit({type:'phase',text:'Preparing English opportunity briefs'});
     const currentProfile=await profile();const presented=await Promise.all(result.opportunities.map(o=>withBrief(o,currentProfile,intent)));
     emit({type:'phase',text:'Checking constraints, evidence and fit'});
     const text=searchSummary(result,body.demo);
     await db.$transaction(async tx=>{
      for(const o of result.opportunities) await tx.opportunity.upsert({where:{id:o.id},create:{id:o.id,ownerId,payload:json(o)},update:{payload:json(o)}});
      await tx.searchRun.create({data:{conversationId:conversation.id,intent:json(intent),report:json({sources:result.report,metrics:result.metrics}),results:json(result.opportunities)}});
     });
     const message=await db.message.create({data:{conversationId:conversation.id,role:'assistant',text,blocks:json(result)}});
     emit({type:'result',message:{...message,blocks:{...result,opportunities:presented}}});
    } catch { const message=await db.message.create({data:{conversationId:conversation.id,role:'assistant',text:'This search could not be completed. Your message is saved; please try again.',blocks:{}}}); emit({type:'result',message}); }
    controller.close();
   }});
   return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(p[0]==='search' && p[1] && method==='GET') {const r=await db.searchRun.findFirst({where:{id:p[1],conversation:{ownerId}}}); if(!r) throw new ApiError(404,'NOT_FOUND','Search not found.'); return NextResponse.json(r);}
  if(route==='profile' && method==='GET') return NextResponse.json(await profile());
  if(route==='profile' && method==='PATCH') {
   const data=profileSchema.parse(await req.json());const previous=await profile();
   const evidenceReady=previous.onboardingCompleted||(await db.resume.count({where:{ownerId}}))>0||!!publicLink(data.portfolio);
   const onboardingCompleted=previous.onboardingCompleted||(data.useForMatching&&!!data.skills.trim()&&evidenceReady);
   await db.profile.upsert({where:{id:ownerId},create:{id:ownerId,...data,onboardingCompleted},update:{...data,onboardingCompleted}});
   // Refresh fit explanations inside saved conversations using confirmed profile only.
   const conversations=await db.conversation.findMany({where:{ownerId}});
   for(const c of conversations) { const intent=c.intent as Intent; if(!intent.roles) continue; const messages=await db.message.findMany({where:{conversationId:c.id,role:'assistant'}}); for(const m of messages) { const b=m.blocks as ChatMessage['blocks']; if(b.opportunities) { b.opportunities=rank(b.opportunities,b.intent||intent,data); await db.message.update({where:{id:m.id},data:{blocks:json(b)}}); }}}
   return NextResponse.json({...data,onboardingCompleted});
  }
  if(route==='profile/resume' && method==='POST') {
   const form=await req.formData(); const file=form.get('file');
   if(!(file instanceof File) || !file.size || file.size>5*1024*1024) throw new ApiError(400,'INVALID_FILE','Upload a non-empty PDF, DOCX or TXT file up to 5 MB.');
   const ext=file.name.split('.').pop()?.toLowerCase(); const buffer=Buffer.from(await file.arrayBuffer()); let text='';
   try {
    if(ext==='pdf' && buffer.subarray(0,5).toString()==='%PDF-' && ['application/pdf','application/octet-stream',''].includes(file.type)) text=await parsePdf(buffer);
    else if(ext==='docx' && buffer.subarray(0,2).toString()==='PK' && ['application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/octet-stream',''].includes(file.type)) text=(await mammoth.extractRawText({buffer})).value;
    else if(ext==='txt' && !buffer.includes(0) && ['text/plain','application/octet-stream',''].includes(file.type)) text=buffer.toString('utf8');
    else throw new Error('format');
   } catch(parseError) {console.error('Resume parser:',parseError instanceof Error?parseError.name:'Unknown');throw new ApiError(422,'PARSE_FAILED','Could not read this file. Use a text-based PDF, DOCX or UTF-8 TXT. Scanned PDFs need OCR first.');}
   text=text.trim().slice(0,100000); if(text.length<10) throw new ApiError(422,'NO_TEXT','No readable text found. Try a text-based file.');
   const preview=text.slice(0,15000);
   const r=await db.resume.create({data:{ownerId,filename:file.name.slice(0,200),text,preview}});
   return NextResponse.json({id:r.id,filename:r.filename,preview,suggestedSkills:['Python','TypeScript','React','SQL','AI','FDE','LLM','automation','evaluation','design'].filter(s=>new RegExp('\\b'+s+'\\b','i').test(text)).join(', ')});
  }
  if(p[0]==='profile' && p[1]==='resume' && p[2] && method==='DELETE') {
   await db.resume.deleteMany({where:{id:p[2],ownerId}}); return NextResponse.json({ok:true});
  }
  if(route==='library' && method==='GET') return NextResponse.json(await libraryItems());
  if(route==='library' && method==='POST') {
   const b=z.object({opportunityId:z.string()}).parse(await req.json());
   if(!await db.opportunity.findUnique({where:{id:b.opportunityId,ownerId}})) throw new ApiError(404,'NOT_FOUND','Opportunity not found.');
   return NextResponse.json(await db.libraryItem.upsert({where:{ownerId_opportunityId:{ownerId,opportunityId:b.opportunityId}},create:{ownerId,opportunityId:b.opportunityId,events:{create:{type:'SAVED',detail:'Saved to your Library'}}},update:{}}));
  }
  if(p[0]==='library' && p[1] && method==='PATCH') {
   const b=z.object({status:z.enum(statuses).optional(),notes:z.string().max(10000).optional()}).parse(await req.json());
   const existing=await db.libraryItem.findUnique({where:{id:p[1],ownerId}}); if(!existing) throw new ApiError(404,'NOT_FOUND','Library item not found.');
   return NextResponse.json(await db.libraryItem.update({where:{id:p[1],ownerId},data:{...b,events:{create:{type:b.status||'NOTE',detail:b.status?'You marked this '+b.status.toLowerCase().replaceAll('_',' '):'Updated notes'}}}}));
  }
  if(p[0]==='opportunities' && p[1] && p[2]==='outreach-draft' && method==='POST') {
   const o=await db.opportunity.findUnique({where:{id:p[1],ownerId}}); if(!o) throw new ApiError(404,'NOT_FOUND','Opportunity not found.');
   const previousDraft=await db.outreachDraft.findFirst({where:{ownerId,opportunityId:o.id},orderBy:{createdAt:'desc'}});
   if(previousDraft)return NextResponse.json(previousDraft);
   const pr=await profile();const payload=await withBrief(o.payload as Opportunity,pr);
   const body=payload.brief!.nextAction.message+(pr.useForDrafts&&pr.name?'\n\n'+pr.name:'');
   return NextResponse.json(await db.outreachDraft.create({data:{ownerId,opportunityId:o.id,body}}));
  }
  if(p[0]==='drafts' && p[1] && method==='PATCH') {
   const b=z.object({body:z.string().max(10000).optional(),status:z.enum(['DRAFT','COPIED','USER_CONFIRMED_SENT']).optional()}).parse(await req.json());
   return NextResponse.json(await db.outreachDraft.update({where:{id:p[1],ownerId},data:b}));
  }
  if(route==='privacy' && method==='DELETE') {
   await db.$transaction([db.resume.deleteMany({where:{ownerId}}),db.profile.deleteMany({where:{id:ownerId}}),db.outreachDraft.deleteMany({where:{ownerId}})]); return NextResponse.json({ok:true});
  }
  throw new ApiError(404,'NOT_FOUND','Endpoint not found.');
 } catch(e) { return fail(e); }
}
export const GET=handle; export const POST=handle; export const PATCH=handle; export const DELETE=handle;

