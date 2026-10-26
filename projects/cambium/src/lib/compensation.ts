/** Extract explicit source pay rates without inferring currency or payment period. */
export function sourcePay(text:string):string|null{
 // A recruitment article can end with paid-group ads and unrelated job roundups.
 text=text.split(/部分兼职概览|往期推荐|相关推荐|推荐阅读|更多招聘|历史招聘/i)[0];
 const promotion=(match:RegExpMatchArray)=>/vip|会员|入群|群费|课程|培训费|付费|订阅|subscription|membership|join.{0,20}group/i.test(text.slice(Math.max(0,(match.index||0)-100),(match.index||0)+match[0].length+100));
 const amount='(\\d+(?:\\.\\d+)?(?:\\s*[-–—~～至]\\s*\\d+(?:\\.\\d+)?)?)';
 const format=(value:string)=>value.replace(/\s/g,'').replace(/[-—~～至]/g,'–');
 const units:Record<string,string>={'小时':'hour','时':'hour','天':'day','日':'day','月':'month','字':'character','篇':'article'};
 const rate=text.match(new RegExp(amount+'\\s*元\\s*(起)?\\s*(?:[/／]|每)\\s*(小时|时|天|日|月|字|篇)'));
 if(rate&&!promotion(rate))return (rate[2]?'From ':'')+'CNY '+format(rate[1])+'/'+units[rate[3]];
 const hourly=text.match(new RegExp('时薪\\s*[：:]?\\s*'+amount+'\\s*元(起)?'));
 if(hourly&&!promotion(hourly))return (hourly[2]?'From ':'')+'CNY '+format(hourly[1])+'/hour';
 const english=text.match(new RegExp('\\b(CNY|RMB|USD|EUR|GBP)\\s*'+amount+'\\s*(?:/|per\\s+)(hour|hr|day|month|character|article)\\b','i'));
 if(english&&!promotion(english))return (english[1].toUpperCase()==='RMB'?'CNY':english[1].toUpperCase())+' '+format(english[2])+'/'+(english[3].toLowerCase()==='hr'?'hour':english[3].toLowerCase());
 return null;
}
