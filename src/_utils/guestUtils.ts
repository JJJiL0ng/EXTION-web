// Guest 사용자 관리 유틸리티

const GUEST_ID_STORAGE_KEY = 'extion_guest_id';

/**
 * UUID v4 생성 함수
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Guest ID 생성 (guest_ 접두사 + UUID)
 */
export function generateGuestId(): string {
  const uuid = generateUUID();
  return `guest_${uuid}`;
}

/**
 * 로컬스토리지에서 Guest ID 불러오기
 */
export function getStoredGuestId(): string | null {
  if (typeof window === 'undefined') {
    return null; // SSR 환경에서는 null 반환
  }
  
  try {
    return localStorage.getItem(GUEST_ID_STORAGE_KEY);
  } catch (error) {
    console.warn('로컬스토리지에서 Guest ID를 불러오는데 실패했습니다:', error);
    return null;
  }
}

/**
 * 로컬스토리지에 Guest ID 저장
 */
export function saveGuestId(guestId: string): void {
  if (typeof window === 'undefined') {
    return; // SSR 환경에서는 저장하지 않음
  }
  
  try {
    localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId);
  } catch (error) {
    console.warn('로컬스토리지에 Guest ID를 저장하는데 실패했습니다:', error);
  }
}

/**
 * Guest ID 가져오기 또는 생성
 * 기존에 저장된 Guest ID가 있으면 반환, 없으면 새로 생성하여 저장 후 반환
 */
export function getOrCreateGuestId(): string {
  let guestId = getStoredGuestId();
  
  if (!guestId) {
    guestId = generateGuestId();
    saveGuestId(guestId);
    console.log('새로운 Guest ID 생성:', guestId);
  } else {
    console.log('기존 Guest ID 사용:', guestId);
  }
  
  return guestId;
}

/**
 * Guest ID 삭제 (로그인 시 호출)
 */
export function clearGuestId(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(GUEST_ID_STORAGE_KEY);
    console.log('Guest ID가 삭제되었습니다.');
  } catch (error) {
    console.warn('Guest ID 삭제에 실패했습니다:', error);
  }
}

/**
 * Guest ID인지 확인하는 함수
 */
export function isGuestId(userId: string): boolean {
  return userId.startsWith('guest_');
}