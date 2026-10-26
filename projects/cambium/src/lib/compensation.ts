/** Extract explicit source pay rates without inferring currency or payment period. */
export function sourcePay(text:string):string|null{
 const amount='(\\d+(?:\\.\\d+)?(?:\\s*[-–—~～至]\\s*\\d+(?:\\.\\d+)?)?)';
 const format=(value:string)=>value.replace(/\s/g,'').replace(/[-—~～至]/g,'–');
 const units:Record<string,string>={'小时':'hour','时':'hour','天':'day','日':'day','月':'month','字':'character','篇':'article'};
 const rate=text.match(new RegExp(amount+'\\s*元\\s*(起)?\\s*(?:[/／]|每)\\s*(小时|时|天|日|月|字|篇)'));
 if(rate)return (rate[2]?'From ':'')+'CNY '+format(rate[1])+'/'+units[rate[3]];
 const hourly=text.match(new RegExp('时薪\\s*[：:]?\\s*'+amount+'\\s*元(起)?'));
 if(hourly)return (hourly[2]?'From ':'')+'CNY '+format(hourly[1])+'/hour';
 const english=text.match(new RegExp('\\b(CNY|RMB|USD|EUR|GBP)\\s*'+amount+'\\s*(?:/|per\\s+)(hour|hr|day|month|character|article)\\b','i'));
 if(english)return (english[1].toUpperCase()==='RMB'?'CNY':english[1].toUpperCase())+' '+format(english[2])+'/'+(english[3].toLowerCase()==='hr'?'hour':english[3].toLowerCase());
 return null;
}
