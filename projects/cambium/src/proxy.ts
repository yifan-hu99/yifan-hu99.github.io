import {NextRequest,NextResponse} from 'next/server';
import {validAccess} from '@/lib/access';
export function proxy(req:NextRequest){
 if(!validAccess(req.headers.get('authorization')))return new NextResponse('Sign in to Cambium.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Cambium", charset="UTF-8"','Cache-Control':'no-store'}});
 const response=NextResponse.next();response.headers.set('Cache-Control','private, no-store');return response;
}
export const config={matcher:['/((?!api/health$|_next/static|_next/image|favicon.ico).*)']};
