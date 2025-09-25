"use client";
import '@mescius/spread-sheets-resources-ko';
import '@mescius/spread-sheets-io';
import React, { useState, useRef, useEffect, useCallback, useMemo, useImperativeHandle } from "react";
import { useParams } from 'next/navigation';
// Hooks
import { useFileUploadIntegration } from '../../_hooks/sheet/file_upload_export/useFileUploadIntegration';
import { useFileExport } from '../../_hooks/sheet/file_upload_export/useFileExport';
// import { useChatVisibility } from '@/_contexts/ChatVisibilityContext';
import { useUIState } from '../../_hooks/sheet/common/useUIState';
import { useSpreadJSInit } from '../../_hooks/sheet/spreadjs/useSpreadJSInit';
import { useSheetCreate } from '../../_hooks/sheet/data_save/useSheetCreate';

// Stores
import { useSpreadsheetUploadStore } from '../../_store/sheet/spreadsheetUploadStore';
import useFileNameStore from '@/_store/sheet/fileNameStore';
import { useChattingComponentZindexStore } from '@/_store/handleZindex/chattingComponentZindexStore';

// Utils
import { getOrCreateGuestId } from '@/_utils/guestUtils';
import { configureLicense } from '../../_utils/sheet/spreadJSConfig';

// Components
import { SpreadSheetToolbar } from './SpreadSheetToolbar';
import { ChatButton } from './ChatButton';
import { FileUploadSheetRender } from './FileUploadSheetRender';


// SpreadJS 라이선싱 초기화
configureLicense();

interface MainSpreadSheetProps {
    spreadRef: React.MutableRefObject<any>;
}

