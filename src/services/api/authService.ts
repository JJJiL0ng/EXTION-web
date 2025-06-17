const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface UserRegistrationData {
  userId: string; // Firebase uid
  email: string;
  displayName: string;
  photoURL: string;
  isGuest: boolean;
  preferences: {};
  statistics: {};
}

// 백엔드 CheckUserResponse 인터페이스와 일치
export interface CheckUserResponse {
  exists: boolean;
  user?: {
    id: string;
    email: string;
    displayName: string;
    photoURL: string;
    isGuest: boolean;
    createdAt: string;
    lastActiveAt: string;
  };
}

// 사용자 등록 API - 최초 회원가입 시에만 호출
export const registerUser = async (userData: UserRegistrationData): Promise<boolean> => {
  try {
    console.log('사용자 등록 API 호출:', userData);
    
    const response = await fetch(`${API_BASE_URL}/auth/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('사용자 등록 실패:', response.status, response.statusText, errorText);
      return false;
    }

    const result = await response.json();
    console.log('사용자 등록 성공:', result);
    return true;
  } catch (error) {
    console.error('사용자 등록 중 오류 발생:', error);
    return false;
  }
};

// 사용자 존재 여부 확인 API - 백엔드 구조에 맞게 수정
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('사용자 존재 여부 확인 실패:', response.status, response.statusText);
      return false;
    }
    
    const data: CheckUserResponse = await response.json();
    return data.exists;
  } catch (error) {
    console.error('사용자 존재 여부 확인 중 오류:', error);
    return false;
  }
};

// Firebase uid로 사용자 존재 여부 확인 (추가)
export const checkUserExistsByUid = async (uid: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check?id=${encodeURIComponent(uid)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('사용자 존재 여부 확인 실패 (uid):', response.status, response.statusText);
      return false;
    }
    
    const data: CheckUserResponse = await response.json();
    return data.exists;
  } catch (error) {
    console.error('사용자 존재 여부 확인 중 오류 (uid):', error);
    return false;
  }
};

// 사용자 정보 가져오기 API (추가 유틸리티)
export const getUserInfo = async (email: string): Promise<CheckUserResponse['user'] | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('사용자 정보 조회 실패:', response.status, response.statusText);
      return null;
    }
    
    const data: CheckUserResponse = await response.json();
    return data.exists ? data.user || null : null;
  } catch (error) {
    console.error('사용자 정보 조회 중 오류:', error);
    return null;
  }
}; 