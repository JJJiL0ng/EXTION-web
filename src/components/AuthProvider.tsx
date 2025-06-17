'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';
import { registerUser, checkUserExistsByUid, UserRegistrationData } from '@/services/api/authService';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore();
  const registrationAttempted = useRef(new Set<string>()); // 중복 등록 방지

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user && user.uid && !registrationAttempted.current.has(user.uid)) {
        // 중복 등록 방지를 위해 uid를 Set에 추가
        registrationAttempted.current.add(user.uid);
        
        try {
          // Firebase uid로 사용자가 이미 등록되어 있는지 확인
          const userExists = await checkUserExistsByUid(user.uid);
          
          if (!userExists) {
            // 최초 회원가입인 경우 사용자 등록 API 호출
            const userData: UserRegistrationData = {
              userId: user.uid, // Firebase uid를 userId로 전송
              email: user.email || '',
              displayName: user.displayName || '익명 사용자',
              photoURL: user.photoURL || '',
              isGuest: false,
              preferences: {},
              statistics: {}
            };

            const registrationSuccess = await registerUser(userData);
            
            if (registrationSuccess) {
              console.log('신규 사용자 등록이 완료되었습니다:', user.uid, user.email);
            } else {
              console.warn('신규 사용자 등록에 실패했습니다:', user.uid, user.email);
            }
          } else {
            console.log('기존 사용자입니다:', user.uid, user.email);
          }
        } catch (error) {
          console.error('사용자 등록 처리 중 오류:', error);
          // 오류가 발생해도 Set에서 제거하지 않아 재시도 방지
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
} 