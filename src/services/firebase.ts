// Firebase 설정 파일
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';

// Firebase 설정 (환경변수에서 가져옴)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 세션 쿠키 설정 함수
const setSessionCookie = (user: User) => {
  // 사용자 토큰 가져오기
  user.getIdToken().then((token) => {
    // 쿠키 설정 (7일 유효기간)
    document.cookie = `firebase-session-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict; Secure`;
  });
};

// 세션 쿠키 삭제 함수
const clearSessionCookie = () => {
  document.cookie = 'firebase-session-token=; path=/; max-age=0';
};

// Google 로그인 함수
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // 로그인 성공 시 세션 쿠키 설정
    setSessionCookie(result.user);
    return result.user;
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    throw error;
  }
};

// 로그아웃 함수
export const logoutUser = async () => {
  try {
    await signOut(auth);
    // 로그아웃 시 세션 쿠키 삭제
    clearSessionCookie();
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
};

// 현재 인증 상태 추적
export { auth }; 