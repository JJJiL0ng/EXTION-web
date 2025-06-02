/** @type {import('next').NextConfig} */
const nextConfig = {
    // 이미지 최적화
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cdn.extion.app',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'video.extion.co',
          port: '',
          pathname: '/**',
        },
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
   }
   
   export default nextConfig;