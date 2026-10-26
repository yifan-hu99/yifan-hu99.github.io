import {describe,it,expect} from 'vitest';
import {isBuyerDemand,normalizeRedNote,readRedNotes,redNoteUrl,redNoteQueries} from '../src/lib/xiaohongshu';
import {extractIntent,qualifies} from '../src/lib/search';
const intent=extractIntent('上海 AI内容翻译，最好金融零工');
const note={id:'6aa2702200000000260089bc',title:'招募AI同声传译执行人员',desc:'负责会议现场矫正AI识别错误。按项目实际工作天数结算费用。可以出差。',timestamp:Math.floor(Date.now()/1000),user:{nickname:'Published Author'}};
describe('Xiaohongshu demand adapter',()=>{
 it('accepts buyer requests and rejects supplier ads, tutorials and unpaid trials',()=>{expect(isBuyerDemand(note.title,note.desc)).toBe(true);for(const title of ['免费招募5位AI翻译体验官','AI翻译教程','翻译接单中','AI翻译求职','AI翻译副业分享'])expect(isBuyerDemand(title,'欢迎联系')).toBe(false);});
 it('parses the verified search response shape and rejects malformed IDs',()=>{expect(readRedNotes({notes:[note]})).toHaveLength(1);expect(()=>readRedNotes({notes:[{...note,id:'../../bad'}]})).toThrow();expect(()=>readRedNotes({items:[note]})).toThrow();});
 it('keeps an original note route and never accepts a foreign share URL',()=>{expect(redNoteUrl(note)).toBe('https://www.xiaohongshu.com/explore/'+note.id);expect(redNoteUrl({...note,mini_program_info:{webpage_url:'https://evil.example/'+note.id}})).toBe(redNoteUrl(note));});
 it('does not infer worksite, salary or email from an author profile',()=>{const o=normalizeRedNote({...note,...{ip_location:'上海'}},intent,true)!;expect(o.location).toBe('Unknown');expect(o.compensation).toBe('Not disclosed');expect(o.contact).toBeNull();expect(o.engagement).toBe('Project-based');expect(o.source).toContain('note checked');expect(o.demo).toBe(false);expect(qualifies(o,intent)).toBe(true);});
 it('retains only explicit pay and worksite details',()=>{const o=normalizeRedNote({...note,desc:note.desc+'\n工作地点：上海\n200元/小时\n远程兼职'},intent)!;expect(o.location).toBe('Shanghai');expect(o.compensation).toBe('CNY 200/hour');expect(o.engagement).toBe('Part-time');expect(o.modality).toBe('Remote');});
 it('keeps translation queries task-specific after an FDE conversation',()=>{const i=extractIntent('上海 AI翻译，最好金融零工',extractIntent('FDE in Shanghai'));const queries=redNoteQueries(i);expect(queries.join(' ')).toContain('翻译');expect(queries.join(' ')).toContain('金融');expect(queries.join(' ')).not.toContain('FDE');});
});
