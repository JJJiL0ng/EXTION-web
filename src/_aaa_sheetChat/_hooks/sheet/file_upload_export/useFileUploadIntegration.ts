import { useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFileUpload } from './useFileUpload';
import { useSheetCreate } from '../data_save/useSheetCreate';
import { useSpreadsheetUploadStore } from '../../../_store/sheet/spreadsheetUploadStore';
import useFileNameStore from '@/_aaa_sheetChat/_store/sheet/fileNameStore';
// import { useChatVisibility } from '@/_contexts/ChatVisibilityContext';
import { useUIState } from '../common/useUIState';
import { getOrCreateGuestId } from '@/_aaa_sheetChat/_utils/guestUtils';

/**
 * 파일 업로드 통합 훅의 설정 인터페이스
 */
interface UseFileUploadIntegrationProps {
  /** SpreadJS 인스턴스 참조 */
  spreadRef: React.MutableRefObject<any>;
  /** 파일 업로드 성공 시 콜백 */
  onUploadSuccess?: (fileName: string) => void;
  /** 파일 업로드 실패 시 콜백 */
  onUploadError?: (error: Error, fileName: string) => void;
}

/**
 * 파일 업로드 관련 모든 로직을 통합 관리하는 커스텀 훅
 *
 * 주요 기능:
 * - 파일 업로드 처리 (드래그&드롭, 클릭 선택)
 * - 자동 채팅 열기
 * - 스프레드시트 생성 API 호출
 * - UI 상태 관리 (드래그 상태, 업로드 상태)
 *
 * 
 * @param props - 훅 설정 옵션
 * @returns 파일 업로드 관련 상태와 핸들러들
 */
