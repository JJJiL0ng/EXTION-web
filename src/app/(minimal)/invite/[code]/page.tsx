'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVerifyInviteCode } from '@/_invite/_hook/useVerifyInviteCode';

export default function InviteCodePage() {
  const params = useParams();
  const router = useRouter();
  const { verify, isLoading, error } = useVerifyInviteCode();

  useEffect(() => {
    const code = params.code as string;
    console.log('🔍 [Invite Page] Dynamic route code:', code);

    if (!code) {
      console.log('⚠️ [Invite Page] 코드 없음 - /invite-check로 리다이렉트');
      router.push('/invite-check');
      return;
    }

    let isMounted = true;

    const handleVerify = async () => {
      console.log('📞 [Invite Page] verify 함수 호출:', code);

      try {
        const result = await verify(code);
        console.log('📥 [Invite Page] verify 결과:', result);

        if (!isMounted) return;

        if (result && result.success) {
          console.log('✅ [Invite Page] 성공 - /trypage로 이동');
          router.push('/sctest');
        } else {
          console.log('❌ [Invite Page] 실패 - /invite-check로 이동');
          router.push('/invite-check');
        }
      } catch (err) {
        console.error('💥 [Invite Page] 에러 발생:', err);
        if (isMounted) {
          router.push('/invite-check');
        }
      }
    };

    console.log('✅ [Invite Page] 코드 존재 - API 호출 시작');
    handleVerify();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying invite code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/invite-check')}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Verifying...</p>
      </div>
    </div>
  );
}
