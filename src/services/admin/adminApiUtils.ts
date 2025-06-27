// 백엔드 API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 어드민 사용자 ID 가져오기
export const getAdminUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('adminUserId');
  }
  return null;
};

// 어드민 로그인 상태 확인
export const isAdminLoggedIn = (): boolean => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
  }
  return false;
};

// 어드민 로그아웃
export const adminLogout = (): void => {
  if (typeof window !== 'undefined') {
    // 세션 스토리지 클리어
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUserId');
    sessionStorage.removeItem('adminDisplayName');
    
    // 쿠키 클리어
    document.cookie = 'adminLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'adminUserId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};

// API 호출 헬퍼 함수
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const adminUserId = getAdminUserId();
  if (!adminUserId) {
    throw new Error('관리자 인증이 필요합니다.');
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  // GET 요청인 경우 쿼리 파라미터로 adminUserId 추가
  if (!options.method || options.method === 'GET') {
    url.searchParams.append('adminUserId', adminUserId);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const responseText = await response.text();
  let data;
  
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error('JSON 파싱 오류:', parseError);
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || '요청 처리 중 오류가 발생했습니다.');
  }

  return data;
};

// 모든 채팅 목록 가져오기
export const fetchAllChats = async () => {
  try {
    const data = await apiCall('/chat-database/admin/all-chats');
    return data.success ? data.chats : [];
  } catch (error) {
    console.error('채팅 목록 조회 오류:', error);
    throw error;
  }
};

// 특정 사용자의 채팅 목록 가져오기
export const fetchUserChats = async (userId: string) => {
  try {
    const data = await apiCall(`/chat-database/admin/user/${userId}/chats`);
    return data.success ? data.chats : [];
  } catch (error) {
    console.error('사용자 채팅 목록 조회 오류:', error);
    throw error;
  }
};

// 채팅 메시지 가져오기
export const fetchChatMessages = async (chatId: string) => {
  try {
    const data = await apiCall(`/chat-database/admin/load/${chatId}`);
    return data.success ? data.messages : [];
  } catch (error) {
    console.error('채팅 메시지 조회 오류:', error);
    throw error;
  }
};

// 스프레드시트 데이터 가져오기
export const fetchSpreadsheetData = async (chatId: string) => {
  try {
    const data = await apiCall(`/spreadsheet/admin/loadsheet/${chatId}`);
    return data.success ? data.data : null;
  } catch (error) {
    console.error('스프레드시트 데이터 조회 오류:', error);
    throw error;
  }
};

// 채팅 상세 정보 가져오기 (메시지 + 스프레드시트)
export const fetchChatDetails = async (chatId: string) => {
  try {
    const [messagesData, spreadsheetData] = await Promise.all([
      fetchChatMessages(chatId),
      fetchSpreadsheetData(chatId),
    ]);

    return {
      messages: messagesData,
      spreadsheet: spreadsheetData,
    };
  } catch (error) {
    console.error('채팅 상세 정보 조회 오류:', error);
    throw error;
  }
};

// 사용자 목록 가져오기
export const fetchAllUsers = async () => {
  try {
    const data = await apiCall('/auth/users');
    return data.success ? data.users : [];
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    throw error;
  }
};

// 사용자 상세 정보 가져오기
export const fetchUserDetails = async (userId: string) => {
  try {
    const data = await apiCall(`/auth/user/${userId}`);
    return data.success ? data.user : null;
  } catch (error) {
    console.error('사용자 상세 정보 조회 오류:', error);
    throw error;
  }
};

// 채팅 삭제
export const deleteChat = async (chatId: string) => {
  const adminUserId = getAdminUserId();
  if (!adminUserId) {
    throw new Error('관리자 인증이 필요합니다.');
  }

  try {
    const data = await apiCall(`/chat-database/admin/delete/${chatId}`, {
      method: 'DELETE',
      body: JSON.stringify({ adminUserId }),
    });
    return data.success;
  } catch (error) {
    console.error('채팅 삭제 오류:', error);
    throw error;
  }
};

// 사용자 차단/해제
export const toggleUserBlock = async (userId: string, block: boolean) => {
  const adminUserId = getAdminUserId();
  if (!adminUserId) {
    throw new Error('관리자 인증이 필요합니다.');
  }

  try {
    const endpoint = block ? `/auth/admin/block-user/${userId}` : `/auth/admin/unblock-user/${userId}`;
    const data = await apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify({ adminUserId }),
    });
    return data.success;
  } catch (error) {
    console.error('사용자 차단/해제 오류:', error);
    throw error;
  }
};

// 시스템 통계 가져오기
export const fetchSystemStats = async () => {
  try {
    const data = await apiCall('/admin/stats');
    return data.success ? data.stats : null;
  } catch (error) {
    console.error('시스템 통계 조회 오류:', error);
    throw error;
  }
}; 