export default function MainSpreadSheet({ spreadRef }: MainSpreadSheetProps) {
    // ============================================================================
    // 상태 및 참조 초기화
    // ============================================================================

    // URL 파라미터 추출
    const params = useParams();
    const spreadSheetId = params.SpreadSheetId as string;
    const chatId = params.ChatId as string;

    // 채팅 가시성 제어
    // const { isChatVisible, showChat } = useChatVisibility();

    // 통합된 UI 상태 관리
    const { uiState, actions: uiActions } = useUIState();

    // 파일 업로드 상태 관리 (Zustand)
    const { isFileUploaded, setIsFileUploaded } = useSpreadsheetUploadStore();

    // 채팅 z-index 상태 관리
    const { showChat, isVisible: isChatVisible } = useChattingComponentZindexStore();

    // 인증 상태 관리
    const userId = getOrCreateGuestId();

    console.log(`🔍 [MainSpreadSheet] 컴포넌트 렌더링:`, {
        spreadSheetId,
        chatId,
        isFileUploaded,
        // isChatVisible
    });

    // ============================================================================
    // 핵심 훅들 초기화
    // ============================================================================

    // AI 버튼 클릭 핸들러 - 통합된 상태 사용
    // const handleShowChat = useCallback(() => {
    //     console.log(`🤖 [MainSpreadSheet] 채팅 버튼 클릭`);
    //     uiActions.setShowChatButton(false); // 즉시 버튼 제거
    //     showChat(); // 채팅 열기
    // }, [showChat, uiActions]);

    // SpreadJS 호스트 스타일 설정
    const [hostStyle, setHostStyle] = useState({
        width: '100vw',
        height: '100vh',
        minWidth: '100%',
        boxSizing: 'border-box' as const,
    });

    // SpreadJS 초기화 훅
    const { initSpread, createNewSpreadsheet } = useSpreadJSInit({
        spreadRef,
    });

    // 스프레드시트 생성 훅
    const { loading: createLoading, error: createError, createSheet, reset: resetCreateState } = useSheetCreate();

    // ============================================================================
    // 통합 파일 업로드 훅 사용
    // ============================================================================

    /**
     * 파일 업로드 관련 모든 로직을 통합 관리하는 훅
     * - 드래그&드롭 처리
     * - 파일 선택 처리
     * - 업로드 상태 관리
     * - 자동 채팅 열기
     * - 스프레드시트 생성 API 호출
     */
    const {
        uploadState,
        isDragActive,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        handleFileSelect,
        handleUploadButtonClick,
        resetUploadState
    } = useFileUploadIntegration({
        spreadRef,
        onUploadSuccess: (fileName) => {
            console.log(`✅ [MainSpreadSheet] 파일 업로드 성공 콜백: ${fileName}`);
        },
        onUploadError: (error, fileName) => {
            console.error(`❌ [MainSpreadSheet] 파일 업로드 실패 콜백: ${fileName}`, error);
        }
    });

    // ============================================================================
    // 파일 내보내기 훅
    // ============================================================================

    /**
     * 파일 내보내기 기능을 제공하는 훅
     * - Excel, CSV, JSON 형식으로 내보내기 지원
     * - 내보내기 상태 추적
     */
    const {
        exportState,
        saveAsExcel,
        saveAsCSV,
        saveAsJSON,
        resetExportState
    } = useFileExport(spreadRef.current, {
        defaultFileName: 'spreadsheet',
        onExportSuccess: (fileName: string) => {
            console.log(`✅ [MainSpreadSheet] 파일 저장 성공: ${fileName}`);
        },
        onExportError: (error: Error) => {
            console.error(`❌ [MainSpreadSheet] 파일 저장 실패:`, error);
            alert(`파일 저장 중 오류가 발생했습니다: ${error.message}`);
        }
    });

    // ============================================================================
    // 메모리 관리 및 정리
    // ============================================================================

    /**
     * 메모리 관리를 위한 cleanup 함수
     * - 각종 상태 초기화
     * - SpreadJS 인스턴스 정리
     */
    const handleCleanup = useCallback(() => {
        console.log(`🧹 [MainSpreadSheet] 메모리 정리 시작`);

        // 업로드 상태 초기화
        try {
            resetUploadState();
            console.log(`✅ [MainSpreadSheet] 업로드 상태 초기화 완료`);
        } catch (error) {
            console.warn(`⚠️ [MainSpreadSheet] 업로드 상태 초기화 경고:`, error);
        }

        // 내보내기 상태 초기화
        try {
            resetExportState();
            console.log(`✅ [MainSpreadSheet] 내보내기 상태 초기화 완료`);
        } catch (error) {
            console.warn(`⚠️ [MainSpreadSheet] 내보내기 상태 초기화 경고:`, error);
        }

        // 스프레드시트 생성 상태 초기화
        try {
            resetCreateState();
            console.log(`✅ [MainSpreadSheet] 생성 상태 초기화 완료`);
        } catch (error) {
            console.warn(`⚠️ [MainSpreadSheet] 생성 상태 초기화 경고:`, error);
        }

        // SpreadJS 인스턴스 정리
        if (spreadRef.current) {
            try {
                spreadRef.current.destroy && spreadRef.current.destroy();
                console.log(`✅ [MainSpreadSheet] SpreadJS 인스턴스 정리 완료`);
            } catch (error) {
                console.warn(`⚠️ [MainSpreadSheet] SpreadJS 인스턴스 정리 경고:`, error);
            }
        }

        console.log(`✅ [MainSpreadSheet] 메모리 정리 완료`);
    }, [resetUploadState, resetExportState, resetCreateState, spreadRef]);

    // ============================================================================
    // Effect 훅들
    // ============================================================================

    /**
     * 컴포넌트 언마운트 시 메모리 정리
     */
    useEffect(() => {
        return () => {
            console.log(`🔄 [MainSpreadSheet] 컴포넌트 언마운트, 정리 작업 시작`);
            handleCleanup();
        };
    }, [handleCleanup]);

    /**
     * URL 파라미터 유효성 검증 및 디버깅
     */
    useEffect(() => {
        console.log(`🔍 [MainSpreadSheet] URL 파라미터 확인:`, { spreadSheetId, chatId });

        if (!spreadSheetId || !chatId) {
            console.warn(`⚠️ [MainSpreadSheet] 필수 URL 파라미터가 누락됨:`, { spreadSheetId, chatId });
        }
    }, [spreadSheetId, chatId]);

    /**
     * 화면 크기 변경 시 SpreadJS 크기 조정
     * - 파일 업로드 여부에 따라 높이 계산
     * - SpreadJS 인스턴스 리프레시
     */
    useEffect(() => {
        const handleResize = () => {
            const newHostStyle = {
                width: '100vw',
                height: isFileUploaded ? 'calc(100vh - 24px)' : '100vh',
                minWidth: '100%',
                boxSizing: 'border-box' as const,
            };

            console.log(`📐 [MainSpreadSheet] 화면 크기 조정:`, newHostStyle);
            setHostStyle(newHostStyle);

            // SpreadJS 인스턴스가 있으면 리사이즈
            if (spreadRef.current) {
                setTimeout(() => {
                    console.log(`🔄 [MainSpreadSheet] SpreadJS 리프레시 실행`);
                    spreadRef.current.refresh();
                }, 100);
            }
        };

        console.log(`📐 [MainSpreadSheet] 리사이즈 이벤트 리스너 등록`);
        window.addEventListener('resize', handleResize);

        // 최초 1회 적용 및 isFileUploaded 변경 시 높이 갱신
        handleResize();

        return () => {
            console.log(`📐 [MainSpreadSheet] 리사이즈 이벤트 리스너 제거`);
            window.removeEventListener('resize', handleResize);
        };
    }, [spreadRef, isFileUploaded]);

    /**
     * 채팅 가시성 변화에 따른 Chat 버튼 표시 지연 처리
     * - 채팅이 닫힐 때 300ms 지연 후 버튼 표시 (애니메이션 시간과 맞춤)
     */
    useEffect(() => {
        console.log(`💬 [MainSpreadSheet] useEffect 실행: isChatVisible=${isChatVisible}, showChatButton=${uiState.showChatButton}`);
        
        if (isChatVisible) {
            console.log(`💬 [MainSpreadSheet] 채팅 열림 - 버튼 숨김`);
            uiActions.setShowChatButton(false);
        } else if (!uiState.showChatButton) {
            // 채팅이 닫혀있고, 버튼이 숨겨진 상태일 때만 타이머 설정
            console.log(`💬 [MainSpreadSheet] 채팅 닫힘 - 300ms 후 버튼 표시 예약`);
            const timer = setTimeout(() => {
                console.log(`💬 [MainSpreadSheet] 채팅 버튼 표시`);
                uiActions.setShowChatButton(true);
            }, 300);

            return () => {
                console.log(`💬 [MainSpreadSheet] 채팅 버튼 타이머 해제`);
                clearTimeout(timer);
            };
        } else {
            console.log(`💬 [MainSpreadSheet] 조건 불충족 - 아무 작업 안함`);
        }
    }, [isChatVisible, uiState.showChatButton]);
    const higerChatZindex = () => {
        console.log('🤖 [MainSpreadSheet] higerChatZindex 호출');
        showChat(); // 채팅의 z인덱스를 높여서 채팅이 보이게 하는 로직
    }

    // ============================================================================
    // 이벤트 핸들러들
    // ============================================================================

    /**
     * 새 스프레드시트 생성 핸들러
     * - 빈 스프레드시트 생성
     * - 초기 데이터 구조 설정
     * - 백엔드 API 호출
     */
    const handleNewSpreadsheet = async () => {
        console.log(`📄 [MainSpreadSheet] 새 스프레드시트 생성 시작`);

        const success = createNewSpreadsheet();
        if (!success) {
            console.error(`❌ [MainSpreadSheet] 새 스프레드시트 생성 실패`);
            return;
        }

        try {
            // 새 스프레드시트의 초기 JSON 데이터 구조
            const initialJsonData = {
                fileName: '새 스프레드시트',
                sheets: [
                    {
                        name: 'Sheet1',
                        data: {}
                    }
                ],
                createdAt: new Date().toISOString(),
                type: 'new_spreadsheet'
            };

            console.log(`🚀 [MainSpreadSheet] 새 스프레드시트 API 호출:`, {
                fileName: '새 스프레드시트',
                spreadsheetId: spreadSheetId,
                chatId,
                userId
            });

            // 백엔드 API 호출
            await createSheet({
                fileName: '새 스프레드시트',
                spreadsheetId: spreadSheetId,
                chatId,
                userId,
                jsonData: initialJsonData
            });

            // 업로드 상태 초기화
            resetUploadState();
            console.log(`✅ [MainSpreadSheet] 새 스프레드시트 생성 완료`);

        } catch (error) {
            console.error(`❌ [MainSpreadSheet] 새 스프레드시트 생성 실패:`, error);
        }
    };

    // ============================================================================
    // 렌더링
    // ============================================================================

    return (
        <div className="w-full h-screen box-border flex flex-col bg-gray-50">
            {/* 숨겨진 파일 업로드 input - 통합 훅에서 관리 */}
            <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv,.sjs,.json"
                multiple
                onChange={handleFileSelect}
                disabled={uploadState.isUploading}
                className="hidden"
            />

            {/* 상단 툴바 및 상태 표시: 파일 업로드 후에만 표시 */}
            {isFileUploaded && (
                <div className="flex-shrink-0 w-full h-6 bg-white flex items-center justify-between">
                    {/* 스프레드시트 툴바 - 내보내기 및 새 파일 기능 */}
                    <SpreadSheetToolbar
                        onSaveAsExcel={() => {
                            console.log(`💾 [MainSpreadSheet] Excel 내보내기 요청`);
                            saveAsExcel();
                        }}
                        onSaveAsCSV={() => {
                            console.log(`💾 [MainSpreadSheet] CSV 내보내기 요청`);
                            saveAsCSV();
                        }}
                        onSaveAsJSON={() => {
                            console.log(`💾 [MainSpreadSheet] JSON 내보내기 요청`);
                            saveAsJSON();
                        }}
                        isExporting={exportState.isExporting}
                        onNewSpreadsheet={handleNewSpreadsheet}
                    />

                    {/* 채팅 버튼 - 조건부 표시 */}
                    <ChatButton
                        onClick={higerChatZindex}
                        isVisible={uiState.showChatButton}
                    />
                </div>
            )}

            {/* 파일 업로드되지 않은 상태에서도 채팅 버튼 표시 */}
            {!isFileUploaded && (
                <div className="absolute top-4 right-4 z-10">
                    <ChatButton
                        onClick={higerChatZindex}
                        isVisible={uiState.showChatButton}
                    />
                </div>
            )}

            {/* 파일 업로드 영역 및 SpreadJS 렌더링 */}
            <FileUploadSheetRender
                isFileUploaded={isFileUploaded}
                isDragActive={isDragActive}
                uploadState={uploadState}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onUploadButtonClick={handleUploadButtonClick}
                initSpread={initSpread}
                hostStyle={hostStyle}
            />
        </div>
    );
}
