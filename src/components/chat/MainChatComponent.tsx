'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { useUnifiedStore, ChatMessage } from '@/stores';
import { detectAndDecode } from '../../utils/chatUtils';
import { callOrchestratorChatAPI, OrchestratorChatResponseDto, FunctionDetails } from '../../services/api/dataServices';
import { processXLSXFile } from '../../utils/fileProcessing';
import { saveSpreadsheet, convertSpreadsheetDataToXLSXData, SpreadsheetData } from '@/services/api/spreadsheetService';
import { updateChatTitle as originalUpdateChatTitle } from '@/services/api/chatService';
import { cellAddressToCoords } from '@/stores/store-utils/xlsxUtils';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';

// 컴포넌트 가져오기
import MessageDisplay from './MessageDisplay';
import FileUploadHandler from './FileUploadHandler';
import ChatInput from './ChatInput';

// NodeJS 타입 정의
declare global {
    namespace NodeJS {
        interface Timeout {}
    }
}

// 채팅 모드 타입 정의 (통합 API 응답과 일치)
type ChatMode = 'normal' | 'artifact' | 'datafix' | 'dataedit' | 'data-edit' | 'edit-chat' | 'function' | 'function-chat' | 'datageneration';

// 로딩 힌트 메시지 배열
const loadingHints = [
    "데이터를 분석하고 있습니다...",
    "패턴을 찾고 있어요...",
    "최적의 응답을 만들고 있습니다...",
    "결과를 정리하는 중입니다...",
    "데이터의 연관성을 파악하고 있어요...",
    "통계적 의미를 분석 중입니다...",
    "최상의 답변을 구성하고 있습니다..."
];

// NodeJS timeout 타입 정의
type TimeoutHandle = ReturnType<typeof setTimeout>;

