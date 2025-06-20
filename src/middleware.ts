import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Firebase 세션 토큰 확인
  const sessionToken = request.cookies.get('firebase-session-token')?.value;

  // 모바일에서 /ai 접근 시 /sorryformobile로 리디렉션
  // if (isMobile && path.startsWith('/ai')) {
  //   const sorryUrl = new URL('/sorryformobile', request.url);
  //   return NextResponse.redirect(sorryUrl);
  // }

  // 로그인이 필요한 경로에 대한 인증 확인
  // if (path.startsWith('/ai')) {
  //   // 세션 토큰이 없으면 로그인 페이지로 리디렉션
  //   if (!sessionToken) {
  //     const loginUrl = new URL('/login', request.url);
  //     return NextResponse.redirect(loginUrl);
  //   }
  // }

  // 모든 페이지 접근 허용
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 임시로 특정 경로만 활성화하여 딜레이 원인 확인
     * 미들웨어가 딜레이 원인이라면 이렇게 변경 후 성능이 개선될 것입니다
     */
    // 미들웨어가 필요한 특정 경로만 활성화
    // '/ai/:path*',  // AI 관련 경로만
    // '/dashboard/:path*',  // 대시보드 관련 경로만
  ],
};