/** Keep public-source placeholders out of decision summaries. */
export function usableDetail(value:string|null|undefined):value is string {
 return !!value?.trim()&&!/^(?:unknown|not disclosed|not confirmed|not verified|source publisher|pay details in original posting|name not disclosed)(?:[.;,:].*)?$/i.test(value.trim())&&!/english translation unavailable|some source text could not be translated|english title unavailable/i.test(value);
}
export const detailLines=(items:string[])=>[...new Set(items.map(v=>v.trim()).filter(usableDetail))];
export function shortDetail(value:string,max=108):string {
 const clean=value.replace(/\s+/g,' ').trim();if(clean.length<=max)return clean;
 const cut=clean.slice(0,max-1);const boundary=cut.lastIndexOf(' ');return cut.slice(0,boundary>max*.65?boundary:cut.length)+'…';
}
