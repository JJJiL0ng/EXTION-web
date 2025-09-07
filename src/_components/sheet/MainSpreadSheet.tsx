"use client";
import '@mescius/spread-sheets-resources-ko';
import '@mescius/spread-sheets-io';
import React, { useState, useRef, useEffect, useCallback, useMemo, useImperativeHandle } from "react";
import { useParams } from 'next/navigation';
// Hooks
import { useFileUpload } from '../../_hooks/sheet/file_upload_export/useFileUpload';
import { useFileExport } from '../../_hooks/sheet/file_upload_export/useFileExport';
import { useSheetCreate } from '../../_hooks/sheet/data_save/useSheetCreate';
import { useSpreadSheetDelta } from '../../_hooks/sheet/data_save/useSpreadSheetDelta';
import { useChatVisibility } from '@/_contexts/ChatVisibilityContext';
import { useUIState } from '../../_hooks/sheet/common/useUIState';
import { useSpreadJSInit } from '../../_hooks/sheet/spreadjs/useSpreadJSInit';

// Stores
import { useSpreadsheetUploadStore } from '../../_store/sheet/spreadsheetUploadStore';

// Utils
import { getOrCreateGuestId } from '@/_utils/guestUtils';
import { FileConverter } from '../../_utils/sheet/fileConverters';
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
    // URL 파라미터 추출
    const params = useParams();
    const spreadSheetId = params.SpreadSheetId as string;
    const chatId = params.ChatId as string;

    // 채팅 가시성 제어
    const { isChatVisible, showChat } = useChatVisibility();

    // 통합된 UI 상태 관리
    const { uiState, actions: uiActions } = useUIState();

    // 파일 업로드 상태 관리 (Zustand)
    const { isFileUploaded, setIsFileUploaded } = useSpreadsheetUploadStore();

    // 인증 상태 관리
    const userId = getOrCreateGuestId();

    // resetUploadState 함수의 ref 저장 (무한 루프 방지)
    const resetUploadStateRef = useRef<(() => void) | null>(null);

    // deltaManager ref 저장 (무한 루프 방지)
    const deltaManagerRef = useRef<typeof deltaManager | null>(null);

    // AI 버튼 클릭 핸들러 - 통합된 상태 사용
    const handleShowChat = useCallback(() => {
        uiActions.setShowChatButton(false); // 즉시 버튼 제거
        showChat(); // 채팅 열기
    }, [showChat, uiActions]);

    const [hostStyle, setHostStyle] = useState({
        width: '100vw',
        height: '100vh',
        minWidth: '100%',
        boxSizing: 'border-box' as const,
    });

    // SpreadJS 인스턴스 참조 (props로 받음)
    // const spreadRef = useRef<any>(null); // 제거됨 - props로 받음

    // 명령어 관리 Hook (page.tsx로 이동됨)
    // const commandManager = useSpreadjsCommandManager(...) 제거됨

    // 스프레드시트 생성 훅
    const {
        isCreating,
        error: createError,
        createSheetWithDefaults,
        resetState: resetCreateState,
        clearError: clearCreateError
    } = useSheetCreate({
        onSuccess: (sheet) => {
            console.log(`✅ 스프레드시트 생성 성공:`, sheet);
        },
        onError: (error) => {
            console.error(`❌ 스프레드시트 생성 실패:`, error);
            alert(`스프레드시트 생성 중 오류가 발생했습니다: ${error.message}`);
        }
    });

    // 델타 자동저장 훅
    const deltaManager = useSpreadSheetDelta({
        userId: userId,
        spreadsheetId: spreadSheetId,
        batchTimeout: 500,
        maxRetries: 3,
        maxBatchSize: 50,
        onDeltaApplied: (delta) => {
            console.log('✅ 델타 적용 성공:', delta);
        },
        onError: (error, context) => {
            console.error('❌ 델타 처리 실패:', error, context);

            // 서버 오류인 경우 사용자에게 알림
            if (context?.serverError) {
                console.warn('🚫 백엔드 서버 오류로 인해 자동저장이 비활성화되었습니다.');
            }
        },
        onSync: (syncedDeltas) => {
            console.log(`🔄 ${syncedDeltas}개 델타 동기화 완료`);
        }
    });

    // SpreadJS 초기화 훅
    const { initSpread, createNewSpreadsheet } = useSpreadJSInit({
        spreadRef,
        deltaManager
    });

    // 파일 업로드 훅
    const {
        uploadState,
        uploadFiles,
        resetUploadState
    } = useFileUpload(spreadRef.current, {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedExtensions: ['xlsx', 'xls', 'csv', 'json'],
        onUploadSuccess: async (fileName: string, fileData: any) => {
            console.log(`✅ 파일 업로드 성공: ${fileName}`);


            // 첫번째 시트를 활성 시트로 설정
            spreadRef.current.setActiveSheet(0);


            // 파일 업로드 상태 업데이트
            setIsFileUploaded(true, fileName);

            // 파일 업로드 후 0.5초 뒤에 Chat 버튼 자동 클릭 (딱 한번만)
            if (!uiState.hasAutoOpenedChat) {
                setTimeout(() => {
                    uiActions.setAutoOpenedChat(true); // 자동 열기 완료 표시
                    handleShowChat(); // Chat 버튼 자동 클릭
                }, 500);
            }

            // 파일 업로드 후 스프레드시트 생성 API 호출
            try {
                // 사용자 ID 가져오기 (로그인 사용자 또는 게스트)
                const currentUserId = userId;

                // 파일 데이터를 JSON으로 변환 (새로운 FileConverter 사용)
                const jsonData = spreadRef.current.toJSON({
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

                console.log('🔄 JSON 변환된 데이터:', jsonData);

                await createSheetWithDefaults(
                    fileName, // 업로드된 파일명을 스프레드시트명으로 사용
                    spreadSheetId, // URL에서 추출한 spreadSheetId
                    chatId, // URL에서 추출한 chatId
                    currentUserId, // 사용자 ID (로그인 또는 게스트)
                    jsonData // JSON으로 변환된 파일 데이터를 초기 데이터로 사용
                );
            } catch (error) {
                console.error('스프레드시트 생성 실패:', error);
                // createSheetWithDefaults의 onError에서 이미 처리됨
            }
        },
        onUploadError: (error: Error, fileName: string) => {
            console.error(`❌ 파일 업로드 실패: ${fileName}`, error);
            alert(`파일 업로드 중 오류가 발생했습니다: ${error.message}`);
        }
    });

    // 파일 내보내기 훅
    const {
        exportState,
        saveAsExcel,
        saveAsCSV,
        saveAsJSON,
        resetExportState
    } = useFileExport(spreadRef.current, {
        defaultFileName: 'spreadsheet',
        onExportSuccess: (fileName: string) => {
            console.log(`✅ 파일 저장 성공: ${fileName}`);
        },
        onExportError: (error: Error) => {
            console.error('❌ 파일 저장 실패:', error);
            alert(`파일 저장 중 오류가 발생했습니다: ${error.message}`);
        }
    });

    // 함수들을 ref에 저장 (무한 루프 방지)
    resetUploadStateRef.current = resetUploadState;
    deltaManagerRef.current = deltaManager;

    // 메모리 관리를 위한 cleanup 함수
    const handleCleanup = useCallback(() => {
        // resetUploadState를 ref를 통해 호출하여 의존성 제거
        try {
            resetUploadStateRef.current?.();
        } catch (error) {
            console.warn('resetUploadState cleanup warning:', error);
        }

        try {
            resetExportState();
        } catch (error) {
            console.warn('resetExportState cleanup warning:', error);
        }

        try {
            resetCreateState();
        } catch (error) {
            console.warn('resetCreateState cleanup warning:', error);
        }

        try {
            clearCreateError();
        } catch (error) {
            console.warn('clearCreateError cleanup warning:', error);
        }

        if (spreadRef.current) {
            try {
                // 델타 이벤트 리스너 정리
                if ((spreadRef.current as any)._deltaCleanup) {
                    (spreadRef.current as any)._deltaCleanup();
                }

                // 남은 델타들 강제 동기화
                deltaManagerRef.current?.forcSync().catch(console.error);

                spreadRef.current.destroy && spreadRef.current.destroy();
            } catch (error) {
                console.warn('Cleanup warning:', error);
            }
        }
    }, [resetExportState, resetCreateState, clearCreateError, spreadRef]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            handleCleanup();
        };
    }, [handleCleanup]);

    // URL 파라미터 확인 및 디버깅
    useEffect(() => {
        console.log('🔍 URL 파라미터 확인:', { spreadSheetId, chatId });

        if (!spreadSheetId || !chatId) {
            console.warn('⚠️ 필수 URL 파라미터가 누락되었습니다:', { spreadSheetId, chatId });
        }
    }, [spreadSheetId, chatId]);

    // 화면 크기 변경 시 SpreadJS 크기 조정
    useEffect(() => {
        const handleResize = () => {
            setHostStyle({
                width: '100vw',
                height: isFileUploaded ? 'calc(100vh - 24px)' : '100vh',
                minWidth: '100%',
                boxSizing: 'border-box' as const,
            });

            // SpreadJS 인스턴스가 있으면 리사이즈
            if (spreadRef.current) {
                setTimeout(() => {
                    spreadRef.current.refresh();
                }, 100);
            }
        };

        window.addEventListener('resize', handleResize);
        // 최초 1회 적용 및 isFileUploaded 변경 시 높이 갱신
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [spreadRef, isFileUploaded]);


    // 채팅 가시성 변화에 따른 Chat 버튼 표시 지연 처리
    useEffect(() => {
        if (isChatVisible) {
            // 채팅이 열릴 때는 handleShowChat에서 이미 처리했으므로 아무것도 하지 않음
            return;
        } else {
            // 채팅이 닫힐 때는 300ms 지연 후 버튼 표시 (채팅 닫힘 애니메이션 시간과 맞춤)
            const timer = setTimeout(() => {
                uiActions.setShowChatButton(true);
            }, 300); // 300ms 지연

            return () => clearTimeout(timer);
        }
    }, [isChatVisible, uiActions]);


    // 드래그&드롭 이벤트 핸들러들
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        uiActions.incrementDragCounter();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            uiActions.setDragActive(true);
        }
    }, [uiActions]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        uiActions.decrementDragCounter();
    }, [uiActions]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        uiActions.resetDragCounter();

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        try {
            await uploadFiles(files);
        } catch (error) {
            console.error('드래그&드롭 업로드 실패:', error);
        }
    }, [uploadFiles, uiActions]);

    // 파일 선택 버튼 클릭 (단순화됨)
    const handleUploadButtonClick = () => {
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput && !uploadState.isUploading) {
            fileInput.click();
        }
    };

    // 통합 파일 업로드 핸들러 (단일/다중 자동 처리)
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        try {
            // 새로운 통합 업로드 함수 사용
            await uploadFiles(files);
        } catch (error) {
            // 오류는 이미 훅에서 처리됨
        }

        // 파일 입력 초기화
        event.target.value = '';
    };

    // 새 스프레드시트 생성 핸들러
    const handleNewSpreadsheet = async () => {
        const success = createNewSpreadsheet();
        if (!success) return;

        try {
            // 사용자 ID 가져오기 (로그인 사용자 또는 게스트)
            const currentUserId = userId;

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

            await createSheetWithDefaults(
                '새 스프레드시트',
                spreadSheetId,
                chatId,
                userId,
                initialJsonData
            );

            // 업로드 상태 초기화
            resetUploadStateRef.current?.();
            console.log('✅ 새 스프레드시트 생성 완료');
        } catch (error) {
            console.error('스프레드시트 생성 실패:', error);
        }
    };

    return (
        <div className="w-full h-screen box-border flex flex-col bg-gray-50">
            {/* 숨겨진 파일 업로드 input (항상 렌더링) */}
            <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv,.sjs,.json"
                multiple
                onChange={handleFileUpload}
                disabled={uploadState.isUploading}
                className="hidden"
            />

            {/* 상단 툴바 및 상태 표시: 파일 업로드 후에만 표시 */}
            {isFileUploaded && (
                <div className="flex-shrink-0 w-full h-6 bg-white flex items-center justify-between ">
                    <SpreadSheetToolbar
                        onSaveAsExcel={() => saveAsExcel()}
                        onSaveAsCSV={() => saveAsCSV()}
                        onSaveAsJSON={() => saveAsJSON()}
                        isExporting={exportState.isExporting}
                        onNewSpreadsheet={handleNewSpreadsheet}
                    />

                    {/* <StatusDisplay
                        uploadState={uploadState}
                        exportState={exportState}
                        isCreating={isCreating}
                        createError={createError}
                        deltaManager={deltaManager}
                    /> */}

                    <ChatButton
                        onClick={handleShowChat}
                        isVisible={uiState.showChatButton}
                    />
                </div>
            )}

            {/* 파일 업로드 영역 및 SpreadJS */}
            <FileUploadSheetRender
                isFileUploaded={isFileUploaded}
                isDragActive={uiState.isDragActive}
                uploadState={uploadState}
                onUploadButtonClick={handleUploadButtonClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                initSpread={initSpread}
                hostStyle={hostStyle}
            />
        </div>
    );
}
