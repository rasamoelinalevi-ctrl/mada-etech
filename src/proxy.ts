import {NextResponse,type NextRequest} from 'next/server';
// Early navigation only. The layout and each API still validate the database session.
export function proxy(req:NextRequest){if(!req.cookies.get('mada_session'))return NextResponse.redirect(new URL('/connexion'+(req.nextUrl.pathname.startsWith('/admin')?'?next=/admin':''),req.url));return NextResponse.next();}
export const config={matcher:['/admin/:path*','/compte','/confirmation/:path*']};
