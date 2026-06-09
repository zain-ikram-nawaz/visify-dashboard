import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Cookie se token check karein
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Case 1: User dashboard par jana chahta hai lekin token nahi hai -> Send to login
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Case 2: User logged in hai aur login page khol raha hai -> Send to dashboard
  if (pathname.startsWith('/login') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Kis kis route par yeh middleware chalna chahiye
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};