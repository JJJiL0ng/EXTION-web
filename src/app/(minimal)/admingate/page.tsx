'use client'

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminGatewayPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 환경변수에서 어드민 계정 정보 가져오기
      const kelly_username = process.env.NEXT_PUBLIC_ADMIN_KELLY;
      const kelly_password = process.env.NEXT_PUBLIC_ADMIN_KELLY_PASSWORD;
      const jilong_username = process.env.NEXT_PUBLIC_ADMIN_JILONG;
      const jilong_password = process.env.NEXT_PUBLIC_ADMIN_JILONG_PASSWORD;

      // 디버깅용 로그 (실제 운영에서는 제거해야 함)
      console.log('디버깅 정보:');
      console.log('입력된 사용자명:', username);
      console.log('입력된 비밀번호:', password);
      console.log('kelly 사용자명:', kelly_username);
      console.log('kelly 비밀번호:', kelly_password);
      console.log('jilong 사용자명:', jilong_username);
      console.log('jilong 비밀번호:', jilong_password);

      // 로그인 검증 - 두 계정 모두 확인
      const isKellyLogin = (username === kelly_username && password === kelly_password);
      const isJilongLogin = (username === jilong_username && password === jilong_password);
      
      console.log('kelly 로그인 결과:', isKellyLogin);
      console.log('jilong 로그인 결과:', isJilongLogin);

      if (isKellyLogin || isJilongLogin) {
        // 성공 시 세션과 쿠키에 로그인 상태 저장
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminLoggedIn', 'true');
          document.cookie = 'adminLoggedIn=true; path=/; max-age=86400';
        }
        
        // 성공 메시지와 리다이렉션
        
        // 관리자 페이지로 리다이렉션 (Next.js Router 사용)
        router.push('/admindashboard');
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    } 
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* 배경 장식 - Extion 스타일 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-blue-300/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* 로고/브랜딩 */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Extion Logo" 
            className="w-16 h-16 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Extion Admin</h1>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
          <div className="space-y-6">
            {/* 아이디 입력 */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-3">
                관리자 아이디
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  로그인 중...
                </div>
              ) : (
                '관리자 로그인'
              )}
            </button>
          </div>

          {/* 추가 정보 */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <p className="text-center text-sm text-gray-500 font-medium">
                안전한 관리자 인증 시스템
              </p>
            </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            © 2024 Extion. AI가 만드는 새로운 엑셀 경험
          </p>
        </div>
      </div>
    </div>
  );
}