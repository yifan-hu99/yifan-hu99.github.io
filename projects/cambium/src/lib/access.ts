import {createHash,timingSafeEqual} from 'node:crypto';
export function validAccess(header:string|null,password=process.env.APP_ACCESS_PASSWORD,username=process.env.APP_ACCESS_USERNAME||'cambium'){
 if(!password)return !process.env.VERCEL&&!process.env.RAILWAY_ENVIRONMENT_ID&&!process.env.RAILWAY_PUBLIC_DOMAIN&&!process.env.APP_BASE_URL?.startsWith('https://');
 if(!header?.startsWith('Basic '))return false;
 const decoded=Buffer.from(header.slice(6),'base64').toString('utf8');
 const digest=(s:string)=>createHash('sha256').update(s).digest();
 return timingSafeEqual(digest(decoded),digest(username+':'+password));
}
