import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const hostname = request.nextUrl.hostname;

  // dev 서브도메인 접근 제어
  if (hostname.startsWith('dev.')) {
    const basicAuth = request.headers.get('authorization');
    
    if (basicAuth) {
      const auth = basicAuth.split(' ')[1];
      const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':');
      
      // 환경변수에서 QA 계정 정보 가져오기
      if (user === process.env.QA_USERNAME && pwd === process.env.QA_PASSWORD) {
        // 인증 성공, 다음 로직으로 진행
      } else {
        return new NextResponse('Invalid credentials', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="QA Environment"',
          },
        });
      }
    } else {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="QA Environment"',
        },
      });
    }
  }

  // Firebase 세션 토큰 확인
  const sessionToken = request.cookies.get('firebase-session-token')?.value;

  // 모바일에서 /ai 접근 시 /sorryformobile로 리디렉션
  if (isMobile && path.startsWith('/ai')) {
    const sorryUrl = new URL('/sorryformobile', request.url);
    return NextResponse.redirect(sorryUrl);
  }
  
  // /adminforpel!sers 경로에 대한 접근 제어
  if (path.startsWith('/adminforpelisers')) {
    // 간단한 예시로 쿠키 확인
    const adminCookie = request.cookies.get('adminLoggedIn');
    
    if (!adminCookie || adminCookie.value !== 'true') {
      // 로그인되지 않은 경우 어드민 게이트웨이로 리다이렉트
      return NextResponse.redirect(new URL('/admingate', request.url));
    }
  }

  // /admindashboard 경로에 대한 접근 제어
  if (path.startsWith('/admindashboard')) {
    // 어드민 로그인 쿠키 확인
    const adminCookie = request.cookies.get('adminLoggedIn');
    
    if (!adminCookie || adminCookie.value !== 'true') {
      // 로그인되지 않은 경우 어드민 게이트웨이로 리다이렉트
      return NextResponse.redirect(new URL('/admingate', request.url));
    }
  }

  // 모든 페이지 접근 허용
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * dev 서브도메인의 모든 경로와 기존 경로들을 포함
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)', // dev 도메인 전체 적용을 위해 추가
    '/adminforpelisers/:path*',
    '/admindashboard/:path*'
  ],
};