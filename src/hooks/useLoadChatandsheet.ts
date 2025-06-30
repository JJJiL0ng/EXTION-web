import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useUnifiedStore } from '@/stores';
import { 
  loadChatSheetData, 
  ChatSheetDataResponseDto, 
  SheetMetaDataWithTablesDto, 
  SheetTableDataDto 
} from '@/services/api/chatandsheetService';
import { XLSXData, SheetData } from '@/stores/store-types';

// 훅 상태 타입
interface LoadChatAndSheetState {
  isLoading: boolean;
  error: string | null;
  hasSheetData: boolean;
}

// 훅 반환 타입
interface UseLoadChatAndSheetReturn extends LoadChatAndSheetState {
  loadData: (chatId: string) => Promise<void>;
  retryLoad: () => Promise<void>;
  clearError: () => void;
}

export const useLoadChatandsheet = (): UseLoadChatAndSheetReturn => {
  const params = useParams();
  const chatIdFromUrl = params?.id as string;

  // 무한 루프 방지를 위한 ref들
  const lastLoadedChatIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  // 로컬 상태
  const [state, setState] = useState<LoadChatAndSheetState>({
    isLoading: false,
    error: null,
    hasSheetData: false,
  });

  // 스토어 액션들
  const {
    setCurrentChatId,
    setCurrentSheetMetaDataId,
    setXLSXData,
    updateChatSession,
    createNewChatSession,
    getChatSession,
    setSheetMetaData,
    setSaveStatus,
    currentChatId
  } = useUnifiedStore();

  // 시트 데이터를 XLSX 형태로 변환하는 함수
  const convertToXLSXData = useCallback(
    (sheetMetaData: SheetMetaDataWithTablesDto): XLSXData => {
      const sheets: SheetData[] = sheetMetaData.sheetTableData
        .sort((a, b) => a.index - b.index) // index 순으로 정렬
        .map((tableData: SheetTableDataDto) => ({
          sheetTableDataId: tableData.id,
          sheetName: tableData.name,
          rawData: Array.isArray(tableData.data) ? tableData.data : [],
          metadata: {
            rowCount: Array.isArray(tableData.data) ? tableData.data.length : 0,
            columnCount: Array.isArray(tableData.data) && tableData.data.length > 0 
              ? Math.max(...tableData.data.map(row => Array.isArray(row) ? row.length : 0))
              : 0,
            dataRange: {
              startRow: 0,
              endRow: Array.isArray(tableData.data) ? Math.max(0, tableData.data.length - 1) : 0,
              startCol: 0,
              endCol: Array.isArray(tableData.data) && tableData.data.length > 0 
                ? Math.max(0, Math.max(...tableData.data.map(row => Array.isArray(row) ? row.length : 0)) - 1)
                : 0,
              startColLetter: 'A',
              endColLetter: Array.isArray(tableData.data) && tableData.data.length > 0 
                ? String.fromCharCode(65 + Math.max(0, Math.max(...tableData.data.map(row => Array.isArray(row) ? row.length : 0)) - 1))
                : 'A'
            },
            preserveOriginalStructure: true,
            lastModified: tableData.updatedAt
          }
        }));

      return {
        fileName: sheetMetaData.fileName,
        sheets,
        activeSheetIndex: Math.max(0, sheetMetaData.activeSheetIndex),
        sheetMetaDataId: sheetMetaData.id
      };
    },
    []
  );

  // 메인 로드 함수
  const loadData = useCallback(
    async (chatId: string): Promise<void> => {
      if (!chatId) {
        setState(prev => ({ ...prev, error: '채팅 ID가 제공되지 않았습니다.' }));
        return;
      }

      // 이미 로딩 중이거나 같은 chatId를 이미 로드했다면 건너뛰기
      if (isLoadingRef.current || lastLoadedChatIdRef.current === chatId) {
        console.log('⏭️ 이미 로딩 중이거나 로드된 chatId, 건너뛰기:', chatId);
        return;
      }

      isLoadingRef.current = true;
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log('🔄 Chat과 Sheet 데이터 로드 시작:', chatId);

        // API 호출
        const response: ChatSheetDataResponseDto = await loadChatSheetData(chatId);
        
        console.log('✅ API 응답 받음:', response);

        // 채팅 ID 설정
        setCurrentChatId(chatId);

        // 시트 데이터가 있는 경우 처리
        if (response.sheetMetaData) {
          console.log('📊 시트 데이터 발견, 변환 시작');
          
          // 시트 메타데이터 ID 설정
          setCurrentSheetMetaDataId(response.sheetMetaData.id);

          // XLSX 데이터로 변환
          const xlsxData = convertToXLSXData(response.sheetMetaData);
          console.log('🔄 XLSX 데이터 변환 완료:', xlsxData);

          // 스토어에 설정
          setXLSXData(xlsxData);
          
          // 스프레드시트 메타데이터 설정
          setSheetMetaData({
            fileName: response.sheetMetaData.fileName,
            originalFileName: response.sheetMetaData.originalFileName,
            fileSize: response.sheetMetaData.fileSize,
            fileType: response.sheetMetaData.fileType as 'xlsx' | 'csv' | undefined,
            lastSaved: response.sheetMetaData.updatedAt,
            isSaved: true
          });

          // 저장 상태를 synced로 설정
          setSaveStatus('synced');

          setState(prev => ({ ...prev, hasSheetData: true }));
        } else {
          console.log('📭 시트 데이터 없음');
          
          // 시트 데이터가 없는 경우 초기화
          setCurrentSheetMetaDataId(null);
          setXLSXData(null);
          setSheetMetaData(null);
          
          setState(prev => ({ ...prev, hasSheetData: false }));
        }

        // 채팅 세션 업데이트 또는 생성
        let existingSession = getChatSession(chatId);
        if (!existingSession) {
          // 새 세션 생성 (기존 chatId 사용)
          createNewChatSession();
          // 생성된 세션의 chatId를 업데이트
          existingSession = getChatSession(chatId);
        }

        if (existingSession) {
          updateChatSession(chatId, {
            currentSheetMetaDataId: response.sheetMetaData?.id || null,
            sheetMetaData: response.sheetMetaData ? {
              fileName: response.sheetMetaData.fileName,
              originalFileName: response.sheetMetaData.originalFileName,
              fileSize: response.sheetMetaData.fileSize,
              fileType: response.sheetMetaData.fileType as 'xlsx' | 'csv' | undefined,
              lastSaved: response.sheetMetaData.updatedAt,
              isSaved: true
            } : null,
            hasUploadedFile: !!response.sheetMetaData,
            lastAccessedAt: new Date()
          });
        }

        console.log('✅ Chat과 Sheet 데이터 로드 완료');
        
        // 성공적으로 로드된 chatId 기록
        lastLoadedChatIdRef.current = chatId;

      } catch (error) {
        console.error('❌ Chat과 Sheet 데이터 로드 실패:', error);
        
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        setState(prev => ({ ...prev, error: errorMessage }));

        // 에러 발생 시 기본 상태로 설정
        setCurrentChatId(chatId); // chatId는 설정
        setCurrentSheetMetaDataId(null);
        setXLSXData(null);
        setSheetMetaData(null);
        
        // 에러 발생 시에도 chatId 기록 (재시도 방지)
        lastLoadedChatIdRef.current = chatId;
      } finally {
        isLoadingRef.current = false;
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    [convertToXLSXData] // 스토어 액션들은 안정적이므로 의존성에서 제거
  );

  // 재시도 함수
  const retryLoad = useCallback(async (): Promise<void> => {
    if (chatIdFromUrl) {
      // 재시도 시에는 이전 기록을 초기화하여 다시 로드 가능하게 함
      lastLoadedChatIdRef.current = null;
      await loadData(chatIdFromUrl);
    }
  }, [chatIdFromUrl, loadData]);

  // 에러 클리어 함수
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // URL의 chatId가 변경될 때 자동 로드
  useEffect(() => {
    if (chatIdFromUrl && 
        chatIdFromUrl !== lastLoadedChatIdRef.current && 
        !isLoadingRef.current) {
      console.log('🔄 URL chatId 변경 감지, 자동 로드:', chatIdFromUrl);
      loadData(chatIdFromUrl);
    }
  }, [chatIdFromUrl]); // loadData 의존성 제거

  return {
    ...state,
    loadData,
    retryLoad,
    clearError,
  };
};
