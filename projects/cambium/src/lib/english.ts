/** English display fallback; never sends personal profile data to a provider. */
export const hasChinese=(value:string)=>/\p{Script=Han}/u.test(value);
export function englishText(value:string,fallback='See the original source for details.'):string {
 const aliases:Record<string,string>={'上海':'Shanghai','北京':'Beijing','深圳':'Shenzhen','杭州':'Hangzhou','广州':'Guangzhou','前沿部署工程师':'Forward Deployed Engineer','前线部署工程师':'Forward Deployed Engineer','客户交付':'customer delivery','项目管理':'project management','数据分析':'data analysis'};
 let result=value;for(const [from,to] of Object.entries(aliases))result=result.replaceAll(from,to);
 return hasChinese(result)?fallback:result;
}
