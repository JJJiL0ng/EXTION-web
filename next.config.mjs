/** @type {import('next').NextConfig} */
const nextConfig = {
  // 프로덕션에서 console.log 제거
  compiler: {
      removeConsole: process.env.NODE_ENV === 'production' ? {
          exclude: ['error', 'warn'] // error와 warn은 유지
      } : false
  },
  
  // 이미지 최적화
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'cdn.extion.ai',
              port: '',
              pathname: '/**',
          },
          {
              protocol: 'https',
              hostname: 'video.extion.ai',
              port: '',
              pathname: '/**',
          },
            {
              protocol: 'https',
              hostname: 'cdn.extion.co',
              port: '',
              pathname: '/**',
          },
          {
              protocol: 'https',
              hostname: 'video.extion.co',
              port: '',
              pathname: '/**',
          },
          // 개발환경용 localhost 추가 (개발 시에만 적용)
          ...(process.env.NODE_ENV === 'development' ? [
              {
                  protocol: 'http',
                  hostname: 'localhost',
                  port: '3000',
                  pathname: '/**',
              }
          ] : []),
      ],
      formats: ['image/webp', 'image/avif'],
  },
  
  // 압축 및 최적화
  compress: true,
  poweredByHeader: false,
  
  // SEO를 위한 헤더 설정
  async headers() {
      return [
          {
              source: '/(.*)',
              headers: [
                  {
                      key: 'X-Content-Type-Options',
                      value: 'nosniff',
                  },
                  {
                      key: 'X-Frame-Options',
                      value: 'DENY',
                  },
                  {
                      key: 'X-XSS-Protection',
                      value: '1; mode=block',
                  },
              ],
          },
          {
              source: '/videos/(.*)',
              headers: [
                  {
                      key: 'Cache-Control',
                      value: 'public, max-age=31536000, immutable',
                  },
              ],
          },
      ]
  },
  
  // 리다이렉트 설정 (필요시)
  async redirects() {
      return [
          // 예: 구 도메인에서 새 도메인으로 리다이렉트
          // {
          //   source: '/old-path',
          //   destination: '/',
          //   permanent: true,
          // },
      ]
  },

  // API 프록시 설정 (CORS 문제 해결)
  async rewrites() {
      return [
          {
              source: '/api/chatandsheet/:path*',
              destination: 'http://localhost:8080/chatandsheet/:path*',
          },
          // 다른 API 엔드포인트도 필요시 추가
          {
              source: '/api/backend/:path*',
              destination: 'http://localhost:8080/:path*',
          },
      ]
  },
}

export default nextConfig;