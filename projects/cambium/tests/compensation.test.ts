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
