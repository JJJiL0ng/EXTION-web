/** @type {import('next').NextConfig} */
const nextConfig = {
  // 프로덕션에서 console.log 제거
  compiler: {
      removeConsole: process.env.NODE_ENV === 'production' ? {
          exclude: ['error', 'warn']
      } : false
  },

  // SSR 설정 - SpreadJS 브라우저 전용 라이브러리 처리
  experimental: {
    esmExternals: false
  },
  
  // Webpack 설정 추가 (Hot Reload 개선)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 개발 환경에서 파일 감지 개선
      config.watchOptions = {
        poll: 1000, // 1초마다 파일 변경 체크
        aggregateTimeout: 300, // 변경 감지 후 300ms 대기
        ignored: /node_modules/,
      }
    }
    return config
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
  
  compress: true,
  poweredByHeader: false,
  
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
  
  async redirects() {
      return []
  },

  async rewrites() {
      return [
          {
              source: '/api/ph/static/:path*',
              destination: 'https://us-assets.i.posthog.com/static/:path*',
          },
          {
              source: '/api/ph/:path*',
              destination: 'https://us.i.posthog.com/:path*',
          },
          {
              source: '/api/chatandsheet/:path*',
              destination: 'http://localhost:8080/chatandsheet/:path*',
          },
          {
              source: '/api/backend/:path*',
              destination: 'http://localhost:8080/:path*',
          },
      ]
  },
}

export default nextConfig;