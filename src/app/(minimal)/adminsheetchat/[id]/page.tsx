//src/app/adminsheetchat/[id]/page.tsx
'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useParams, useRouter, usePathname } from 'next/navigation';
import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react';
import AdminSheetRender from "@/components/adminsheetchat/adminsheetrender";
import AdminChatRender from "@/components/adminsheetchat/adminchatrender";
import { useAdminStore } from '@/stores/adminStore';
import { loadAdminChatSheetData, isAdminLoggedIn } from '@/services/admin/adminSheetchatApiUtils';

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function AdminSheetChatContent() {
  const [leftWidth, setLeftWidth] = useState(65); // 초기 65%
  const [isDragging, setIsDragging] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const { 
    setCurrentChatId,
    setChatData,
    setSheetMetaData,
    setLoading,
    setError,
    isLoading,
    error,
    clearData,
    clearErrors
  } = useAdminStore();

  // URL에서 채팅 ID 가져오기
  const chatId = params.id as string;
  const adminUserId = searchParams.get('adminUserId') || '';

  // 관리자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResult = isAdminLoggedIn();
        if (!authResult) {
          router.push('/admingate');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('관리자 인증 확인 실패:', error);
        router.push('/admingate');
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  // 대시보드로 돌아가기
  const goBack = useCallback(() => {
    router.push('/admindashboard');
  }, [router]);

  // adminUserId를 sessionStorage에 저장
  useEffect(() => {
    if (adminUserId) {
      sessionStorage.setItem('adminUserId', adminUserId);
      sessionStorage.setItem('adminLoggedIn', 'true');
    }
  }, [adminUserId]);

  // 데이터 로드
  useEffect(() => {
    if (!isAuthenticated) return; // 인증되지 않았으면 로드하지 않음

    const loadAdminData = async () => {
      try {
        if (!chatId) {
          setError('채팅 ID가 필요합니다.');
          setLoading(false);
          return;
        }

        if (!adminUserId) {
          setError('어드민 사용자 ID가 필요합니다.');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        clearData();

        // 관리자용 채팅 시트 데이터 로드
        const data = await loadAdminChatSheetData(chatId);
        
        setCurrentChatId(chatId);

        // 스토어에 데이터 저장
        if (data.chat) {
          // 채팅 데이터를 어드민 스토어 형식으로 변환
          const convertedChat = {
            id: data.chat.id,
            title: data.chat.title,
            createdAt: new Date(data.chat.createdAt),
            updatedAt: new Date(data.chat.updatedAt),
            messageCount: data.chat.messageCount,
            status: data.chat.status as 'ACTIVE' | 'ARCHIVED' | 'DELETED',
            analytics: data.chat.analytics,
            userId: data.chat.userId,
            messages: data.chat.messages ? data.chat.messages.map((msg: any) => ({
              id: msg.id || Math.random().toString(),
              content: msg.content || '',
              timestamp: new Date(msg.timestamp || Date.now()),
              role: msg.role as 'USER' | 'EXTION_AI' | 'SYSTEM',
              type: msg.type as 'TEXT' | 'FILE_UPLOAD' | 'FORMULA' | 'VISUALIZATION' | 'DATA_GENERATION' | 'FUNCTION' | 'DATA_EDIT',
              mode: msg.mode,
              sheetContext: msg.sheetContext,
              formulaData: msg.formulaData,
              artifactData: msg.artifactData,
              dataChangeInfo: msg.dataChangeInfo,
              fileUploadInfo: msg.fileUploadInfo,
              metadata: msg.metadata,
            })) : []
          };
          setChatData(convertedChat);
        }

        if (data.sheetMetaData) {
          // 시트 메타데이터를 어드민 스토어 형식으로 변환
          const convertedMetadata = {
            id: data.sheetMetaData.id,
            fileName: data.sheetMetaData.fileName,
            originalFileName: data.sheetMetaData.originalFileName,
            fileSize: data.sheetMetaData.fileSize,
            fileType: data.sheetMetaData.fileType,
            activeSheetIndex: data.sheetMetaData.activeSheetIndex,
            createdAt: new Date(data.sheetMetaData.createdAt),
            updatedAt: new Date(data.sheetMetaData.updatedAt),
            userId: data.sheetMetaData.userId,
            sheetTableData: data.sheetMetaData.sheetTableData ? data.sheetMetaData.sheetTableData.map((sheet: any) => ({
              id: sheet.id,
              name: sheet.name,
              index: sheet.index,
              data: sheet.data,
              createdAt: new Date(sheet.createdAt),
              updatedAt: new Date(sheet.updatedAt),
            })) : []
          };
          setSheetMetaData(convertedMetadata);
        }

        setLoading(false);
      } catch (err) {
        console.error('관리자 데이터 로드 실패:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    loadAdminData();
  }, [chatId, adminUserId, isAuthenticated, setCurrentChatId, setChatData, setSheetMetaData, setLoading, setError, clearData]);

  // 로컬 스토리지에서 저장된 비율 불러오기
  useEffect(() => {
    const savedWidth = localStorage.getItem('admin-layout-split');
    if (savedWidth) {
      const width = parseFloat(savedWidth);
      if (width >= 10 && width <= 90) {
        setLeftWidth(width);
      }
    }
  }, []);

  // 비율 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('admin-layout-split', leftWidth.toString());
  }, [leftWidth]);

  // 재시도 함수
  const retryLoad = useCallback(async () => {
    if (!chatId || !adminUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      clearData();
      
      const data = await loadAdminChatSheetData(chatId);
      
      if (data.chat) {
        const convertedChat = {
          id: data.chat.id,
          title: data.chat.title,
          createdAt: new Date(data.chat.createdAt),
          updatedAt: new Date(data.chat.updatedAt),
          messageCount: data.chat.messageCount,
          status: data.chat.status as 'ACTIVE' | 'ARCHIVED' | 'DELETED',
          analytics: data.chat.analytics,
          userId: data.chat.userId,
          messages: data.chat.messages ? data.chat.messages.map((msg: any) => ({
            id: msg.id || Math.random().toString(),
            content: msg.content || '',
            timestamp: new Date(msg.timestamp || Date.now()),
            role: msg.role as 'USER' | 'EXTION_AI' | 'SYSTEM',
            type: msg.type as 'TEXT' | 'FILE_UPLOAD' | 'FORMULA' | 'VISUALIZATION' | 'DATA_GENERATION' | 'FUNCTION' | 'DATA_EDIT',
            mode: msg.mode,
            sheetContext: msg.sheetContext,
            formulaData: msg.formulaData,
            artifactData: msg.artifactData,
            dataChangeInfo: msg.dataChangeInfo,
            fileUploadInfo: msg.fileUploadInfo,
            metadata: msg.metadata,
          })) : []
        };
        setChatData(convertedChat);
      }
      
      if (data.sheetMetaData) {
        const convertedMetadata = {
          id: data.sheetMetaData.id,
          fileName: data.sheetMetaData.fileName,
          originalFileName: data.sheetMetaData.originalFileName,
          fileSize: data.sheetMetaData.fileSize,
          fileType: data.sheetMetaData.fileType,
          activeSheetIndex: data.sheetMetaData.activeSheetIndex,
          createdAt: new Date(data.sheetMetaData.createdAt),
          updatedAt: new Date(data.sheetMetaData.updatedAt),
          userId: data.sheetMetaData.userId,
          sheetTableData: data.sheetMetaData.sheetTableData ? data.sheetMetaData.sheetTableData.map((sheet: any) => ({
            id: sheet.id,
            name: sheet.name,
            index: sheet.index,
            data: sheet.data,
            createdAt: new Date(sheet.createdAt),
            updatedAt: new Date(sheet.updatedAt),
          })) : []
        };
        setSheetMetaData(convertedMetadata);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('재시도 실패:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [chatId, adminUserId, setChatData, setSheetMetaData, setLoading, setError, clearData]);

  // 에러 클리어 함수
  const clearErrorHandler = useCallback(() => {
    setError(null);
  }, [setError]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isMouseDownRef.current = true;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDownRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // 최소 20%, 최대 80%로 제한
    const clampedWidth = Math.min(Math.max(newLeftWidth, 20), 80);
    setLeftWidth(clampedWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    isMouseDownRef.current = false;
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 인증 로딩 중이거나 인증되지 않은 경우
  if (isAuthLoading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">관리자 권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <div className="w-full h-screen relative">
      {/* 관리자 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gray-600 text-white p-2 text-center text-sm">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-4 h-4" />
          <span>관리자 모드 - 채팅 ID: {chatId}</span>
          <button
            onClick={goBack}
            className="ml-4 flex items-center space-x-1 px-2 py-1 bg-blue-700 rounded hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>돌아가기</span>
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 - 관리자 헤더만큼 패딩 추가 */}
      <div 
        ref={containerRef}
        className="flex w-full h-full pt-12 relative"
      >
        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">관리자 데이터를 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4 max-w-md mx-auto p-6">
              <div className="text-red-500 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">데이터 로드 실패</h3>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={retryLoad}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    다시 시도
                  </button>
                  <button
                    onClick={clearErrorHandler}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 왼쪽 영역: AdminSheetRender - 독립적인 스크롤 영역 */}
        <div 
          className="h-full transition-all duration-100 ease-linear"
          style={{ 
            width: `${leftWidth}%`,
            transition: isDragging ? 'none' : 'width 0.1s ease'
          }}
        >
          <AdminSheetRender />
        </div>
        
        {/* 드래그 핸들 - 개선된 스타일링 */}
        <div
          onMouseDown={handleMouseDown}
          className={`
            w-2 h-full cursor-col-resize flex items-center justify-center relative z-50
            border-l border-r border-gray-300 transition-colors duration-200
            ${isDragging ? 'bg-blue-600' : 'bg-gray-200 hover:bg-blue-600'}
          `}
        >
          {/* 드래그 핸들 아이콘 - 더 명확한 시각적 피드백 */}
          <div className="flex flex-col items-center gap-0.5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`
                  w-0.5 h-0.5 rounded-full transition-colors duration-200
                  ${isDragging ? 'bg-white' : 'bg-gray-600'}
                `}
              />
            ))}
          </div>
        </div>
        
        {/* 오른쪽 영역: AdminChatRender - 독립적인 스크롤 영역 */}
        <div 
          className="h-full transition-all duration-100 ease-linear"
          style={{
            width: `${100 - leftWidth}%`,
            transition: isDragging ? 'none' : 'width 0.1s ease'
          }}
        >
          <AdminChatRender />
        </div>
      </div>
    </div>
  );
}

// 로딩 폴백 컴포넌트
function AdminSheetChatLoading() {
  return (
    <div className="flex w-full h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">관리자 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 - Suspense로 감싸기
export default function AdminSheetChatPage() {
  return (
    <Suspense fallback={<AdminSheetChatLoading />}>
      <AdminSheetChatContent />
    </Suspense>
  );
}