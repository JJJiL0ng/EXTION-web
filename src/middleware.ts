import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 공개 경로 (로그인 없이 접근 가능)
const publicPaths = [
  '/login', 
  '/',
  '/naver6311f1e113c866990f51184e6e9dc27b.html',
  '/terms',
  '/privacy'
]; // 루트 경로(/)를 공개 경로에 추가

// 개발 환경에서 사용되던 코드 (주석 처리)
/*
export function middleware(request: NextRequest) {
  // Firebase의 쿠키 기반 세션 검사
  const session = request.cookies.get('firebase-session-token')?.value;
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // 개발 환경 확인
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 공개 경로는 항상 접근 가능
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );

  // 모바일에서 /application 접근 시 /sorryformobile로 리디렉션
  if (isMobile && path.startsWith('/ai')) {
    const sorryUrl = new URL('/sorryformobile', request.url);
    return NextResponse.redirect(sorryUrl);
  }

  // 로그인되지 않았고 공개 경로가 아닌 경우 로그인 페이지로 리디렉션
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 상태에서 로그인 페이지에 접근하는 경우 메인 페이지로 리디렉션
  // 개발 환경에서는 루트 경로(/)로 접근 가능하도록 예외 처리
  if (session && isPublicPath) {
    // 개발 환경에서 루트 경로(/)는 리디렉션하지 않음
    if (isDevelopment && path === '/') {
      return NextResponse.next();
    }
    
    const homeUrl = new URL('/ai', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}
*/

// 프로덕션 환경용 코드:
export function middleware(request: NextRequest) {
  // Firebase의 쿠키 기반 세션 검사
  const session = request.cookies.get('firebase-session-token')?.value;
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // 공개 경로는 항상 접근 가능
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );

  // 모바일에서 /ai 접근 시 /sorryformobile로 리디렉션
  if (isMobile && path.startsWith('/ai')) {
    const sorryUrl = new URL('/sorryformobile', request.url);
    return NextResponse.redirect(sorryUrl);
  }

  // 로그인되지 않았고 공개 경로가 아닌 경우 로그인 페이지로 리디렉션
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 상태에서 로그인 페이지에 접근하는 경우 메인 페이지로 리디렉션
  if (session && isPublicPath) {
    const homeUrl = new URL('/ai', request.url);
    return NextResponse.redirect(homeUrl);
  }

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