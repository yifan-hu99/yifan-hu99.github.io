import { NextRequest } from 'next/server';
export class ApiError extends Error { constructor(public status:number,public code:string,message:string){super(message);} }
const buckets = new Map<string,{count:number;at:number}>();
export function guard(req:NextRequest) {
  const host=req.nextUrl.hostname;
  if (!['localhost','127.0.0.1','[::1]'].includes(host)) throw new ApiError(403,'LOCAL_ONLY','This build is restricted to local single-user access.');
  const origin=req.headers.get('origin');
  const port=req.nextUrl.port?':'+req.nextUrl.port:'';
  if (origin && ![req.nextUrl.origin,process.env.APP_BASE_URL,'http://127.0.0.1'+port,'http://localhost'+port].filter(Boolean).includes(origin)) throw new ApiError(403,'ORIGIN_REJECTED','Request origin is not allowed.');
  if (req.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError(403,'ORIGIN_REJECTED','Cross-site requests are not allowed.');
  if (req.method!=='GET') {
    const key='local'; const old=buckets.get(key); const b=old && Date.now()-old.at<60000?old:{count:0,at:Date.now()}; b.count++; buckets.set(key,b);
    if(b.count>40) throw new ApiError(429,'RATE_LIMIT','Please wait a minute before trying again.');
    const length=Number(req.headers.get('content-length')||0); if(length>5*1024*1024+10000) throw new ApiError(413,'TOO_LARGE','Maximum upload size is 5 MB.');
  }
}
