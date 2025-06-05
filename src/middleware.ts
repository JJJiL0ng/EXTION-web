import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // 모바일에서 /ai 접근 시 /sorryformobile로 리디렉션
  if (isMobile && path.startsWith('/ai')) {
    const sorryUrl = new URL('/sorryformobile', request.url);
    return NextResponse.redirect(sorryUrl);
  }

  // 모든 페이지 접근 허용
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 미들웨어가 실행될 경로를 여기에 추가하세요
     * 예: 대시보드, 프로필, API 경로 등
     * 정적 파일들은 제외합니다
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|robots\\.txt|sitemap\\.xml)).*)',
  ],
};