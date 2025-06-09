'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, signInWithGoogle } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
// Image 컴포넌트는 현재 사용되지 않으므로 주석 처리하거나 삭제할 수 있습니다.
// import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 사용자가 이미 로그인된 경우 메인 페이지로 리디렉션
        router.push('/ai');
      }
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      // 로그인 성공 시 메인 페이지로 이동
      router.push('/ai');
    } catch (err) {
      console.error('로그인 실패:', err);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          {/* Logo/Brand - 랜딩 페이지 스타일 적용 */}
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Ex<span className="text-[#005DE9]">tion</span>
          </h1>
          <div className="w-20 h-1 bg-[#005DE9] mx-auto rounded-full mb-8"></div>
          
          <p className="mt-2 text-lg text-gray-700">
            서비스를 이용하려면 로그인하세요.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            // 흰색 배경의 구글 버튼 스타일 적용
            className="w-full flex items-center justify-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-full border border-gray-300 hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="mr-3" // 아이콘과 텍스트 간격 조정
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="28px" // 아이콘 크기 조정
              height="28px"
            >
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            <span>{loading ? '로그인 중...' : 'Google 계정으로 로그인'}</span>
          </button>
        </div>
      </div>
      {/* Background Elements from lending page */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#005DE9] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400 opacity-5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
