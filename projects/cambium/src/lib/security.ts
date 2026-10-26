import {validAccess} from './access';
import { NextRequest } from 'next/server';
export class ApiError extends Error { constructor(public status:number,public code:string,message:string){super(message);} }
const buckets = new Map<string,{count:number;at:number}>();
export function guard(req:NextRequest) {
  if(!validAccess(req.headers.get('authorization')))throw new ApiError(401,'AUTH_REQUIRED','Sign in to Cambium.');
  const origins=[process.env.APP_BASE_URL,process.env.RAILWAY_PUBLIC_DOMAIN?'https://'+process.env.RAILWAY_PUBLIC_DOMAIN:null,...[process.env.VERCEL_URL,process.env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean).map(host=>'https://'+host)].filter(Boolean).map(value=>new URL(value!));
  const local=['localhost','127.0.0.1','[::1]'];
  const host=req.headers.get('host')||req.nextUrl.host;
  const configured=origins.some(url=>url.host===host);
  const hostname=new URL('http://'+host).hostname;
  if(!local.includes(hostname)&&!configured)throw new ApiError(403,'HOST_REJECTED','Request host is not configured.');
  const origin=req.headers.get('origin');
  const allowed=[...origins.map(url=>url.origin),...(local.includes(hostname)?[req.nextUrl.origin,'http://'+host]:[])];
  if(origin&&!allowed.includes(origin))throw new ApiError(403,'ORIGIN_REJECTED','Request origin is not allowed.');
  if (req.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError(403,'ORIGIN_REJECTED','Cross-site requests are not allowed.');
  if (req.method!=='GET') {
    const key='local'; const old=buckets.get(key); const b=old && Date.now()-old.at<60000?old:{count:0,at:Date.now()}; b.count++; buckets.set(key,b);
    if(b.count>40) throw new ApiError(429,'RATE_LIMIT','Please wait a minute before trying again.');
    const length=Number(req.headers.get('content-length')||0); if(length>5*1024*1024+10000) throw new ApiError(413,'TOO_LARGE','Maximum upload size is 5 MB.');
  }
}
