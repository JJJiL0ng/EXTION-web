'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = params.code as string;

    if (!code) {
      setStatus('error');
      setMessage('Invalid invite code.');
      return;
    }

    // TODO: API call to validate and use invite code
    setTimeout(() => {
      setStatus('success');
      setMessage('Invite code verified. Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }, 1000);
  }, [params.code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          {status === 'loading' && 'Verifying invite code...'}
          {status === 'success' && 'Welcome!'}
          {status === 'error' && 'Error occurred'}
        </h1>
        <p className="text-center text-gray-600">{message}</p>
        {status === 'loading' && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
