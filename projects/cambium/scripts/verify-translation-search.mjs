const base='http://127.0.0.1:3001';
const state=await(await fetch(base+'/api/state')).json();const c=state.conversations.find(c=>c.title==='Find AI FDE opportunities');
const r=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'我想找一个在上海的 翻译工作 但是是ai内容的 最好是零工 最好是金融行业的需求',conversationId:c.id,demo:false})});
const reader=r.body.getReader();let pending='';
for(;;){const {value,done}=await reader.read();if(done)break;pending+=new TextDecoder().decode(value);let n;while((n=pending.indexOf('\n'))>=0){const line=pending.slice(0,n);pending=pending.slice(n+1);if(!line)continue;const e=JSON.parse(line);if(e.type==='phase')console.log(e.text);if(e.type==='result'){const b=e.message.blocks;console.log(JSON.stringify({text:e.message.text,intent:b.intent,opportunities:b.opportunities?.map(o=>({title:o.title,location:o.location,engagement:o.engagement,url:o.url,why:o.why,summary:o.summary})),report:b.report},null,2));}}}
