import {describe,it,expect,vi} from 'vitest';
import {sourcePay} from '../src/lib/compensation';
import {englishOpportunity} from '../src/lib/english-opportunity';
import {fixtures} from '../src/lib/search';
describe('explicit source pay',()=>{
 it.each([['不用坐班，65-70元/时！招募影视翻译','CNY 65–70/hour'],['时薪40元起','From CNY 40/hour'],['200-300元/天','CNY 200–300/day'],['CNY 65-70/hour! Recruiting translators','CNY 65–70/hour'],['RMB 65 per hour','CNY 65/hour']])('extracts %s',(text,pay)=>expect(sourcePay(text)).toBe(pay));
 it.each(['2026-12-31','工作时间：65-70小时','预算待定','月结','65-70元'])('does not invent missing pay periods: %s',text=>expect(sourcePay(text)).toBeNull());
 it('repairs previously stored English results without another provider request',async()=>{vi.stubEnv('DEEPSEEK_API_KEY','');try{const o=await englishOpportunity({...fixtures()[0],demo:false,title:'No office attendance required, CNY 65-70/hour! Recruiting translators',compensation:'Not disclosed'});expect(o.compensation).toBe('CNY 65–70/hour');}finally{vi.unstubAllEnvs();}});
 it('preserves existing disclosed compensation',async()=>{const o=await englishOpportunity({...fixtures()[0],title:'CNY 65-70/hour',compensation:'CNY 80/hour'});expect(o.compensation).toBe('CNY 80/hour');});
});

describe('pay provenance',()=>{
 it('does not treat a paid group subscription as job compensation',()=>expect(sourcePay('负责字幕翻译和审校。即刻加入，仅0.5元/天。【嘟噜噜vip群】')).toBeNull());
 it('does not borrow pay from an unrelated job roundup',()=>expect(sourcePay('长期招募字幕译员。部分兼职概览：线下翻译，750元/天。')).toBeNull());
 it('keeps the actual job rate before a related-post section',()=>expect(sourcePay('薪酬：65-70元/时。部分兼职概览：其他岗位750元/天。')).toBe('CNY 65–70/hour'));
});