export default function MainChatComponent() {
    // 상태들 선언
    const [currentMode, setCurrentMode] = useState<ChatMode>('normal');
    const [inputValue, setInputValue] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingHintIndex, setLoadingHintIndex] = useState(0);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const loadingIntervalRef = useRef<TimeoutHandle | null>(null);
    const prevChatIdRef = useRef<string | null>(null);
    const [appliedDataFixes, setAppliedDataFixes] = useState<string[]>([]);
    const [appliedFunctionResults, setAppliedFunctionResults] = useState<string[]>([]);
    const { user } = useAuthStore();

    // Zustand 스토어 사용
    const {
        xlsxData,
        loadingStates,
        hasUploadedFile,
        setXLSXData,
        setLoadingState,
        setError,
        isArtifactModalOpen,
        addToArtifactHistory,
        openArtifactModal,
        switchToSheet,
        getDataForGPTAnalysis,
        applyGeneratedData,
        // 시트별 채팅 관련 스토어 값과 액션
        activeSheetMessages,
        addMessageToSheet,
        clearAllMessages,
        currentChatId,
        getCurrentChatId,
        generateNewChatId,
        initializeChatId,
        setCurrentChatId,
        // 스프레드시트 관련 액션들 추가
        currentSpreadsheetId,
        setCurrentSpreadsheetId,
        setSpreadsheetMetadata,
        markAsSaved,
        canUploadFile,
        saveCurrentSessionToStore,
        loadChatSessionsFromStorage,
        refreshChatList,
    } = useUnifiedStore();

    // Firebase 채팅 ID 상태 추가
    const [firebaseChatId, setFirebaseChatId] = useState<string | null>(null);

    // 디버깅: hasUploadedFile 상태 변화 추적
    useEffect(() => {
        console.log('📁 hasUploadedFile 상태 변화:', {
            hasUploadedFile,
            xlsxData: !!xlsxData,
            currentChatId,
            firebaseChatId
        });
    }, [hasUploadedFile, xlsxData, currentChatId, firebaseChatId]);

    // Firebase 채팅 ID 감지 및 설정
    useEffect(() => {
        // URL 파라미터에서 Firebase 채팅 ID 확인 (초기 로드시에만)
        if (typeof window !== 'undefined' && !firebaseChatId) {
            const urlParams = new URLSearchParams(window.location.search);
            const chatIdFromUrl = urlParams.get('chatId');
            
            if (chatIdFromUrl) {
                console.log('MainChatComponent URL에서 Firebase 채팅 ID 감지:', chatIdFromUrl);
                setFirebaseChatId(chatIdFromUrl);
                // setCurrentChatId는 AI 페이지에서 이미 처리하므로 여기서는 제거
            }
        }

        // 현재 스프레드시트 ID가 있으면 Firebase 채팅으로 간주
        const spreadsheetId = currentSpreadsheetId;
        if (spreadsheetId && !firebaseChatId && currentChatId) {
            console.log('스프레드시트 ID로 Firebase 채팅 감지:', spreadsheetId);
            setFirebaseChatId(currentChatId);
        }
    }, [currentSpreadsheetId, currentChatId, firebaseChatId]);

    // 현재 채팅이 Firebase 채팅인지 확인하는 함수
    const isFirebaseChat = useCallback(() => {
        // 1. firebaseChatId가 설정되어 있으면 Firebase 채팅
        if (firebaseChatId) {
            console.log('Firebase 채팅 확인 (firebaseChatId):', firebaseChatId);
            return true;
        }

        // 2. 현재 스프레드시트 ID가 있으면 Firebase 채팅
        const spreadsheetId = currentSpreadsheetId;
        if (spreadsheetId) {
            console.log('Firebase 채팅 확인 (spreadsheetId):', spreadsheetId);
            return true;
        }

        // 3. 현재 채팅 ID가 Firebase 패턴인지 확인 (20자 이상, '_local' 포함하지 않음)
        const chatId = getCurrentChatId();
        if (chatId && chatId.length > 20 && !chatId.includes('_local') && !chatId.includes('chat_')) {
            console.log('Firebase 채팅 확인 (패턴 매칭):', chatId);
            return true;
        }

        console.log('로컬 채팅으로 확인됨');
        return false;
    }, [firebaseChatId, currentSpreadsheetId, getCurrentChatId]);

    // 현재 Firebase 채팅 ID 가져오기
    const getCurrentFirebaseChatId = useCallback(() => {
        if (firebaseChatId) {
            return firebaseChatId;
        }
        
        const chatId = getCurrentChatId();
        if (chatId && isFirebaseChat()) {
            return chatId;
        }
        
        return null;
    }, [firebaseChatId, getCurrentChatId, isFirebaseChat]);

    // updateChatTitle 래핑 함수 - 자동으로 refreshChatList 호출
    const updateChatTitle = useCallback(async (chatId: string, title: string, userId: string) => {
        await originalUpdateChatTitle(chatId, title, userId);
        refreshChatList();
    }, [refreshChatList]);

    // 채팅 제목을 파일명으로 업데이트하는 함수
    const updateChatTitleWithFileName = useCallback(async (fileName: string) => {
        try {
            const chatId = getCurrentFirebaseChatId();
            if (!chatId || !user) {
                console.log('채팅 ID 또는 사용자 정보가 없어 제목 업데이트를 스킵합니다.');
                return;
            }

            // 파일 확장자 제거하여 깔끔한 제목 만들기
            const cleanFileName = fileName.replace(/\.(xlsx|xls|csv)$/i, '');
            
            console.log('채팅 제목 업데이트 시도:', {
                chatId,
                originalFileName: fileName,
                newTitle: cleanFileName,
                userId: user.uid
            });

            await updateChatTitle(chatId, cleanFileName, user.uid);
            console.log('✅ 채팅 제목이 파일명으로 업데이트되었습니다:', cleanFileName);
            
            // 사이드바의 채팅 목록 새로고침
            refreshChatList();
        } catch (error) {
            console.error('❌ 채팅 제목 업데이트 실패:', error);
        }
    }, [getCurrentFirebaseChatId, user, refreshChatList]);

    // 파일이 로드되었는지 확인
    const file = xlsxData ? { name: xlsxData.fileName } : null;

    // 현재 활성 시트 인덱스 가져오기
    const activeSheetIndex = xlsxData?.activeSheetIndex || 0;

    // 유효한 스프레드시트 파일인지 확인하는 함수
    const isValidSpreadsheetFile = (file: File): boolean => {
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        return validExtensions.some((ext: string) => fileName.endsWith(ext));
    };

    // columnIndexToLetter 함수 추가 (없는 경우)
    const columnIndexToLetter = (index: number): string => {
        let result = '';
        while (index >= 0) {
            result = String.fromCharCode(65 + (index % 26)) + result;
            index = Math.floor(index / 26) - 1;
        }
        return result;
    };

    // 파일 처리 함수
    const processFile = useCallback(async (file: File) => {
        setLoadingState('fileUpload', true);
        setError('fileError', null);

        try {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                // XLSX 파일 처리
                const result = await processXLSXFile(file);

                console.log('processXLSXFile 결과:', {
                    sheetsCount: result.sheets.length,
                    sheetsInfo: result.sheets.map(s => ({
                        name: s.sheetName,
                        rawDataLength: s.rawData?.length || 0,
                        dataBounds: s.dataBounds
                    }))
                });

                // 기존 xlsxData가 있는 경우 새 시트로 추가
                if (xlsxData) {
                    const newXlsxData = { ...xlsxData };

                    // 각 시트의 데이터 확인
                    const newSheets = result.sheets.map(sheet => {
                        const firstRowCols = sheet.rawData?.[0]?.length || 0;
                        const maxCols = Math.max(0, ...sheet.rawData.map(row => (row || []).length));
                        console.log(`📋 시트 처리: ${sheet.sheetName}`, {
                            rawDataRows: sheet.rawData.length,
                            firstRowCols,
                            maxCols,
                            hasDataBeyond34: maxCols > 34,
                            sampleFirstRow: sheet.rawData?.[0]?.slice(0, 5),
                            sampleColumnsAroundCol34: sheet.rawData?.[0]?.slice(32, 37) // 33-37열 샘플
                        });

                        return {
                            sheetName: sheet.sheetName,
                            rawData: sheet.rawData,
                            metadata: {
                                rowCount: sheet.rawData.length,
                                columnCount: maxCols, // firstRowCols 대신 maxCols 사용
                                dataRange: {
                                    startRow: sheet.metadata?.dataRange?.startRow || 0,
                                    endRow: sheet.metadata?.dataRange?.endRow || sheet.rawData.length -1,
                                    startCol: sheet.metadata?.dataRange?.startCol || 0,
                                    endCol: sheet.metadata?.dataRange?.endCol || (maxCols || 1) - 1,
                                    startColLetter: sheet.metadata?.dataRange?.startColLetter || 'A',
                                    endColLetter: sheet.metadata?.dataRange?.endColLetter || columnIndexToLetter((maxCols || 1) - 1)
                                },
                                preserveOriginalStructure: true,
                                lastModified: new Date()
                            }
                        };
                    });

                    if (newSheets.length === 0) {
                        const errorMessage: ChatMessage = {
                            id: Date.now().toString(),
                            type: 'Extion ai',
                            content: `${file.name} 파일에서 데이터를 찾을 수 없습니다. 파일이 비어있거나 지원하지 않는 형식일 수 있습니다.`,
                            timestamp: new Date()
                        };
                        addMessageToSheet(activeSheetIndex, errorMessage);
                        setLoadingState('fileUpload', false);
                        return;
                    }

                    // 새 시트들을 기존 시트 목록에 추가
                    newXlsxData.sheets = [...newXlsxData.sheets, ...newSheets];
                    setXLSXData(newXlsxData);

                    // 새 API로 스프레드시트 저장
                    try {
                        const saveResult = await saveSpreadsheet({
                            userId: auth.currentUser?.uid || '',
                            chatId: getCurrentFirebaseChatId() || undefined,
                            fileName: newXlsxData.fileName,
                            originalFileName: file.name,
                            fileSize: file.size,
                            fileType: 'xlsx',
                            activeSheetIndex: newXlsxData.activeSheetIndex,
                            sheets: newXlsxData.sheets.map(sheet => ({
                                name: sheet.sheetName,
                                index: newXlsxData.sheets.indexOf(sheet),
                                data: sheet.rawData || []
                            }))
                        });

                        const spreadsheetId = saveResult.id;
                        const chatId = saveResult.chatId;

                        console.log('스프레드시트가 저장되었습니다:', spreadsheetId);

                        // 저장된 spreadsheetId를 데이터에 추가
                        const updatedXlsxData = {
                            ...newXlsxData,
                            spreadsheetId: spreadsheetId
                        };
                        setXLSXData(updatedXlsxData);

                        // 스토어에 chatId와 spreadsheetId 저장
                        if (chatId) {
                            setCurrentChatId(chatId);
                        }
                    
                        if (spreadsheetId) {
                            setCurrentSpreadsheetId(spreadsheetId);
                            setSpreadsheetMetadata({
                                fileName: newXlsxData.fileName,
                                originalFileName: file.name,
                                fileSize: file.size,
                                fileType: 'xlsx',
                                isSaved: true,
                                lastSaved: new Date()
                            });
                            markAsSaved(spreadsheetId);
                        }

                        // 응답에서 chatTitle이 있으면 채팅 제목 업데이트 (스프레드시트 API가 chatTitle을 반환하는 경우)
                        if ((saveResult as any).chatTitle && chatId && auth.currentUser?.uid) {
                            try {
                                await updateChatTitle(chatId, (saveResult as any).chatTitle, auth.currentUser.uid);
                                console.log('✅ 채팅 제목이 업데이트되었습니다:', (saveResult as any).chatTitle);
                            } catch (titleError) {
                                console.error('❌ 채팅 제목 업데이트 실패:', titleError);
                            }
                        }

                    } catch (saveError) {
                        console.error('스프레드시트 저장 실패:', saveError);
                    }

                    const successMessage: ChatMessage = {
                        id: Date.now().toString(),
                        type: 'Extion ai',
                        content: `${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
                            `추가된 시트 정보:\n` +
                            newSheets.map((sheet, index) => {
                                const rawData = sheet.rawData || [[]];
                                return `• ${sheet.sheetName}: ${rawData[0]?.length || 0}열 × ${rawData.length}행`;
                            }).join('\n'),
                        timestamp: new Date()
                    };

                    // 현재 활성 시트에 메시지 추가
                    addMessageToSheet(activeSheetIndex, successMessage);
                } else {
                    // xlsxData가 없는 경우 새로 생성
                    const xlsxData = {
                        fileName: result.fileName,
                        sheets: result.sheets.map(sheet => {
                            const firstRowCols = sheet.rawData?.[0]?.length || 0;
                            const maxCols = Math.max(0, ...sheet.rawData.map(row => (row || []).length));
                            console.log(`📋 새 파일 시트 처리: ${sheet.sheetName}`, {
                                rawDataRows: sheet.rawData.length,
                                firstRowCols,
                                maxCols,
                                hasDataBeyond34: maxCols > 34,
                                sampleFirstRow: sheet.rawData?.[0]?.slice(0, 5),
                                sampleColumnsAroundCol34: sheet.rawData?.[0]?.slice(32, 37) // 33-37열 샘플
                            });

                            return {
                                sheetName: sheet.sheetName,
                                rawData: sheet.rawData,
                                metadata: {
                                    rowCount: sheet.rawData.length,
                                    columnCount: maxCols, // firstRowCols 대신 maxCols 사용
                                    dataRange: {
                                        startRow: sheet.metadata?.dataRange?.startRow || 0,
                                        endRow: sheet.metadata?.dataRange?.endRow || sheet.rawData.length - 1,
                                        startCol: sheet.metadata?.dataRange?.startCol || 0,
                                        endCol: sheet.metadata?.dataRange?.endCol || (maxCols || 1) - 1,
                                        startColLetter: sheet.metadata?.dataRange?.startColLetter || 'A',
                                        endColLetter: sheet.metadata?.dataRange?.endColLetter || columnIndexToLetter((maxCols || 1) - 1)
                                    },
                                    preserveOriginalStructure: true,
                                    lastModified: new Date()
                                }
                            };
                        }),
                        activeSheetIndex: 0
                    };

                    setXLSXData(xlsxData);

                    // 새 API로 스프레드시트 저장
                    try {
                        const saveResult = await saveSpreadsheet({
                            userId: auth.currentUser?.uid || '',
                            chatId: getCurrentFirebaseChatId() || undefined,
                            fileName: xlsxData.fileName,
                            originalFileName: file.name,
                            fileSize: file.size,
                            fileType: 'xlsx',
                            activeSheetIndex: xlsxData.activeSheetIndex,
                            sheets: xlsxData.sheets.map(sheet => ({
                                name: sheet.sheetName,
                                index: xlsxData.sheets.indexOf(sheet),
                                data: sheet.rawData || []
                            }))
                        });

                        const spreadsheetId = saveResult.id;
                        const chatId = saveResult.chatId;

                        console.log('스프레드시트가 저장되었습니다:', spreadsheetId);

                        // 저장된 spreadsheetId를 데이터에 추가
                        const updatedXlsxData = {
                            ...xlsxData,
                            spreadsheetId: spreadsheetId
                        };
                        setXLSXData(updatedXlsxData);

                        // 스토어에 chatId와 spreadsheetId 저장
                        if (chatId) {
                            setCurrentChatId(chatId);
                        }
                    
                        if (spreadsheetId) {
                            setCurrentSpreadsheetId(spreadsheetId);
                            setSpreadsheetMetadata({
                                fileName: xlsxData.fileName,
                                originalFileName: file.name,
                                fileSize: file.size,
                                fileType: 'xlsx',
                                isSaved: true,
                                lastSaved: new Date()
                            });
                            markAsSaved(spreadsheetId);
                        }

                        // 응답에서 chatTitle이 있으면 채팅 제목 업데이트 (스프레드시트 API가 chatTitle을 반환하는 경우)
                        if ((saveResult as any).chatTitle && chatId && auth.currentUser?.uid) {
                            try {
                                await updateChatTitle(chatId, (saveResult as any).chatTitle, auth.currentUser.uid);
                                console.log('✅ 채팅 제목이 업데이트되었습니다:', (saveResult as any).chatTitle);
                            } catch (titleError) {
                                console.error('❌ 채팅 제목 업데이트 실패:', titleError);
                            }
                        }

                    } catch (saveError) {
                        console.error('스프레드시트 저장 실패:', saveError);
                    }

                    // 파일 업로드 성공 시 채팅 제목을 파일명으로 업데이트
                    await updateChatTitleWithFileName(file.name);

                    const successMessage: ChatMessage = {
                        id: Date.now().toString(),
                        type: 'Extion ai',
                        content: `${file.name} 파일이 성공적으로 업로드되었습니다.\n\n` +
                            `파일 정보:\n` +
                            result.sheets.map((sheet, index) => {
                                const rawData = sheet.rawData || [[]];
                                return `• ${sheet.sheetName}: ${rawData[0]?.length || 0}열 × ${rawData.length}행`;
                            }).join('\n') +
                            `\n\n데이터에 대해 궁금한 점이 있으시면 언제든 물어보세요!`,
                        timestamp: new Date()
                    };
                    addMessageToSheet(activeSheetIndex, successMessage);
                }
            } else if (fileExtension === 'csv') {
                // CSV 파일 처리
                const fileContent = await detectAndDecode(file);

                Papa.parse(fileContent, {
                    header: false,
                    skipEmptyLines: false,
                    complete: (results: Papa.ParseResult<unknown>) => {
                        if (results.data && results.data.length > 0) {
                            const rawData = results.data as string[][];

                            if (rawData.length === 0) {
                                const errorMessage: ChatMessage = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `⚠️ 파일에 데이터가 없습니다.`,
                                    timestamp: new Date()
                                };

                                // 현재 활성 시트에 오류 메시지 추가
                                addMessageToSheet(activeSheetIndex, errorMessage);
                                setLoadingState('fileUpload', false);
                                return;
                            }

                            const rowCount = rawData.length;
                            const columnCount = rawData[0]?.length || 0;

                            const newSheetData = {
                                sheetName: file.name.replace('.csv', ''),
                                rawData: rawData,
                                metadata: {
                                    rowCount: rowCount,
                                    columnCount: columnCount,
                                    dataRange: {
                                        startRow: 0,
                                        endRow: rowCount -1,
                                        startCol: 0,
                                        endCol: columnCount > 0 ? columnCount - 1 : 0,
                                        startColLetter: columnIndexToLetter(0),
                                        endColLetter: columnIndexToLetter(columnCount > 0 ? columnCount - 1 : 0)
                                    },
                                    preserveOriginalStructure: true,
                                    lastModified: new Date()
                                }
                            };

                            // 기존 xlsxData가 있는 경우 새 시트로 추가
                            if (xlsxData) {
                                const newXlsxData = { ...xlsxData };
                                newXlsxData.sheets = [...newXlsxData.sheets, newSheetData];
                                setXLSXData(newXlsxData);

                                // 새 API로 스프레드시트 저장
                                (async () => {
                                    try {
                                        const saveResult = await saveSpreadsheet({
                                            userId: auth.currentUser?.uid || '',
                                            chatId: getCurrentFirebaseChatId() || undefined,
                                            fileName: newXlsxData.fileName,
                                            originalFileName: file.name,
                                            fileSize: file.size,
                                            fileType: 'csv',
                                            activeSheetIndex: newXlsxData.activeSheetIndex,
                                            sheets: newXlsxData.sheets.map(sheet => ({
                                                name: sheet.sheetName,
                                                index: newXlsxData.sheets.indexOf(sheet),
                                                data: sheet.rawData || []
                                            }))
                                        });

                                        const spreadsheetId = saveResult.id;
                                        const chatId = saveResult.chatId;

                                        console.log('스프레드시트가 저장되었습니다:', spreadsheetId);

                                        // 저장된 spreadsheetId를 데이터에 추가
                                        const updatedXlsxData = {
                                            ...newXlsxData,
                                            spreadsheetId: spreadsheetId
                                        };
                                        setXLSXData(updatedXlsxData);

                                        // 스토어에 chatId와 spreadsheetId 저장
                                        if (chatId) {
                                            setCurrentChatId(chatId);
                                        }
                                        
                                        if (spreadsheetId) {
                                            setCurrentSpreadsheetId(spreadsheetId);
                                            setSpreadsheetMetadata({
                                                fileName: newXlsxData.fileName,
                                                originalFileName: file.name,
                                                fileSize: file.size,
                                                fileType: 'csv',
                                                isSaved: true,
                                                lastSaved: new Date()
                                            });
                                            markAsSaved(spreadsheetId);
                                        }

                                        // 응답에서 chatTitle이 있으면 채팅 제목 업데이트 (스프레드시트 API가 chatTitle을 반환하는 경우)
                                        if ((saveResult as any).chatTitle && chatId && auth.currentUser?.uid) {
                                            try {
                                                await updateChatTitle(chatId, (saveResult as any).chatTitle, auth.currentUser.uid);
                                                console.log('✅ 채팅 제목이 업데이트되었습니다:', (saveResult as any).chatTitle);
                                            } catch (titleError) {
                                                console.error('❌ 채팅 제목 업데이트 실패:', titleError);
                                            }
                                        }

                                    } catch (saveError) {
                                        console.error('스프레드시트 저장 실패:', saveError);
                                    }
                                })();

                                const successMessage: ChatMessage = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
                                        `추가된 시트 정보:\n` +
                                        `• ${newSheetData.sheetName}: ${newSheetData.rawData[0]?.length || 0}열 × ${newSheetData.rawData.length}행`,
                                    timestamp: new Date()
                                };

                                // 현재 활성 시트에 메시지 추가
                                addMessageToSheet(activeSheetIndex, successMessage);
                            } else {
                                // xlsxData가 없는 경우 새로 생성
                                const xlsxData = {
                                    fileName: file.name,
                                    sheets: [newSheetData],
                                    activeSheetIndex: 0
                                };

                                setXLSXData(xlsxData);

                                // 새 API로 스프레드시트 저장
                                (async () => {
                                    try {
                                        const saveResult = await saveSpreadsheet({
                                            userId: auth.currentUser?.uid || '',
                                            chatId: getCurrentFirebaseChatId() || undefined,
                                            fileName: xlsxData.fileName,
                                            originalFileName: file.name,
                                            fileSize: file.size,
                                            fileType: 'csv',
                                            activeSheetIndex: xlsxData.activeSheetIndex,
                                            sheets: xlsxData.sheets.map(sheet => ({
                                                name: sheet.sheetName,
                                                index: xlsxData.sheets.indexOf(sheet),
                                                data: sheet.rawData || []
                                            }))
                                        });

                                        const spreadsheetId = saveResult.id;
                                        const chatId = saveResult.chatId;

                                        console.log('스프레드시트가 저장되었습니다:', spreadsheetId);

                                        // 저장된 spreadsheetId를 데이터에 추가
                                        const updatedXlsxData = {
                                            ...xlsxData,
                                            spreadsheetId: spreadsheetId
                                        };
                                        setXLSXData(updatedXlsxData);

                                        // 스토어에 chatId와 spreadsheetId 저장
                                        if (chatId) {
                                            setCurrentChatId(chatId);
                                        }
                                        
                                        if (spreadsheetId) {
                                            setCurrentSpreadsheetId(spreadsheetId);
                                            setSpreadsheetMetadata({
                                                fileName: xlsxData.fileName,
                                                originalFileName: file.name,
                                                fileSize: file.size,
                                                fileType: 'csv',
                                                isSaved: true,
                                                lastSaved: new Date()
                                            });
                                            markAsSaved(spreadsheetId);
                                        }

                                        // 응답에서 chatTitle이 있으면 채팅 제목 업데이트 (스프레드시트 API가 chatTitle을 반환하는 경우)
                                        if ((saveResult as any).chatTitle && chatId && auth.currentUser?.uid) {
                                            try {
                                                await updateChatTitle(chatId, (saveResult as any).chatTitle, auth.currentUser.uid);
                                                console.log('✅ 채팅 제목이 업데이트되었습니다:', (saveResult as any).chatTitle);
                                            } catch (titleError) {
                                                console.error('❌ 채팅 제목 업데이트 실패:', titleError);
                                            }
                                        } else {
                                            // chatTitle이 응답에 없으면 파일명으로 업데이트
                                            await updateChatTitleWithFileName(file.name);
                                        }

                                    } catch (saveError) {
                                        console.error('스프레드시트 저장 실패:', saveError);
                                        // 저장 실패해도 파일명으로 채팅 제목 업데이트 시도
                                        await updateChatTitleWithFileName(file.name);
                                    }
                                })();

                                const successMessage: ChatMessage = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `${file.name} 파일이 성공적으로 로드되었습니다.\n` +
                                        `${newSheetData.rawData[0]?.length || 0}열 × ${newSheetData.rawData.length}행의 데이터가 스프레드시트에 표시됩니다.`,
                                    timestamp: new Date()
                                };

                                // 첫 번째 시트(인덱스 0)에 메시지 추가
                                addMessageToSheet(0, successMessage);
                            }
                        }
                    },
                    error: (error: Error) => {
                        console.error('CSV 파싱 오류:', error);
                        setError('fileError', error.message);
                        const errorMessage: ChatMessage = {
                            id: Date.now().toString(),
                            type: 'Extion ai',
                            content: `파일 처리 중 오류가 발생했습니다: ${error.message}`,
                            timestamp: new Date()
                        };

                        // 현재 활성 시트에 오류 메시지 추가
                        addMessageToSheet(activeSheetIndex, errorMessage);
                    }
                });
            } else {
                throw new Error('지원하지 않는 파일 형식입니다. CSV 또는 XLSX 파일을 업로드해주세요.');
            }
        } catch (error) {
            console.error('파일 읽기 오류:', error);
            setError('fileError', error instanceof Error ? error.message : '알 수 없는 오류');
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                type: 'Extion ai',
                content: `파일 읽기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };

            // 현재 활성 시트에 오류 메시지 추가
            addMessageToSheet(activeSheetIndex, errorMessage);
        } finally {
            setLoadingState('fileUpload', false);
        }
    }, [
        xlsxData, 
        activeSheetIndex, 
        setLoadingState, 
        setError, 
        setXLSXData, 
        addMessageToSheet, 
        getCurrentChatId, 
        setCurrentChatId, 
        setCurrentSpreadsheetId, 
        setSpreadsheetMetadata, 
        markAsSaved,
        updateChatTitleWithFileName
    ]);

    // === 채팅 세션 관리 Effect ===
    useEffect(() => {
        // 컴포넌트 마운트 시 저장된 채팅 세션들 로드
        loadChatSessionsFromStorage();
    }, [loadChatSessionsFromStorage]);

    // === 채팅 ID 변경 시 세션 저장 Effect ===
    useEffect(() => {
        // 현재 채팅 ID가 변경되었을 때 이전 세션 저장
        if (prevChatIdRef.current && prevChatIdRef.current !== currentChatId) {
            saveCurrentSessionToStore();
        }
        
        // 현재 채팅 ID를 ref에 저장
        prevChatIdRef.current = currentChatId;
        
        return () => {
            // 컴포넌트 언마운트 시 현재 세션 저장
            if (currentChatId) {
                saveCurrentSessionToStore();
            }
        };
    }, [currentChatId, saveCurrentSessionToStore]);

    // === 주기적 세션 저장 Effect ===
    useEffect(() => {
        const interval = setInterval(() => {
            // 5분마다 현재 세션을 자동 저장
            if (currentChatId) {
                saveCurrentSessionToStore();
            }
        }, 5 * 60 * 1000); // 5분

        return () => clearInterval(interval);
    }, [currentChatId, saveCurrentSessionToStore]);

    // 로딩 상태 관리를 위한 효과
    useEffect(() => {
        if (isLoading) {
            // 로딩이 시작될 때 초기화

            setLoadingHintIndex(0);

            // 진행 상태를 시뮬레이션하는 인터벌 설정
            loadingIntervalRef.current = setInterval(() => {
                setLoadingProgress(prev => {
                    // 로딩 진행도를 서서히 증가시키되, 100%에 도달하지 않게 함
                    if (prev < 90) {
                        // 진행도가 증가함에 따라 증가 속도를 줄임
                        const increment = Math.max(1, 10 - Math.floor(prev / 10));
                        return prev + increment;
                    }
                    return prev;
                });

                // 힌트 메시지 주기적으로 변경
                setLoadingHintIndex(prev => (prev + 1) % loadingHints.length);
            }, 2000);

            return () => {
                // 로딩이 끝나면 인터벌 정리
                if (loadingIntervalRef.current) {
                    clearInterval(loadingIntervalRef.current);
                    loadingIntervalRef.current = null;
                }
                // 로딩이 끝날 때 진행도를 100%로 설정
                setLoadingProgress(100);
            };
        }
    }, [isLoading]);

    // Drag and Drop 핸들러들
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        // 파일 업로드가 이미 된 경우 드래그 오버 상태 비활성화
        if (!canUploadFile()) {
            return;
        }
        setIsDragOver(true);
    }, [canUploadFile]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        if (!canUploadFile()) {
            return;
        }

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && isValidSpreadsheetFile(droppedFile)) {
            // processFile을 직접 호출하여 종속성 문제 해결
            (async () => {
                await processFile(droppedFile);
            })();
        }
    }, [canUploadFile, processFile]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && isValidSpreadsheetFile(selectedFile)) {
            processFile(selectedFile);
        }
    }, [processFile]);

    const removeFile = () => {
        clearAllMessages();
        setXLSXData(null);
    };

    const handleArtifactClick = (messageId: string) => {
        openArtifactModal(messageId);
    };

    // 메시지 전송 함수 - 통합 오케스트레이터 API 사용
    const sendMessage = async () => {
        if (!inputValue.trim()) return;

        setIsLoading(true);

        // 비로그인 상태이고 현재 채팅 ID가 없을 때 새 로컬 채팅 ID 생성
        if (!getCurrentChatId() && !user) {
            const newChatId = generateNewChatId();
            setCurrentChatId(newChatId);
        }

        // 먼저 사용자 메시지 추가
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        // 현재 활성 시트에 사용자 메시지 추가
        addMessageToSheet(activeSheetIndex, userMessage);

        // Firebase 채팅 여부 확인 및 채팅 ID 가져오기
        const isFirebaseChatActive = isFirebaseChat();
        const firebaseChatIdToUse = getCurrentFirebaseChatId();
        
        console.log('=== 메시지 전송 시작 ===');
        console.log('Firebase 채팅 여부:', isFirebaseChatActive);
        console.log('사용할 Firebase 채팅 ID:', firebaseChatIdToUse);
        console.log('현재 채팅 ID:', getCurrentChatId());
        console.log('스프레드시트 ID:', currentSpreadsheetId);

        try {
            const currentInput = inputValue;
            setInputValue('');

            // 통합 오케스트레이터 API 호출
            const response = await callOrchestratorChatAPI(
                currentInput,
                null, // extendedSheetContext는 사용하지 않음
                getDataForGPTAnalysis,
                {
                    chatId: firebaseChatIdToUse || getCurrentChatId(),
                    currentSheetIndex: activeSheetIndex
                }
            );

            console.log('=== API 응답 수신 ===');
            console.log('성공 여부:', response.success);
            console.log('응답 타입:', response.chatType);

            if (response.success) {
                // 백엔드에서 반환된 chatId가 있으면 스토어에 업데이트
                if (response.chatId) {
                    console.log('📝 백엔드에서 받은 chatId로 업데이트:', response.chatId);
                    setCurrentChatId(response.chatId);
                }

                // 채팅 타입에 따라 적절한 핸들러 호출
                await handleUnifiedChatResponse(response);
                
                console.log('✅ 메시지 처리 완료');
            } else {
                console.error('❌ API 응답 실패:', response.error);
                throw new Error(response.error || '응답 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('메시지 처리 중 오류 발생:', error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: `메시지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };

            // 현재 활성 시트에 오류 메시지 추가
            addMessageToSheet(activeSheetIndex, errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyDataFix = useCallback((messageId: string) => {
        console.log('🔧 데이터 수정 적용 시작:', messageId);
        
        const message = activeSheetMessages.find(m => m.id === messageId);
        if (!message || !message.dataFixData || appliedDataFixes.includes(messageId)) {
            console.warn('⚠️ 데이터 수정 적용 조건 미충족:', { 
                hasMessage: !!message, 
                hasDataFixData: !!message?.dataFixData, 
                alreadyApplied: appliedDataFixes.includes(messageId) 
            });
            return;
        }

        const editedData = message.dataFixData.editedData;
        console.log('📊 수정할 데이터:', editedData);

        // 데이터가 올바른 형태인지 확인
        if (!editedData || !editedData.data) {
            console.error('❌ 수정할 데이터가 올바르지 않습니다:', editedData);
            return;
        }

        // 데이터 적용 - orchestrator API는 이미 올바른 구조로 데이터를 제공
        const dataToApply = editedData.data;

        applyGeneratedData({
            sheetName: editedData.sheetName,
            data: dataToApply,
            sheetIndex: message.dataFixData.sheetIndex,
        });

        // 적용된 메시지 ID 추가
        setAppliedDataFixes(prev => [...prev, messageId]);

        // 확인 메시지 추가
        const confirmationMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'Extion ai',
            content: `**${editedData.sheetName}** 시트의 데이터 수정이 적용되었습니다.\n\n` +
                `• 수정된 행 수: ${dataToApply.length}개\n` +
                `• 열 수: ${dataToApply[0]?.length || 0}개`,
            timestamp: new Date(),
        };
        addMessageToSheet(activeSheetIndex, confirmationMessage);
        
        console.log('✅ 데이터 수정 적용 완료');

    }, [activeSheetMessages, applyGeneratedData, addMessageToSheet, activeSheetIndex, appliedDataFixes]);

    const handleApplyFunctionResult = useCallback((messageId: string) => {
        console.log('⚡ 함수 결과 적용 시작:', messageId);
        
        const message = activeSheetMessages.find(m => m.id === messageId) as ChatMessage & { functionData?: any };
        if (!message || !message.functionData || appliedFunctionResults.includes(messageId)) {
            console.warn('⚠️ 함수 결과 적용 조건 미충족:', { 
                hasMessage: !!message, 
                hasFunctionData: !!message?.functionData, 
                alreadyApplied: appliedFunctionResults.includes(messageId) 
            });
            return;
        }

        const { functionDetails } = message.functionData;
        const { result, targetCell, functionType, formula } = functionDetails;
        
        console.log('📊 적용할 함수 결과:', { result, targetCell, functionType, formula });
        
        if (!xlsxData || !useUnifiedStore.getState().activeSheetData) {
            console.error('❌ 스프레드시트 데이터가 없습니다.');
            return;
        }

        try {
            const { row: startRow, col: startCol } = cellAddressToCoords(targetCell);
            console.log('🎯 대상 셀 좌표:', { startRow, startCol, targetCell });

            const currentXlsxData = useUnifiedStore.getState().xlsxData;
            if (!currentXlsxData) {
                console.error('❌ 현재 스프레드시트 데이터를 가져올 수 없습니다.');
                return;
            }

            const newSheets = currentXlsxData.sheets.map((sheet, index) => {
                if (index === currentXlsxData.activeSheetIndex) {
                    // rawData를 수정하기 위해 깊은 복사
                    const newRawData = (sheet.rawData || []).map(row => [...(row || [])]);

                    if (Array.isArray(result)) { // 2D 배열 결과
                        console.log('📋 2차원 배열 결과 적용:', result);
                        (result as string[][]).forEach((rowData, rIdx) => {
                            const targetRowIdx = startRow + rIdx;
                            while(newRawData.length <= targetRowIdx) newRawData.push([]);
                            const targetRow = newRawData[targetRowIdx];
                            rowData.forEach((cellData, cIdx) => {
                                const targetColIdx = startCol + cIdx;
                                while(targetRow.length <= targetColIdx) targetRow.push('');
                                targetRow[targetColIdx] = String(cellData);
                            });
                        });
                    } else { // 단일 값 결과
                        console.log('📄 단일 값 결과 적용:', result);
                        const targetRowIdx = startRow;
                        while(newRawData.length <= targetRowIdx) newRawData.push([]);
                        const targetRow = newRawData[targetRowIdx];
                        while(targetRow.length <= startCol) targetRow.push('');
                        targetRow[startCol] = String(result);
                    }
                    
                    const newRowCount = newRawData.length;
                    const newColumnCount = newRowCount > 0 ? Math.max(...newRawData.map(r => (r || []).length)) : 0;

                    return {
                        ...sheet,
                        rawData: newRawData,
                        metadata: {
                            ...(sheet.metadata as any), // 기존 메타데이터 유지
                            rowCount: newRowCount,
                            columnCount: newColumnCount,
                            lastModified: new Date() // MainSpreadSheet의 useEffect 트리거
                        }
                    };
                }
                return sheet;
            });

            setXLSXData({ ...currentXlsxData, sheets: newSheets });
            setAppliedFunctionResults(prev => [...prev, messageId]);

            const sheetName = useUnifiedStore.getState().activeSheetData?.sheetName || '시트';
            const confirmationMessage: ChatMessage = {
                id: Date.now().toString(),
                type: 'Extion ai',
                content: `**${sheetName}** 시트에 함수 결과가 적용되었습니다.\n\n` +
                    `• 함수 타입: ${functionType}\n` +
                    `• 대상 셀: ${targetCell}\n` +
                    `• 수식: ${formula}\n` +
                    `• 결과: ${Array.isArray(result) ? `${result.length}개 행의 데이터` : result}`,
                timestamp: new Date(),
            };
            addMessageToSheet(activeSheetIndex, confirmationMessage);
            
            console.log('✅ 함수 결과 적용 완료');

        } catch (error) {
            console.error('❌ 함수 결과 적용 중 오류:', error);
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                type: 'Extion ai',
                content: `함수 결과 적용 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };
            addMessageToSheet(activeSheetIndex, errorMessage);
        }
    }, [activeSheetMessages, appliedFunctionResults, xlsxData, setXLSXData, addMessageToSheet, activeSheetIndex]);

    // 통합 응답 처리 함수
    const handleUnifiedChatResponse = async (response: OrchestratorChatResponseDto) => {
        console.log('=== 통합 응답 처리 시작 ===');
        console.log('응답 타입:', response.chatType);
        console.log('응답 데이터:', response);

        // 채팅 타입에 따라 currentMode 설정
        if (response.chatType) {
            setCurrentMode(response.chatType as ChatMode);
        }

        // 채팅 타입별 처리 (orchestrator의 다양한 응답 타입 지원)
        const chatType = response.chatType as string;
        if (chatType === 'artifact' || chatType === 'visualization-chat') {
            await handleArtifactResponse(response);
        } else if (chatType === 'function' || chatType === 'function-chat') {
            await handleFunctionResponse(response);
        } else if (chatType === 'datafix') {
            await handleDataFixResponse(response);
        } else if (chatType === 'dataedit' || chatType === 'data-edit' || chatType === 'edit-chat') {
            await handleDataEditResponse(response);
        } else if (chatType === 'datageneration' || chatType === 'generate-chat') {
            await handleDataGenerationResponse(response);
        } else if (chatType === 'normal' || chatType === 'general-chat') {
            // 일반 채팅 응답 처리
            console.log('💬 일반 채팅으로 처리:', chatType);
            await handleNormalResponse(response);
        } else {
            // 기타 타입들은 일반 응답으로 처리
            console.log('💬 알 수 없는 타입을 일반 채팅으로 처리:', chatType);
            console.log('💬 전체 응답 구조:', JSON.stringify(response, null, 2));
            await handleNormalResponse(response);
        }
    };

    // 아티팩트 응답 처리 (기존 artifact와 새로운 visualization-chat 모두 지원)
    const handleArtifactResponse = async (response: OrchestratorChatResponseDto) => {
        console.log('🎨 아티팩트 응답 처리 시작:', response);
        
        // orchestrator의 visualization-chat 응답 구조 지원
        const artifactCode = response.code || (response as any).data?.code;
        const artifactType = response.type || (response as any).data?.type;
        const artifactTitle = response.title || (response as any).data?.title;
        const artifactExplanation = response.explanation || (response as any).data?.explanation;
        
        console.log('🔍 아티팩트 데이터 추출:', {
            hasCode: !!artifactCode,
            type: artifactType,
            title: artifactTitle,
            hasExplanation: !!artifactExplanation
        });
        
        if (artifactCode) {
            const artifactId = (Date.now() + 1).toString();
            
            const artifactData = {
                type: artifactType || 'analysis',
                title: artifactTitle || `${artifactType || 'Chart'} 분석`,
                timestamp: new Date(),
                code: artifactCode,
                messageId: artifactId
            };

            // 아티팩트 히스토리에 추가
            addToArtifactHistory(artifactData);

            // explanation 처리 - 다양한 형태 지원
            let explanationText = '';
            if (typeof artifactExplanation === 'string') {
                explanationText = artifactExplanation;
            } else if (artifactExplanation && typeof artifactExplanation === 'object') {
                explanationText = artifactExplanation.korean || '';
            } else if (response.message) {
                explanationText = response.message;
            } else {
                explanationText = `${artifactType || 'Chart'} 분석이 완료되었습니다.`;
            }
            
            console.log('📝 설명 텍스트:', explanationText.substring(0, 100) + '...');
            
            const assistantMessage: ChatMessage = {
                id: artifactId,
                type: 'Extion ai',
                content: explanationText,
                timestamp: new Date(),
                artifactData: {
                    type: artifactType || 'analysis',
                    title: artifactTitle || `${artifactType || 'Chart'} 분석`,
                    timestamp: new Date(),
                    code: artifactCode,
                    artifactId: artifactId
                }
            };

            console.log('✅ 아티팩트 메시지 추가:', {
                id: assistantMessage.id,
                hasContent: !!assistantMessage.content,
                hasArtifactData: !!assistantMessage.artifactData,
                codeLength: artifactCode.length
            });
            addMessageToSheet(activeSheetIndex, assistantMessage);
        } else {
            console.warn('⚠️ 아티팩트 응답에 코드가 없습니다.');
            // 코드가 없어도 메시지가 있으면 표시
            if (response.message) {
                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: response.message,
                    timestamp: new Date()
                };
                addMessageToSheet(activeSheetIndex, assistantMessage);
            }
        }
    };

    // 함수 실행 응답 처리
    const handleFunctionResponse = async (response: OrchestratorChatResponseDto) => {
        console.log('⚡ 함수 응답 처리 시작:', response);
        
        // 중첩된 데이터 구조 처리: response.data.functionDetails 또는 response.functionDetails
        const functionDetails = response.functionDetails || (response as any).data?.functionDetails;
        const explanation = response.message || (response as any).data?.explanation;
        
        console.log('🔧 추출된 함수 데이터:', {
            hasFunctionDetails: !!functionDetails,
            explanation,
            functionType: functionDetails?.functionType,
            targetCell: functionDetails?.targetCell
        });
        
        if (functionDetails) {
            const messageContent = explanation || 
                `함수가 실행되었습니다.\n\n` +
                `• 함수 타입: ${functionDetails.functionType}\n` +
                `• 대상 셀: ${functionDetails.targetCell}\n` +
                `• 수식: ${functionDetails.formula}\n` +
                `• 결과: ${Array.isArray(functionDetails.result) ? 
                    `${functionDetails.result.length}개 행의 데이터` : 
                    functionDetails.result}`;

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: messageContent,
                timestamp: new Date(),
                functionData: {
                    functionDetails: functionDetails,
                    isApplied: false
                },
                mode: 'function'
            } as any;

            console.log('✅ 함수 메시지 추가:', {
                messageId: assistantMessage.id,
                functionType: functionDetails.functionType,
                targetCell: functionDetails.targetCell,
                result: functionDetails.result
            });
            addMessageToSheet(activeSheetIndex, assistantMessage);
        } else {
            console.warn('⚠️ 함수 응답에 functionDetails가 없습니다.');
            console.warn('전체 응답 구조:', JSON.stringify(response, null, 2));
            
            // functionDetails가 없어도 메시지가 있으면 표시
            const fallbackMessage = explanation || response.message || '함수 실행 요청을 처리했습니다.';
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: fallbackMessage,
                timestamp: new Date()
            };
            addMessageToSheet(activeSheetIndex, assistantMessage);
        }
    };

    // 데이터 수정 응답 처리
    const handleDataFixResponse = async (response: OrchestratorChatResponseDto) => {
        console.log('🔧 데이터 수정 응답 처리 시작:', response);
        
        if (response.editedData) {
            const targetSheetIndex = response.sheetIndex !== undefined ? response.sheetIndex : activeSheetIndex;
            
            // 변경 사항 설명 생성
            let changesDescription = '';
            if (response.changes) {
                changesDescription = `\n\n변경 내용:\n• 유형: ${response.changes.type}\n• 세부사항: ${response.changes.details}`;
            }
            
            const messageContent = (response.message || '데이터 수정을 제안합니다.') + changesDescription +
                `\n\n수정된 시트: ${response.editedData.sheetName}\n` +
                `수정된 행 수: ${response.editedData.data.length}개\n` +
                `열 수: ${response.editedData.data[0]?.length || 0}개`;

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: messageContent,
                timestamp: new Date(),
                dataFixData: {
                    editedData: response.editedData,
                    sheetIndex: targetSheetIndex,
                    changes: response.changes,
                    isApplied: false
                },
                mode: 'datafix'
            };

            console.log('✅ 데이터 수정 메시지 추가:', assistantMessage);
            addMessageToSheet(activeSheetIndex, assistantMessage);
        } else {
            console.warn('⚠️ 데이터 수정 응답에 editedData가 없습니다.');
            // editedData가 없어도 메시지가 있으면 표시
            if (response.message) {
                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: response.message,
                    timestamp: new Date()
                };
                addMessageToSheet(activeSheetIndex, assistantMessage);
            }
        }
    };

    // 데이터 편집 응답 처리 (datafix와 유사하게 처리)
    const handleDataEditResponse = async (response: OrchestratorChatResponseDto) => {
        console.log('📝 데이터 편집 응답 처리 시작:', response);
        
        // 중첩된 데이터 구조 처리: response.data.editedData 또는 response.editedData
        const editedData = response.editedData || (response as any).data?.editedData;
        const sheetIndex = response.sheetIndex !== undefined ? response.sheetIndex : (response as any).data?.sheetIndex;
        const changes = response.changes || (response as any).data?.changes;
        const explanation = response.message || (response as any).data?.explanation;
        
        console.log('📊 추출된 데이터:', {
            hasEditedData: !!editedData,
            sheetIndex,
            hasChanges: !!changes,
            explanation
        });
        
        if (editedData) {
            const targetSheetIndex = sheetIndex !== undefined ? sheetIndex : activeSheetIndex;
            
            // 변경 사항 설명 생성
            let changesDescription = '';
            if (changes) {
                changesDescription = `\n\n변경 내용:\n• 유형: ${changes.type}\n• 세부사항: ${changes.details}`;
            }
            
            // 편집된 데이터에서 headers 제외하고 data만 사용
            const dataToProcess = editedData.data || editedData;
            
            const messageContent = (explanation || '데이터 편집을 제안합니다.') + changesDescription +
                `\n\n편집된 시트: ${editedData.sheetName}\n` +
                `편집된 행 수: ${dataToProcess.length}개\n` +
                `열 수: ${dataToProcess[0]?.length || 0}개`;

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: messageContent,
                timestamp: new Date(),
                dataFixData: {
                    editedData: {
                        sheetName: editedData.sheetName,
                        data: dataToProcess // headers를 제외한 실제 데이터만 전달
                    },
                    sheetIndex: targetSheetIndex,
                    changes: changes,
                    isApplied: false
                },
                mode: 'datafix' // datafix 모드로 설정하여 기존 UI 재사용
            };

            console.log('✅ 데이터 편집 메시지 추가:', {
                messageId: assistantMessage.id,
                sheetName: editedData.sheetName,
                dataRows: dataToProcess.length,
                targetSheetIndex
            });
            addMessageToSheet(activeSheetIndex, assistantMessage);
        } else {
            console.warn('⚠️ 데이터 편집 응답에 editedData가 없습니다.');
            console.warn('전체 응답 구조:', JSON.stringify(response, null, 2));
            
            // editedData가 없어도 메시지가 있으면 표시
            const fallbackMessage = explanation || response.message || '데이터 편집 요청을 처리했습니다.';
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: fallbackMessage,
                timestamp: new Date()
            };
            addMessageToSheet(activeSheetIndex, assistantMessage);
        }
    };

    // 데이터 생성 응답 처리
    const handleDataGenerationResponse = async (response: OrchestratorChatResponseDto) => {
        console.log('📊 데이터 생성 응답 처리 시작:', response);
        
        // generate-chat과 datageneration 모두 지원하도록 editedData 추출
        const editedData = response.editedData || (response as any).data?.editedData;
        const sheetIndex = response.sheetIndex !== undefined ? response.sheetIndex : (response as any).data?.sheetIndex;
        const explanation = response.message || (response as any).data?.explanation;
        
        console.log('📊 추출된 데이터:', {
            hasEditedData: !!editedData,
            sheetIndex,
            explanation: explanation?.substring(0, 50) + '...'
        });
        
        if (editedData) {
            const targetSheetIndex = sheetIndex !== undefined ? sheetIndex : activeSheetIndex;
            
            // 데이터를 스프레드시트에 즉시 적용
            applyGeneratedData({
                sheetName: editedData.sheetName,
                data: editedData.data,
                sheetIndex: targetSheetIndex
            });

            const messageContent = (explanation || response.message || '데이터가 생성되었습니다!') +
                `\n\n시트명: ${editedData.sheetName}\n` +
                `생성된 행 수: ${editedData.data.length}개\n` +
                `열 수: ${editedData.data[0]?.length || 0}개\n\n` +
                `새로운 데이터가 스프레드시트에 자동으로 추가되었습니다.`;

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: messageContent,
                timestamp: new Date()
            };

            console.log('✅ 데이터 생성 메시지 추가:', {
                messageId: assistantMessage.id,
                sheetName: editedData.sheetName,
                dataRows: editedData.data.length,
                targetSheetIndex
            });
            addMessageToSheet(activeSheetIndex, assistantMessage);

            // 생성된 시트로 자동 전환 (다른 시트에 생성된 경우)
            if (targetSheetIndex !== activeSheetIndex && xlsxData && xlsxData.sheets[targetSheetIndex]) {
                setTimeout(() => {
                    switchToSheet(targetSheetIndex);
                }, 1000);
            }
        } else {
            console.warn('⚠️ 데이터 생성 응답에 editedData가 없습니다.');
            console.warn('전체 응답 구조:', JSON.stringify(response, null, 2));
            
            // editedData가 없어도 메시지가 있으면 표시
            const fallbackMessage = explanation || response.message || '데이터 생성 요청을 처리했습니다.';
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: fallbackMessage,
                timestamp: new Date()
            };
            addMessageToSheet(activeSheetIndex, assistantMessage);
        }
    };

    // 일반 채팅 응답 처리 (normal, general-chat 등)
    const handleNormalResponse = async (response: OrchestratorChatResponseDto) => {
        console.log('💬 일반 채팅 응답 처리 시작:', response);
        
        // orchestrator의 다양한 응답 구조 지원
        let messageContent = '';
        
        // 1. 직접 message 필드가 있는 경우
        if (response.message && typeof response.message === 'string') {
            messageContent = response.message;
            console.log('📍 response.message에서 메시지 추출');
        }
        // 2. explanation.korean이 있는 경우 (일부 응답에서 사용)
        else if (response.explanation && typeof response.explanation === 'object' && (response.explanation as any).korean) {
            messageContent = (response.explanation as any).korean;
            console.log('📍 response.explanation.korean에서 메시지 추출');
        }
        // 3. data.message가 있는 경우 (orchestrator의 새로운 구조)
        else if ((response as any).data?.message) {
            messageContent = (response as any).data.message;
            console.log('📍 response.data.message에서 메시지 추출');
        }
        // 4. data.content가 있는 경우
        else if ((response as any).data?.content) {
            messageContent = (response as any).data.content;
            console.log('📍 response.data.content에서 메시지 추출');
        }
        // 5. 백엔드 응답에서 직접 content를 찾는 경우
        else if ((response as any).content) {
            messageContent = (response as any).content;
            console.log('📍 response.content에서 메시지 추출');
        }
        // 6. title만 있는 경우
        else if (response.title) {
            messageContent = response.title;
            console.log('📍 response.title에서 메시지 추출');
        }
        // 7. 오류 메시지가 있는 경우
        else if (response.error) {
            messageContent = `오류가 발생했습니다: ${response.error}`;
            console.log('📍 response.error에서 메시지 추출');
        }
        // 8. 성공 상태이지만 메시지가 없는 경우
        else if (response.success) {
            messageContent = '요청이 성공적으로 처리되었습니다.';
            console.log('📍 기본 성공 메시지 사용');
        }
        // 9. 기본 메시지
        else {
            console.warn('⚠️ 응답에서 메시지를 찾을 수 없어 기본 메시지 사용');
            console.warn('전체 응답 구조:', JSON.stringify(response, null, 2));
            messageContent = '응답을 받았지만 내용을 표시할 수 없습니다.';
        }
        
        console.log('📝 추출된 메시지 길이:', messageContent.length);
        console.log('📝 추출된 메시지 미리보기:', messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''));
        
        // 최종 검증
        if (!messageContent || messageContent.trim() === '') {
            console.error('❌ 메시지 내용이 비어있습니다. 전체 응답:', JSON.stringify(response, null, 2));
            messageContent = '응답을 받았지만 내용을 표시할 수 없습니다.';
        }
        
        const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'Extion ai',
            content: messageContent,
            timestamp: new Date()
        };

        console.log('✅ 일반 메시지 추가:', {
            id: assistantMessage.id,
            contentLength: messageContent.length,
            chatType: response.chatType,
            hasContent: !!messageContent,
            responseKeys: Object.keys(response)
        });
        
        addMessageToSheet(activeSheetIndex, assistantMessage);
    };



    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (isComposing) return;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim() && !isLoading) {
                sendMessage();
            }
        }
    };

    // 새 메시지가 추가되거나 로딩 상태가 변경될 때 스크롤을 맨 아래로 이동하는 효과
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [activeSheetMessages, isLoading]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* 디버그 정보 - chatId 표시 */}
            {/* {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs">
                    <div className="max-w-3xl mx-auto">
                        <span className="font-medium text-yellow-800">디버그:</span>{' '}
                        <span className="text-yellow-700">
                            현재 ChatID: {currentChatId || '없음'}
                        </span>
                    </div>
                </div>
            )} */}
            
            <div className="flex flex-col h-full w-full">
                {/* 파일 정보를 채팅 맨 위에 표시 */}
                {xlsxData && (
                    <div className="w-full border-b border-gray-200 bg-gray-50 shadow-sm flex-shrink-0">
                        <div className="w-full max-w-3xl mx-auto">
                            <FileUploadHandler
                                xlsxData={xlsxData}
                                handleDragOver={handleDragOver}
                                handleDragLeave={handleDragLeave}
                                handleDrop={handleDrop}
                                handleFileInputChange={handleFileInputChange}
                                removeFile={removeFile}
                                switchToSheet={switchToSheet}
                            />
                        </div>
                    </div>
                )}

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
                    {
                    // @ts-ignore: MessageDisplay에 onFunctionApply, appliedFunctionResults props 임시 추가
                    }
                    <MessageDisplay
                        messages={activeSheetMessages}
                        onArtifactClick={handleArtifactClick}
                        onDataFixApply={handleApplyDataFix}
                        appliedDataFixes={appliedDataFixes}
                        onFunctionApply={handleApplyFunctionResult}
                        appliedFunctionResults={appliedFunctionResults}
                        isLoading={isLoading}
                    />

                    {/* 로딩 진행 표시 */}
                    {isLoading && (
                        <div className="mt-4 px-4">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${loadingProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                {loadingHints[loadingHintIndex]}
                            </p>
                        </div>
                    )}
                </div>

                <div className="w-full max-w-2xl mx-auto flex-shrink-0">
                    <ChatInput
                        currentMode={currentMode}
                        inputValue={inputValue}
                        isDragOver={isDragOver}
                        isLoading={isLoading}
                        loadingStates={loadingStates}
                        isArtifactModalOpen={isArtifactModalOpen}
                        fileExists={!!file}
                        hasUploadedFile={hasUploadedFile}
                        onInputChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        onSendMessage={sendMessage}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        handleFileInputChange={handleFileInputChange}
                    />
                </div>
            </div>
        </div>
    );
} 