export const useFileUploadIntegration = ({
  spreadRef,
  onUploadSuccess,
  onUploadError
}: UseFileUploadIntegrationProps) => {
  // ============================================================================
  // 상태 및 참조
  // ============================================================================

  // URL 파라미터 추출
  const params = useParams();
  const spreadSheetId = params.SpreadSheetId as string;
  const chatId = params.ChatId as string;

  // 상태 관리 훅들
  // const { showChat } = useChatVisibility(); // 채팅 가시성 제어
  const { uiState, actions: uiActions } = useUIState(); // 통합 UI 상태
  const { setIsFileUploaded } = useSpreadsheetUploadStore(); // 파일 업로드 상태

  // 사용자 인증 정보
  const userId = getOrCreateGuestId();

  // 스프레드시트 생성 훅
  const { createSheet } = useSheetCreate();

  // ============================================================================
  // 파일 업로드 성공 핸들러
  // ============================================================================

  /**
   * 파일 업로드 성공 시 실행되는 통합 핸들러
   *
   * 처리 순서:
   * 1. 파일명 저장
   * 2. 첫번째 시트 활성화
   * 3. 업로드 상태 업데이트
   * 4. 자동 채팅 열기 (첫 번째만)
   * 5. 스프레드시트 생성 API 호출
   */
  const handleUploadSuccess = useCallback(async (fileName: string) => {
    console.log(`✅ [FileUploadIntegration] 파일 업로드 성공: ${fileName}`);

    try {
      // 1. 파일명 저장
      console.log(`📝 [FileUploadIntegration] 파일명 저장: ${fileName}`);
      useFileNameStore.setState({ fileName });

      // 2. 첫번째 시트 활성화
      if (spreadRef.current) {
        console.log(`🔄 [FileUploadIntegration] 첫번째 시트 활성화`);
        spreadRef.current.setActiveSheet(0);
      }

      // 3. 업로드 상태 업데이트
      console.log(`📊 [FileUploadIntegration] 업로드 상태 업데이트`);
      setIsFileUploaded(true, fileName);

      // 4. 자동 채팅 열기 (첫 번째만)
      // if (!uiState.hasAutoOpenedChat) {
      //   console.log(`🤖 [FileUploadIntegration] 자동 채팅 열기 예약 (0.5초 후)`);
      //   setTimeout(() => {
      //     console.log(`🤖 [FileUploadIntegration] 자동 채팅 열기 실행`);
      //     uiActions.setAutoOpenedChat(true);
      //     uiActions.setShowChatButton(false);
      //     showChat();
      //   }, 500);
      // }

      // 5. 스프레드시트 생성 API 호출
      console.log(`🚀 [FileUploadIntegration] 스프레드시트 생성 API 호출 시작`);

      // SpreadJS 데이터를 JSON으로 변환
      const jsonData = spreadRef.current?.toJSON({
        includeBindingSource: true,
        ignoreFormula: false,
        ignoreStyle: false,
        saveAsView: true,
        rowHeadersAsFrozenColumns: false,
        columnHeadersAsFrozenRows: false,
        includeAutoMergedCells: true,
        saveR1C1Formula: true,
        includeUnsupportedFormula: true,
        includeUnsupportedStyle: true
      });

      console.log(`📄 [FileUploadIntegration] JSON 변환 완료, 데이터 크기: ${JSON.stringify(jsonData).length}자`);

      // API 호출
      await createSheet({
        fileName,
        spreadsheetId: spreadSheetId,
        chatId,
        userId,
        jsonData
      });

      console.log(`✅ [FileUploadIntegration] 스프레드시트 생성 API 호출 성공`);

      // 성공 콜백 실행
      onUploadSuccess?.(fileName);

    } catch (error) {
      console.error(`❌ [FileUploadIntegration] 스프레드시트 생성 실패:`, error);
      onUploadError?.(error as Error, fileName);
    }
  }, [
    spreadRef,
    setIsFileUploaded,
    uiState.hasAutoOpenedChat,
    uiActions,
    // showChat,
    createSheet,
    spreadSheetId,
    chatId,
    userId,
    onUploadSuccess,
    onUploadError
  ]);

  // ============================================================================
  // 파일 업로드 훅 초기화
  // ============================================================================

  /**
   * 파일 업로드 핵심 로직을 담당하는 훅
   * 실제 파일 처리와 SpreadJS 데이터 로드를 담당
   */
  const {
    uploadState,
    uploadFiles,
    resetUploadState
  } = useFileUpload(spreadRef.current, {
    maxFileSize: 50 * 1024 * 1024, // 50MB 제한
    allowedExtensions: ['xlsx', 'xls', 'csv', 'json'], // 허용 확장자
    onUploadSuccess: handleUploadSuccess, // 성공 시 통합 핸들러 실행
    onUploadError: (error: Error, fileName: string) => {
      console.error(`❌ [FileUploadIntegration] 파일 업로드 실패: ${fileName}`, error);
      alert(`파일 업로드 중 오류가 발생했습니다: ${error.message}`);
      onUploadError?.(error, fileName);
    }
  });

  // ============================================================================
  // 드래그&드롭 이벤트 핸들러들
  // ============================================================================

  /**
   * 드래그 진입 시 처리
   * - 드래그 카운터 증가
   * - 드래그 활성 상태 설정
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log(`🎯 [FileUploadIntegration] 드래그 진입 감지`);
    uiActions.incrementDragCounter();

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      console.log(`📁 [FileUploadIntegration] 파일 드래그 감지, 드래그 상태 활성화`);
      uiActions.setDragActive(true);
    }
  }, [uiActions]);

  /**
   * 드래그 이탈 시 처리
   * - 드래그 카운터 감소
   * - 카운터가 0이 되면 드래그 상태 비활성화
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log(`🚪 [FileUploadIntegration] 드래그 이탈 감지`);
    uiActions.decrementDragCounter();
  }, [uiActions]);

  /**
   * 드래그 오버 시 처리
   * - 브라우저 기본 동작 방지
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * 드롭 시 처리
   * - 파일 추출 및 업로드 실행
   * - 드래그 상태 초기화
   */
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log(`📥 [FileUploadIntegration] 파일 드롭 감지`);
    uiActions.resetDragCounter();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) {
      console.log(`⚠️ [FileUploadIntegration] 드롭된 파일이 없음`);
      return;
    }

    // 드롭된 파일 정보 로그
    console.log(`📁 [FileUploadIntegration] 드래그&드롭으로 업로드할 파일들:`);
    Array.from(files).forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    });

    try {
      console.log(`🚀 [FileUploadIntegration] 드롭 파일 업로드 시작`);
      await uploadFiles(files);
    } catch (error) {
      console.error(`❌ [FileUploadIntegration] 드래그&드롭 업로드 실패:`, error);
    }
  }, [uploadFiles, uiActions]);

  // ============================================================================
  // 파일 선택 핸들러
  // ============================================================================

  /**
   * 파일 선택 다이얼로그를 통한 파일 선택 처리
   * - 선택된 파일들 업로드 실행
   * - 파일 입력 초기화
   */
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log(`⚠️ [FileUploadIntegration] 선택된 파일이 없음`);
      return;
    }

    // 선택된 파일 정보 로그
    console.log(`📁 [FileUploadIntegration] 클릭으로 선택한 파일들:`);
    Array.from(files).forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    });

    try {
      console.log(`🚀 [FileUploadIntegration] 선택 파일 업로드 시작`);
      await uploadFiles(files);
    } catch (error) {
      console.error(`❌ [FileUploadIntegration] 파일 선택 업로드 실패:`, error);
    }

    // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
    console.log(`🔄 [FileUploadIntegration] 파일 입력 초기화`);
    event.target.value = '';
  }, [uploadFiles]);

  // ============================================================================
  // 업로드 버튼 클릭 핸들러
  // ============================================================================

  /**
   * 업로드 버튼 클릭 시 파일 선택 다이얼로그 열기
   * - 업로드 중이 아닐 때만 실행
   */
  const handleUploadButtonClick = useCallback(() => {
    if (uploadState.isUploading) {
      console.log(`⚠️ [FileUploadIntegration] 업로드 중이므로 파일 선택 무시`);
      return;
    }

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      console.log(`🖱️ [FileUploadIntegration] 파일 선택 다이얼로그 열기`);
      fileInput.click();
    } else {
      console.error(`❌ [FileUploadIntegration] 파일 입력 엘리먼트를 찾을 수 없음`);
    }
  }, [uploadState.isUploading]);

  // ============================================================================
  // 디버깅을 위한 효과
  // ============================================================================

  /**
   * URL 파라미터 및 상태 변화 디버깅
   */
  useEffect(() => {
    console.log(`🔍 [FileUploadIntegration] URL 파라미터:`, { spreadSheetId, chatId });
    console.log(`📊 [FileUploadIntegration] 업로드 상태:`, uploadState);
    console.log(`🎨 [FileUploadIntegration] UI 상태:`, {
      isDragActive: uiState.isDragActive,
      hasAutoOpenedChat: uiState.hasAutoOpenedChat,
      showChatButton: uiState.showChatButton
    });

    if (!spreadSheetId || !chatId) {
      console.warn(`⚠️ [FileUploadIntegration] 필수 URL 파라미터가 누락됨:`, { spreadSheetId, chatId });
    }
  }, [spreadSheetId, chatId, uploadState, uiState]);

  // ============================================================================
  // 반환값
  // ============================================================================

  return {
    // 상태
    uploadState, // 업로드 진행 상태
    isDragActive: uiState.isDragActive, // 드래그 활성 상태

    // 드래그&드롭 핸들러들
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,

    // 파일 선택 핸들러들
    handleFileSelect,
    handleUploadButtonClick,

    // 유틸리티
    resetUploadState // 업로드 상태 초기화
  };
};