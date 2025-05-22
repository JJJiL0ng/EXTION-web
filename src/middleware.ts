import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 공개 경로 (로그인 없이 접근 가능)
const publicPaths = ['/login'];

export function middleware(request: NextRequest) {
  // Firebase의 쿠키 기반 세션 검사
  const session = request.cookies.get('firebase-session-token')?.value;
  const path = request.nextUrl.pathname;

  // 공개 경로는 항상 접근 가능
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );

  // 로그인되지 않았고 공개 경로가 아닌 경우 로그인 페이지로 리디렉션
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 상태에서 로그인 페이지에 접근하는 경우 메인 페이지로 리디렉션
  if (session && isPublicPath) {
    const homeUrl = new URL('/application', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 미들웨어가 실행될 경로를 여기에 추가하세요
     * 예: 대시보드, 프로필, API 경로 등
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 