import {NextRequest,NextResponse} from 'next/server';
import {newVisitor,visitorCookie,visitorOwner} from './lib/visitor';
export function proxy(req:NextRequest){
 let token=req.cookies.get(visitorCookie)?.value;
 const fresh=!visitorOwner(token);if(fresh)token=newVisitor();
 const headers=new Headers(req.headers);
 if(fresh){const cookies=req.cookies.getAll().filter(c=>c.name!==visitorCookie).map(c=>c.name+'='+c.value);cookies.push(visitorCookie+'='+token);headers.set('cookie',cookies.join('; '));}
 const response=NextResponse.next({request:{headers}});
 if(fresh)response.cookies.set(visitorCookie,token!,{httpOnly:true,secure:req.nextUrl.protocol==='https:',sameSite:'lax',path:'/',maxAge:60*60*24*365});
 response.headers.set('Cache-Control','private, no-store');return response;
}
export const config={matcher:['/((?!api/health$|_next/static|_next/image|favicon.ico).*)']};

