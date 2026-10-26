import {describe,it,expect} from 'vitest';
import {historyDiscovery} from '../src/lib/discovery-history';
import {extractIntent,fixtures} from '../src/lib/search';
const intent=extractIntent('Find AI translation work in Shanghai, ideally freelance, finance preferred');
const translator={...fixtures()[0],id:'translation',demo:false,title:'AI translator',summary:'Translate AI content for a finance project',evidence:'Hiring a freelance AI translator',location:'Shanghai',url:'https://example.com/jobs/translation',source:'Xiaohongshu',matchTier:'exact' as const};
describe('history-based discovery',()=>{
 it('uses the latest task and does not fill translation recommendations with older engineering roles',()=>{const old={...fixtures()[0],id:'engineering',demo:false,url:'https://example.com/fde'};const result=historyDiscovery([{intent,results:[translator]},{intent:extractIntent('AI FDE in Shanghai'),results:[old]}]);expect(result.opportunities.map(o=>o.url)).toEqual([translator.url]);expect(result.starters[0].prompt).toContain('translator');expect(result.starters[0].prompt).toContain('Shanghai');});
 it('excludes dismissed, expired and fictional results',()=>{const result=historyDiscovery([{intent,results:[translator,{...translator,id:'expired',publishedAt:'2020-01-01'},fixtures()[0]]}],['translation']);expect(result.opportunities).toEqual([]);expect(result.intent).toBeTruthy();});
 it('ignores demo runs and has no personal history for a new user',()=>{expect(historyDiscovery([{intent,results:[translator],demo:true}]).intent).toBeUndefined();expect(historyDiscovery([]).starters).toEqual([]);});
 it('deduplicates search suggestions without sending private raw prompts',()=>{const result=historyDiscovery([{intent:{...intent,query:'My private name is Example'},results:[translator]},{intent,results:[translator]}]);expect(result.starters).toHaveLength(1);expect(result.starters[0].prompt).not.toContain('private name');});
});
