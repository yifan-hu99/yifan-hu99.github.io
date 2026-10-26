import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Cambium',description:'Find your next opportunity in AI.',icons:{icon:'/brand/original-emblem.png'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
