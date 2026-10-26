import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'C:/Users/evely/Documents/Codex/2026-10-24/bu-i/work/browsers/chromium-1248/chrome-win64/chrome.exe'});const p=await b.newPage({viewport:{width:1440,height:1000}});p.setDefaultTimeout(120000);const base='http://127.0.0.1:3000';
const state=await(await p.request.get(base+'/api/state',{timeout:120000})).json();console.log('Opening latest search');
const conversation=await(await p.request.get(base+'/api/conversations/'+state.conversations[0].id,{timeout:180000})).json();
const message=conversation.messages.filter(m=>m.role==='assistant'&&m.blocks?.opportunities?.length).at(-1);const third=message?.blocks.opportunities[2];console.log(JSON.stringify({title:third?.title,compensation:third?.compensation,source:third?.url,finance:third?.brief?.whyYou.matches?.filter(v=>v.includes('Finance'))},null,2));
if(!third||/Recruitment opportunity/i.test(third.title))throw new Error('Generic title still visible');
await p.goto(base);await p.evaluate(id=>localStorage.setItem('cambium.currentConversation',id),conversation.id);await p.reload();await p.getByRole('heading',{name:third.title,exact:true}).last().waitFor();await p.getByRole('heading',{name:third.title,exact:true}).last().locator('..').screenshot({path:'../cambium-third-opportunity-fixed.png'});console.log('Actual third card verified');await b.close();
