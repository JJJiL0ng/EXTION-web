"use client";
import '@mescius/spread-sheets-resources-ko';
import '@mescius/spread-sheets-io';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { SpreadSheets, Worksheet, Column } from "@mescius/spread-sheets-react";
import * as GC from "@mescius/spread-sheets";
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFileUpload } from '../../_hooks/sheet/useFileUpload';
import { useFileExport } from '../../_hooks/sheet/useFileExport';
import { useSheetCreate } from '../../_hooks/sheet/useSheetCreate';
import { useChatVisibility } from '@/_contexts/ChatVisibilityContext';
import { useAuthStore } from '@/stores/authStore';
import { useSpreadsheetUploadStore } from '../../_store/sheet/spreadsheetUploadStore';
import { getOrCreateGuestId } from '@/_utils/guestUtils';

// SpreadJS 라이선싱
// var SpreadJSKey = "xxx";          // 라이선스 키 입력
// GC.Spread.Sheets.LicenseKey = SpreadJSKey;
GC.Spread.Common.CultureManager.culture("ko-kr");

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
    
    // 파일 업로드 상태 관리 (Zustand)
    const { isFileUploaded, setIsFileUploaded } = useSpreadsheetUploadStore();
    
    // 인증 상태 관리
    const { user } = useAuthStore();
    
    // 사용자 ID 가져오기 (로그인 사용자 또는 게스트)
    const getUserId = useCallback(() => {
        if (user?.uid) {
            // 로그인된 사용자의 경우 Firebase uid 사용
            return user.uid;
        } else {
            // 비로그인 사용자의 경우 guest ID 생성/사용
            return getOrCreateGuestId();
        }
    }, [user?.uid]);
    
    // Chat 버튼 표시 상태 (지연된 렌더링용)
    const [showChatButton, setShowChatButton] = useState(!isChatVisible);
    
    // 파일 업로드 후 자동 채팅 열기 상태 관리
    const [hasAutoOpenedChat, setHasAutoOpenedChat] = useState(false);

    // AI 버튼 클릭 핸들러 - 즉시 버튼 숨김
    const handleShowChat = () => {
        setShowChatButton(false); // 즉시 버튼 제거
        showChat(); // 채팅 열기
    };

    const [hostStyle, setHostStyle] = useState({
        width: '100vw',
        height: 'calc(100vh - 24px)', // 상단 바 높이(24px)를 제외한 전체 화면
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
        createdSheet,
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

    // 파일 데이터를 JSON으로 변환하는 함수 (SpreadJS 유틸리티 활용)
    const convertFileDataToJson = useCallback(async (fileData: any, fileName: string): Promise<Record<string, any>> => {
        try {
            // 이미 JSON 객체인 경우 그대로 반환 (Blob이나 File 객체가 아닌 경우)
            if (typeof fileData === 'object' && fileData !== null &&
                !(fileData instanceof Blob) && !(fileData instanceof File)) {
                return fileData;
            }

            // 파일 확장자 확인
            const fileExtension = fileName.toLowerCase().split('.').pop();

            // Excel 파일 (.xlsx, .xls) 처리
            if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                return new Promise((resolve, reject) => {
                    if (!spreadRef.current) {
                        reject(new Error('SpreadJS 인스턴스가 없습니다.'));
                        return;
                    }

                    // 임시 워크북 생성
                    const tempWorkbook = new GC.Spread.Sheets.Workbook(document.createElement('div'));

                    tempWorkbook.import(
                        fileData,
                        (result: any) => {
                            try {
                                // SpreadJS JSON 형태로 변환
                                const jsonData = tempWorkbook.toJSON({
                                    includeBindingSource: true,
                                    ignoreFormula: false,
                                    ignoreStyle: false,
                                    saveAsView: true,
                                    rowHeadersAsFrozenColumns: true,
                                    columnHeadersAsFrozenRows: true,
                                    includeAutoMergedCells: true,
                                    saveR1C1Formula: true
                                });

                                // 메타데이터 추가
                                const result = {
                                    fileName: fileName,
                                    originalType: 'excel',
                                    spreadsheetData: jsonData,
                                    timestamp: new Date().toISOString(),
                                    fileExtension: fileExtension
                                };

                                // 임시 워크북 정리
                                tempWorkbook.destroy();
                                resolve(result);
                            } catch (error) {
                                tempWorkbook.destroy();
                                reject(error);
                            }
                        },
                        (error: any) => {
                            tempWorkbook.destroy();
                            reject(new Error(`Excel 파일 변환 실패: ${error.message || error}`));
                        },
                        {
                            fileType: fileExtension === 'xlsx' ?
                                GC.Spread.Sheets.FileType.excel :
                                GC.Spread.Sheets.FileType.excel
                        }
                    );
                });
            }

            // CSV 파일 처리
            if (fileExtension === 'csv') {
                return new Promise((resolve, reject) => {
                    if (!spreadRef.current) {
                        reject(new Error('SpreadJS 인스턴스가 없습니다.'));
                        return;
                    }

                    // 임시 워크북 생성
                    const tempWorkbook = new GC.Spread.Sheets.Workbook(document.createElement('div'));

                    tempWorkbook.import(
                        fileData,
                        (result: any) => {
                            try {
                                // SpreadJS JSON 형태로 변환
                                const jsonData = tempWorkbook.toJSON({
                                    includeBindingSource: true,
                                    ignoreFormula: false,
                                    ignoreStyle: false,
                                    saveAsView: true,
                                    rowHeadersAsFrozenColumns: true,
                                    columnHeadersAsFrozenRows: true,
                                    includeAutoMergedCells: true,
                                    saveR1C1Formula: true
                                });

                                // 메타데이터 추가
                                const result = {
                                    fileName: fileName,
                                    originalType: 'csv',
                                    spreadsheetData: jsonData,
                                    timestamp: new Date().toISOString(),
                                    fileExtension: fileExtension
                                };

                                // 임시 워크북 정리
                                tempWorkbook.destroy();
                                resolve(result);
                            } catch (error) {
                                tempWorkbook.destroy();
                                reject(error);
                            }
                        },
                        (error: any) => {
                            tempWorkbook.destroy();
                            reject(new Error(`CSV 파일 변환 실패: ${error.message || error}`));
                        },
                        {
                            fileType: GC.Spread.Sheets.FileType.csv
                        }
                    );
                });
            }

            // JSON 파일 처리
            if (fileExtension === 'json') {
                if (typeof fileData === 'string') {
                    try {
                        const parsedJson = JSON.parse(fileData);
                        return {
                            fileName: fileName,
                            originalType: 'json',
                            spreadsheetData: parsedJson,
                            timestamp: new Date().toISOString(),
                            fileExtension: fileExtension
                        };
                    } catch {
                        return {
                            fileName: fileName,
                            originalType: 'json',
                            content: fileData,
                            error: 'JSON 파싱 실패',
                            timestamp: new Date().toISOString(),
                            fileExtension: fileExtension
                        };
                    }
                }
            }

            // SJS (SpreadJS 네이티브) 파일 처리
            if (fileExtension === 'sjs') {
                if (typeof fileData === 'string') {
                    try {
                        const parsedSjs = JSON.parse(fileData);
                        return {
                            fileName: fileName,
                            originalType: 'sjs',
                            spreadsheetData: parsedSjs,
                            timestamp: new Date().toISOString(),
                            fileExtension: fileExtension
                        };
                    } catch {
                        return {
                            fileName: fileName,
                            originalType: 'sjs',
                            content: fileData,
                            error: 'SJS 파싱 실패',
                            timestamp: new Date().toISOString(),
                            fileExtension: fileExtension
                        };
                    }
                }
            }

            // 문자열인 경우 JSON 파싱 시도
            if (typeof fileData === 'string') {
                try {
                    const parsedData = JSON.parse(fileData);
                    return {
                        fileName: fileName,
                        originalType: 'text',
                        spreadsheetData: parsedData,
                        timestamp: new Date().toISOString(),
                        fileExtension: fileExtension
                    };
                } catch {
                    // JSON 파싱 실패 시 문자열을 객체로 감싸서 반환
                    return {
                        fileName: fileName,
                        originalType: 'text',
                        content: fileData,
                        timestamp: new Date().toISOString(),
                        fileExtension: fileExtension
                    };
                }
            }

            // 기타 타입의 경우 기본 구조로 감싸서 반환
            return {
                fileName: fileName,
                originalType: typeof fileData,
                data: fileData,
                timestamp: new Date().toISOString(),
                fileExtension: fileExtension
            };

        } catch (error) {
            console.warn('파일 데이터 JSON 변환 실패:', error);
            // 변환 실패 시 기본 구조 반환
            return {
                fileName: fileName,
                originalType: 'unknown',
                error: `Failed to convert file data: ${error instanceof Error ? error.message : error}`,
                timestamp: new Date().toISOString()
            };
        }
    }, [spreadRef]);

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

            // 파일 업로드 상태 업데이트
            setIsFileUploaded(true, fileName);

            // 파일 업로드 후 0.5초 뒤에 Chat 버튼 자동 클릭 (딱 한번만)
            if (!hasAutoOpenedChat) {
                setTimeout(() => {
                    setHasAutoOpenedChat(true); // 자동 열기 완료 표시
                    handleShowChat(); // Chat 버튼 자동 클릭
                }, 500);
            }

            // 파일 업로드 후 스프레드시트 생성 API 호출
            try {
                // 사용자 ID 가져오기 (로그인 사용자 또는 게스트)
                const userId = getUserId();
                console.log('🔍 사용자 ID:', userId, user?.uid ? '(로그인)' : '(게스트)');

                // 파일 데이터를 JSON으로 변환 (async 함수이므로 await 사용)
                const jsonData = await convertFileDataToJson(fileData, fileName);
                console.log('🔄 JSON 변환된 데이터:', jsonData);

                await createSheetWithDefaults(
                    fileName, // 업로드된 파일명을 스프레드시트명으로 사용
                    spreadSheetId, // URL에서 추출한 spreadSheetId
                    chatId, // URL에서 추출한 chatId
                    userId, // 사용자 ID (로그인 또는 게스트)
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

    // 메모리 관리를 위한 cleanup 함수
    const handleCleanup = useCallback(() => {
        resetUploadState();
        resetExportState();
        resetCreateState();
        clearCreateError();
        if (spreadRef.current) {
            try {
                spreadRef.current.destroy && spreadRef.current.destroy();
            } catch (error) {
                console.warn('Cleanup warning:', error);
            }
        }
    }, [resetUploadState, resetExportState, resetCreateState, clearCreateError, spreadRef]);

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
                height: 'calc(100vh - 24px)',
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
        return () => window.removeEventListener('resize', handleResize);
    }, [spreadRef]);

    // 파일 업로드 모달 상태
    const [showUploadModal, setShowUploadModal] = useState(false);

    // 파일 업로드 상태에 따른 모달 표시/숨김 처리
    useEffect(() => {
        if (!isFileUploaded) {
            // 파일이 업로드되지 않았다면 모달 표시
            const timer = setTimeout(() => {
                setShowUploadModal(true);
            }, 500); // 컴포넌트가 완전히 렌더링된 후 실행

            return () => clearTimeout(timer);
        } else {
            // 파일이 업로드되었다면 모달 숨김
            setShowUploadModal(false);
        }
    }, [isFileUploaded]); // isFileUploaded 상태 변화 감지

    // 채팅 가시성 변화에 따른 Chat 버튼 표시 지연 처리
    useEffect(() => {
        if (isChatVisible) {
            // 채팅이 열릴 때는 handleShowChat에서 이미 처리했으므로 아무것도 하지 않음
            return;
        } else {
            // 채팅이 닫힐 때는 300ms 지연 후 버튼 표시 (채팅 닫힘 애니메이션 시간과 맞춤)
            const timer = setTimeout(() => {
                setShowChatButton(true);
            }, 300); // 300ms 지연

            return () => clearTimeout(timer);
        }
    }, [isChatVisible]);

    const initSpread = function (spread: any) {
        try {
            // SpreadJS 인스턴스 저장
            spreadRef.current = spread;

            // 성능 최적화 설정
            configurePerformanceSettings(spread);

            // 기본 시트 설정 - 성능 최적화된 크기
            const sheet = spread.getActiveSheet();
            sheet.setRowCount(100);  // 기본 100행
            sheet.setColumnCount(26); // 기본 26열

            // 가상화 및 성능 설정
            sheet.suspendPaint();

            try {
                // 기본 데이터 설정
                setupDefaultData(sheet);
                setupDefaultStyles(sheet);
            } finally {
                sheet.resumePaint();
            }

            console.log('✅ SpreadJS 초기화 완료 - 최적화된 설정 적용');

        } catch (error) {
            console.error('❌ SpreadJS 초기화 실패:', error);
        }
    };

    // 성능 최적화 설정
    const configurePerformanceSettings = (spread: any) => {
        try {
            const options = spread.options;
            options.calcOnDemand = true;
            options.allowUserResize = true;
            options.allowUserDragDrop = false;
            options.allowUserDragFill = true;
            options.scrollIgnoreHidden = true;
            options.scrollByPixel = false;
            options.referenceStyle = GC.Spread.Sheets.ReferenceStyle.a1;

            spread.getHost().style.overflow = 'auto';
            spread.getHost().style.rowHeaderVisible = true;
            spread.getHost().style.colHeaderVisible = true;

            console.log('🔧 성능 최적화 설정 완료');
        } catch (error) {
            console.warn('⚠️ 성능 설정 경고:', error);
        }
    };

    // 기본 데이터 설정
    const setupDefaultData = (sheet: any) => {
        sheet.setValue(1, 1, "");
    };

    // 기본 스타일 설정
    const setupDefaultStyles = (sheet: any) => {
        sheet.setColumnWidth(1, 200);
        sheet.setColumnWidth(2, 200);
    };

    // 파일 업로드 모달에서 파일 선택 버튼 클릭
    const handleUploadButtonClick = () => {
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput && !uploadState.isUploading) {
            // 파일 선택 취소 감지를 위한 이벤트 리스너 추가
            const handleCancel = () => {
                // 파일 선택이 취소되었는지 확인 (약간의 지연 후)
                setTimeout(() => {
                    if (!fileInput.files || fileInput.files.length === 0) {
                        // 파일이 선택되지 않았다면 모달 다시 표시
                        if (!isFileUploaded) {
                            setShowUploadModal(true);
                        }
                    }
                }, 100);
                
                // 이벤트 리스너 제거
                fileInput.removeEventListener('cancel', handleCancel);
                window.removeEventListener('focus', handleCancel);
            };

            // 파일 선택 취소 이벤트 리스너 등록
            fileInput.addEventListener('cancel', handleCancel);
            // 윈도우 포커스로도 취소 감지 (일부 브라우저에서 cancel 이벤트가 작동하지 않을 수 있음)
            window.addEventListener('focus', handleCancel);
            
            fileInput.click();
            setShowUploadModal(false); // 모달 닫기
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

    // 새 스프레드시트 생성 (최적화됨)
    const handleNewSpreadsheet = async () => {
        if (spreadRef.current) {
            try {
                spreadRef.current.clearSheets();
                spreadRef.current.addSheet(0);
                const sheet = spreadRef.current.getActiveSheet();
                sheet.name("Sheet1");

                // 새 시트에 최적화 설정 적용
                sheet.setRowCount(100);
                sheet.setColumnCount(26);
                configurePerformanceSettings(spreadRef.current);

                // 빈 스프레드시트로 백엔드에 생성 요청
                try {
                    // 사용자 ID 가져오기 (로그인 사용자 또는 게스트)
                    const userId = getUserId();
                    console.log('🔍 새 스프레드시트 생성 - 사용자 ID:', userId, user?.uid ? '(로그인)' : '(게스트)');

                    // 새 스프레드시트의 초기 JSON 데이터 구조
                    const initialJsonData = {
                        fileName: '새 스프레드시트',
                        sheets: [
                            {
                                name: 'Sheet1',
                                data: {},
                                rowCount: 100,
                                columnCount: 26
                            }
                        ],
                        createdAt: new Date().toISOString(),
                        type: 'new_spreadsheet'
                    };

                    await createSheetWithDefaults(
                        '새 스프레드시트', // 기본 파일명
                        spreadSheetId, // URL에서 추출한 spreadSheetId
                        chatId, // URL에서 추출한 chatId
                        userId, // 사용자 ID (로그인 또는 게스트)
                        initialJsonData // 구조화된 JSON 초기 데이터
                    );
                } catch (error) {
                    console.error('스프레드시트 생성 실패:', error);
                    // createSheetWithDefaults의 onError에서 이미 처리됨
                }

                // 업로드 상태 초기화
                resetUploadState();
                console.log('✅ 새 스프레드시트 생성 완료 (최적화됨)');
            } catch (error) {
                console.error('❌ 새 스프레드시트 생성 실패:', error);
            }
        }
    };

    return (
        <div className="w-full h-screen box-border flex flex-col bg-gray-50">
            {/* 구글 스프레드시트 스타일 상단 바 */}
            <div className="flex-shrink-0">
                <div className="w-full h-6 bg-white flex items-center px-2 box-border">
                    <div className="flex items-center space-x-6">
                        {/* 홈으로 가기 */}
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="px-2 pl-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                        >
                            <Image src="/logo.png" alt="Logo" width={16} height={16} />
                        </button>

                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            홈
                        </button>

                        {/* 숨겨진 파일 업로드 input */}
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls,.csv,.sjs,.json"
                            multiple
                            onChange={handleFileUpload}
                            disabled={uploadState.isUploading}
                            className="hidden"
                        />

                        {/* 내보내기 드롭다운 */}
                        <div className="relative group">
                            <button className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                                내보내기
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* 드롭다운 메뉴 */}
                            <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-10">
                                <div className="py-1">
                                    <button
                                        onClick={() => saveAsExcel()}
                                        disabled={exportState.isExporting}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Excel (.xlsx)
                                    </button>
                                    <button
                                        onClick={() => saveAsCSV()}
                                        disabled={exportState.isExporting}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        CSV (.csv)
                                    </button>
                                    <button
                                        onClick={() => saveAsJSON()}
                                        disabled={exportState.isExporting}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        JSON (.json)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 새 스프레드시트 */}
                        <button
                            onClick={handleNewSpreadsheet}
                            className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            시트 초기화
                        </button>

                    </div>



                    {/* 오른쪽 상태 표시 영역 - 분리된 훅 상태 */}
                    <div className="flex items-center space-x-4">
                        {/* 업로드/저장/생성 상태 */}
                        {(uploadState.isUploading || uploadState.isProcessing || exportState.isExporting || isCreating) && (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-gray-600">
                                    {isCreating ? '스프레드시트 생성 중...' :
                                        exportState.isExporting ? '저장 중...' :
                                            uploadState.isProcessing ? `처리 중... ${uploadState.progress}%` : '업로드 중...'}
                                </span>
                                {uploadState.progress > 0 && !exportState.isExporting && !isCreating && (
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-300"
                                            style={{ width: `${uploadState.progress}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        )}
        

                    
                        {/* 마지막 저장 시간 */}
                        {exportState.lastExportedAt && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    저장: {exportState.lastExportedAt.toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        {/* 오류 상태 */}
                        {(uploadState.error || exportState.error || createError) && (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-sm text-red-600 font-medium">
                                    {createError || uploadState.error || exportState.error}
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Chat 버튼 - 채팅이 숨겨져 있을 때만 표시 (지연된 렌더링) */}
                    {showChatButton && (
                        <div className="ml-auto py-3 transition-all duration-500 ease-in-out opacity-100 translate-x-0 scale-100">
                            <button
                                onClick={handleShowChat}
                                style={{ backgroundColor: '#005ed9' }}
                                className="flex items-center gap-1 px-3 py-0 text-sm text-white bg-gray-500 hover:bg-[#005ed9] rounded-md transition-all duration-200 hover:scale-105"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.33-3.83-.91L4 20l.91-4.17C4.33 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
                                    <circle cx="8.5" cy="12" r="1" />
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="15.5" cy="12" r="1" />
                                </svg>
                                AI
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* <div className='border-2 border-gray-200'></div> */}

            {/* SpreadJS 컴포넌트 - 남은 공간 전체 사용 */}
            <div className="flex-1 w-full">
                <SpreadSheets
                    workbookInitialized={(spread) => initSpread(spread)}
                    hostStyle={hostStyle}>
                </SpreadSheets>
            </div>

            {/* 파일 업로드 확인 모달 */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center mb-4">
                            <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900">파일 업로드</h3>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                            파일을 업로드하세요
                        </p>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={handleUploadButtonClick}
                                className="flex-1 text-white px-4 py-2 rounded-md hover:bg-[#005ed9] transition-colors"
                                style={{ backgroundColor: '#005ed9' }}
                            >
                                로컬 파일에서 선택
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
    );
}
