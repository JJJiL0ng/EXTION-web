'use client'

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 백엔드 API URL (환경변수로 관리하는 것이 좋습니다)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function AdminGatewayPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 이미 로그인된 상태인지 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
      if (isLoggedIn === 'true') {
        router.push('/admindashboard');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('API 호출 시작:', `${API_BASE_URL}/auth/admin/login`);
      
      // 백엔드 어드민 로그인 API 호출
      const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      console.log('API 응답 상태:', response.status);

      // 응답이 JSON이 아닐 수 있으므로 먼저 텍스트로 받아서 확인
      const responseText = await response.text();
      console.log('API 응답 텍스트:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }

      if (response.ok && data.success) {
        // 성공 시 세션과 쿠키에 어드민 정보 저장
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminLoggedIn', 'true');
          sessionStorage.setItem('adminUserId', data.adminUserId || data.user_id || '');
          sessionStorage.setItem('adminDisplayName', data.displayName || data.display_name || username);
          
          // 쿠키에도 저장 (보안을 위해 HttpOnly 권장하지만 여기서는 간단히 처리)
          document.cookie = `adminLoggedIn=true; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `adminUserId=${data.adminUserId || data.user_id || ''}; path=/; max-age=86400; SameSite=Lax`;
        }
        
        // 성공 메시지 표시 (선택적)
        console.log('어드민 로그인 성공:', data.message || '로그인 성공');
        
        // 관리자 대시보드로 리다이렉션
        router.push('/admindashboard');
      } else {
        // 서버에서 반환된 에러 메시지 표시
        const errorMessage = data.message || data.error || '로그인에 실패했습니다.';
        console.error('로그인 실패:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('로그인 API 호출 오류:', err);
      
      // 네트워크 오류인지 확인
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError(err instanceof Error ? err.message : '서버 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
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
          <p className="text-gray-600 text-sm">관리자 인증이 필요합니다</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
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
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  인증 중...
                </div>
              ) : (
                '관리자 로그인'
              )}
            </button>
          </form>

          {/* 추가 정보 */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <p className="text-center text-sm text-gray-500 font-medium">
                백엔드 인증을 통한 안전한 관리자 시스템
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