'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { useUnifiedStore, ChatMessage } from '@/stores';
import { processXLSXFile } from '../../utils/fileProcessing';
import { detectAndDecode, isValidSpreadsheetFile } from '../../utils/chatUtils';
import { callArtifactAPI, callFormulaAPI, callDataGenerationAPI, callNormalChatAPI, callDataFixAPI } from '../../services/api/dataServices';
import { Message } from './MessageDisplay';
import { ChatMode } from '../../app/actions/chatActions';
import { findActualDataBounds } from '../../utils/fileProcessing';
import { saveSpreadsheetToFirebase } from '../../services/api/dataServices';
import { Send, Upload, FileSpreadsheet, Trash2, RotateCcw, Activity } from 'lucide-react';

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

    // Zustand 스토어 사용
    const {
        xlsxData,
        extendedSheetContext,
        loadingStates,
        hasUploadedFile,
        setXLSXData,
        setLoadingState,
        setError,
        setPendingFormula,
        addToFormulaHistory,
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
    } = useUnifiedStore();

    // Firebase 채팅 ID 상태 추가
    const [firebaseChatId, setFirebaseChatId] = useState<string | null>(null);

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
                        headers: s.headers.length,
                        data: s.data.length,
                        rawData: s.rawData?.length || 0,
                        headerRow: s.headerInfo?.headerRow,
                        isAutoGenerated: s.headerInfo?.isAutoGenerated,
                        dataBounds: s.dataBounds
                    }))
                });

                // 기존 xlsxData가 있는 경우 새 시트로 추가
                if (xlsxData) {
                    const newXlsxData = { ...xlsxData };

                    // 각 시트의 데이터 확인
                    const newSheets = result.sheets.map(sheet => {
                        console.log(`시트 처리: ${sheet.sheetName}, 헤더: ${sheet.headers.length}, 데이터 행: ${sheet.data.length}`);

                        return {
                            sheetName: sheet.sheetName,
                            rawData: sheet.rawData,
                            headers: sheet.headers,
                            data: sheet.data,
                            metadata: {
                                rowCount: sheet.data.length,
                                columnCount: sheet.headers.length,
                                headerRow: sheet.metadata?.headerRow ?? -1,
                                dataRange: {
                                    startRow: sheet.metadata?.dataRange?.startRow || 0,
                                    endRow: sheet.metadata?.dataRange?.endRow || sheet.data.length,
                                    startCol: sheet.metadata?.dataRange?.startCol || 0,
                                    endCol: sheet.metadata?.dataRange?.endCol || sheet.headers.length - 1,
                                    startColLetter: sheet.metadata?.dataRange?.startColLetter || 'A',
                                    endColLetter: sheet.metadata?.dataRange?.endColLetter || columnIndexToLetter(sheet.headers.length - 1)
                                },
                                headerRowData: sheet.metadata?.headerRowData || sheet.headers,
                                headerMap: sheet.metadata?.headerMap || {},
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

                    // Firebase에 업데이트된 스프레드시트 저장
                    try {
                        const saveResult = await saveSpreadsheetToFirebase(
                            {
                                fileName: newXlsxData.fileName,
                                sheets: newXlsxData.sheets,
                                activeSheetIndex: newXlsxData.activeSheetIndex
                            },
                            {
                                originalFileName: file.name,
                                fileSize: file.size,
                                fileType: 'xlsx'
                            },
                            {
                                chatId: getCurrentChatId?.() // 현재 채팅 ID 가져오기 (구현 필요)
                            }
                        );

                        console.log('스프레드시트가 Firebase에 저장되었습니다:', saveResult.spreadsheetId);

                        // 저장된 spreadsheetId를 데이터에 추가
                        const updatedXlsxData = {
                            ...newXlsxData,
                            spreadsheetId: saveResult.spreadsheetId
                        };
                        setXLSXData(updatedXlsxData);

                        // 스토어에 chatId와 spreadsheetId 저장
                        if (saveResult.chatId) {
                            setCurrentChatId(saveResult.chatId);
                        }
                        
                        if (saveResult.spreadsheetId) {
                            setCurrentSpreadsheetId(saveResult.spreadsheetId);
                            setSpreadsheetMetadata({
                                fileName: newXlsxData.fileName,
                                originalFileName: file.name,
                                fileSize: file.size,
                                fileType: 'xlsx',
                                isSaved: true,
                                lastSaved: new Date()
                            });
                            markAsSaved(saveResult.spreadsheetId);
                        }

                    } catch (saveError) {
                        console.error('Firebase 저장 실패:', saveError);
                    }

                    const successMessage: ChatMessage = {
                        id: Date.now().toString(),
                        type: 'Extion ai',
                        content: `${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
                            `추가된 시트 정보:\n` +
                            newSheets.map((sheet, index) => {
                                const headerInfo = result.sheets[index].headerInfo;
                                const headerStatus = headerInfo?.isAutoGenerated
                                    ? '(자동 생성된 헤더)'
                                    : headerInfo?.headerRow === -1
                                        ? '(헤더 없음)'
                                        : '';
                                return `• ${sheet.sheetName}: ${sheet.headers.length}열 × ${sheet.data.length}행 ${headerStatus}`;
                            }).join('\n'),
                        timestamp: new Date()
                    };

                    // 현재 활성 시트에 메시지 추가
                    addMessageToSheet(activeSheetIndex, successMessage);
                } else {
                    // xlsxData가 없는 경우 새로 생성
                    const xlsxData = {
                        fileName: result.fileName,
                        sheets: result.sheets.map(sheet => ({
                            sheetName: sheet.sheetName,
                            rawData: sheet.rawData,
                            headers: sheet.headers,
                            data: sheet.data,
                            metadata: {
                                rowCount: sheet.data.length,
                                columnCount: sheet.headers.length,
                                headerRow: sheet.metadata?.headerRow ?? -1,
                                dataRange: {
                                    startRow: sheet.metadata?.dataRange?.startRow || 0,
                                    endRow: sheet.metadata?.dataRange?.endRow || sheet.data.length,
                                    startCol: sheet.metadata?.dataRange?.startCol || 0,
                                    endCol: sheet.metadata?.dataRange?.endCol || sheet.headers.length - 1,
                                    startColLetter: sheet.metadata?.dataRange?.startColLetter || 'A',
                                    endColLetter: sheet.metadata?.dataRange?.endColLetter || columnIndexToLetter(sheet.headers.length - 1)
                                },
                                headerRowData: sheet.metadata?.headerRowData || sheet.headers,
                                headerMap: sheet.metadata?.headerMap || {},
                                preserveOriginalStructure: true,
                                lastModified: new Date()
                            }
                        })),
                        activeSheetIndex: 0
                    };

                    setXLSXData(xlsxData);

                    // Firebase에 새 스프레드시트 저장
                    try {
                        const saveResult = await saveSpreadsheetToFirebase(
                            {
                                fileName: xlsxData.fileName,
                                sheets: xlsxData.sheets,
                                activeSheetIndex: xlsxData.activeSheetIndex
                            },
                            {
                                originalFileName: file.name,
                                fileSize: file.size,
                                fileType: 'xlsx'
                            },
                            {
                                chatId: getCurrentChatId?.() // 현재 채팅 ID 가져오기 (구현 필요)
                            }
                        );

                        console.log('스프레드시트가 Firebase에 저장되었습니다:', saveResult.spreadsheetId);

                        // 저장된 spreadsheetId를 데이터에 추가
                        const updatedXlsxData = {
                            ...xlsxData,
                            spreadsheetId: saveResult.spreadsheetId
                        };
                        setXLSXData(updatedXlsxData);

                        // 스토어에 chatId와 spreadsheetId 저장
                        if (saveResult.chatId) {
                            setCurrentChatId(saveResult.chatId);
                        }
                        
                        if (saveResult.spreadsheetId) {
                            setCurrentSpreadsheetId(saveResult.spreadsheetId);
                            setSpreadsheetMetadata({
                                fileName: updatedXlsxData.fileName,
                                originalFileName: file.name,
                                fileSize: file.size,
                                fileType: 'xlsx',
                                isSaved: true,
                                lastSaved: new Date()
                            });
                            markAsSaved(saveResult.spreadsheetId);
                        }

                    } catch (saveError) {
                        console.error('Firebase 저장 실패:', saveError);
                    }

                    const successMessage: ChatMessage = {
                        id: Date.now().toString(),
                        type: 'Extion ai',
                        content: `${file.name} 파일이 성공적으로 업로드되었습니다.\n\n` +
                            `파일 정보:\n` +
                            result.sheets.map((sheet, index) => {
                                const headerInfo = sheet.headerInfo;
                                const headerStatus = headerInfo?.isAutoGenerated
                                    ? '(자동 생성된 헤더)'
                                    : headerInfo?.headerRow === -1
                                        ? '(헤더 없음)'
                                        : '';
                                return `• ${sheet.sheetName}: ${sheet.headers.length}열 × ${sheet.data.length}행 ${headerStatus}`;
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

                            const {
                                findHeaderRow,
                                findDataRange,
                                columnIndexToLetter
                            } = require('../../utils/fileProcessing');

                            const dataBounds = findActualDataBounds(rawData);
                            const headerRow = findHeaderRow(rawData, dataBounds.minRow);
                            const {
                                headerRowData,
                                validHeaders,
                                headerMap,
                                maxRow,
                                maxCol
                            } = findDataRange(rawData, headerRow);

                            const data: string[][] = [];
                            const dataStartRow = headerRow === -1 ? dataBounds.minRow : Math.max(headerRow + 1, dataBounds.minRow);

                            // 헤더가 없는 경우 자동 생성
                            const headers = validHeaders.length > 0 ? validHeaders :
                                Array.from({ length: dataBounds.maxCol - dataBounds.minCol + 1 },
                                    (_, i) => `Column ${columnIndexToLetter(dataBounds.minCol + i)}`);

                            for (let row = dataStartRow; row <= maxRow; row++) {
                                if (!rawData[row]) continue;

                                const dataRow: string[] = [];

                                if (validHeaders.length > 0) {
                                    // 헤더가 있는 경우 기존 로직
                                    Object.keys(headerMap).forEach(originalIndexStr => {
                                        const originalIndex = parseInt(originalIndexStr);
                                        const cellValue = rawData[row][originalIndex] || '';
                                        dataRow.push(cellValue);
                                    });
                                } else {
                                    // 헤더가 없는 경우 데이터 범위 내 모든 열 포함
                                    for (let col = dataBounds.minCol; col <= dataBounds.maxCol; col++) {
                                        const cellValue = rawData[row][col] || '';
                                        dataRow.push(cellValue);
                                    }
                                }

                                data.push(dataRow);
                            }

                            // 기존 xlsxData가 있는 경우 새 시트로 추가
                            if (xlsxData) {
                                const newXlsxData = { ...xlsxData };
                                const newSheet = {
                                    sheetName: file.name.replace('.csv', ''),
                                    headers: headers,
                                    data: data,
                                    rawData: rawData,
                                    metadata: {
                                        rowCount: data.length,
                                        columnCount: headers.length,
                                        headerRow,
                                        dataRange: {
                                            startRow: dataStartRow,
                                            endRow: maxRow,
                                            startCol: dataBounds.minCol,
                                            endCol: dataBounds.maxCol,
                                            startColLetter: columnIndexToLetter(dataBounds.minCol),
                                            endColLetter: columnIndexToLetter(dataBounds.maxCol)
                                        },
                                        headerRowData: headerRow !== -1 ? headerRowData : headers,
                                        headerMap: headerRow !== -1 ? headerMap : {},
                                        preserveOriginalStructure: true,
                                        lastModified: new Date()
                                    }
                                };

                                newXlsxData.sheets = [...newXlsxData.sheets, newSheet];
                                setXLSXData(newXlsxData);

                                // Firebase에 업데이트된 스프레드시트 저장
                                (async () => {
                                    try {
                                        const saveResult = await saveSpreadsheetToFirebase(
                                            {
                                                fileName: newXlsxData.fileName,
                                                sheets: newXlsxData.sheets,
                                                activeSheetIndex: newXlsxData.activeSheetIndex
                                            },
                                            {
                                                originalFileName: file.name,
                                                fileSize: file.size,
                                                fileType: 'csv'
                                            },
                                            {
                                                chatId: getCurrentChatId?.() // 현재 채팅 ID 가져오기 (구현 필요)
                                            }
                                        );

                                        console.log('스프레드시트가 Firebase에 저장되었습니다:', saveResult.spreadsheetId);

                                        // 저장된 spreadsheetId를 데이터에 추가
                                        const updatedXlsxData = {
                                            ...newXlsxData,
                                            spreadsheetId: saveResult.spreadsheetId
                                        };
                                        setXLSXData(updatedXlsxData);

                                        // 스토어에 chatId와 spreadsheetId 저장
                                        if (saveResult.chatId) {
                                            setCurrentChatId(saveResult.chatId);
                                        }
                                        
                                        if (saveResult.spreadsheetId) {
                                            setCurrentSpreadsheetId(saveResult.spreadsheetId);
                                            setSpreadsheetMetadata({
                                                fileName: newXlsxData.fileName,
                                                originalFileName: file.name,
                                                fileSize: file.size,
                                                fileType: 'csv',
                                                isSaved: true,
                                                lastSaved: new Date()
                                            });
                                            markAsSaved(saveResult.spreadsheetId);
                                        }

                                    } catch (saveError) {
                                        console.error('Firebase 저장 실패:', saveError);
                                    }
                                })();

                                const headerStatus = headerRow === -1 ? '(자동 생성된 헤더)' : '';
                                const dataLocation = dataBounds.minRow > 0 || dataBounds.minCol > 0
                                    ? ` - 데이터 위치: ${columnIndexToLetter(dataBounds.minCol)}${dataBounds.minRow + 1}부터`
                                    : '';

                                const successMessage: ChatMessage = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
                                        `추가된 시트 정보:\n` +
                                        `• ${newSheet.sheetName}: ${headers.length}열 × ${data.length}행 ${headerStatus}${dataLocation}`,
                                    timestamp: new Date()
                                };

                                // 현재 활성 시트에 메시지 추가
                                addMessageToSheet(activeSheetIndex, successMessage);
                            } else {
                                // xlsxData가 없는 경우 새로 생성
                                const xlsxData = {
                                    fileName: file.name,
                                    sheets: [{
                                        sheetName: file.name.replace('.csv', ''),
                                        headers: headers,
                                        data: data,
                                        rawData: rawData,
                                        metadata: {
                                            rowCount: data.length,
                                            columnCount: headers.length,
                                            headerRow,
                                            dataRange: {
                                                startRow: dataStartRow,
                                                endRow: maxRow,
                                                startCol: dataBounds.minCol,
                                                endCol: dataBounds.maxCol,
                                                startColLetter: columnIndexToLetter(dataBounds.minCol),
                                                endColLetter: columnIndexToLetter(dataBounds.maxCol)
                                            },
                                            headerRowData: headerRow !== -1 ? headerRowData : headers,
                                            headerMap: headerRow !== -1 ? headerMap : {},
                                            preserveOriginalStructure: true,
                                            lastModified: new Date()
                                        }
                                    }],
                                    activeSheetIndex: 0
                                };

                                setXLSXData(xlsxData);

                                // Firebase에 새 스프레드시트 저장
                                (async () => {
                                    try {
                                        const saveResult = await saveSpreadsheetToFirebase(
                                            {
                                                fileName: xlsxData.fileName,
                                                sheets: xlsxData.sheets,
                                                activeSheetIndex: xlsxData.activeSheetIndex
                                            },
                                            {
                                                originalFileName: file.name,
                                                fileSize: file.size,
                                                fileType: 'csv'
                                            },
                                            {
                                                chatId: getCurrentChatId?.() // 현재 채팅 ID 가져오기 (구현 필요)
                                            }
                                        );

                                        console.log('스프레드시트가 Firebase에 저장되었습니다:', saveResult.spreadsheetId);

                                        // 저장된 spreadsheetId를 데이터에 추가
                                        const updatedXlsxData = {
                                            ...xlsxData,
                                            spreadsheetId: saveResult.spreadsheetId
                                        };
                                        setXLSXData(updatedXlsxData);

                                        // 스토어에 chatId와 spreadsheetId 저장
                                        if (saveResult.chatId) {
                                            setCurrentChatId(saveResult.chatId);
                                        }
                                        
                                        if (saveResult.spreadsheetId) {
                                            setCurrentSpreadsheetId(saveResult.spreadsheetId);
                                            setSpreadsheetMetadata({
                                                fileName: xlsxData.fileName,
                                                originalFileName: file.name,
                                                fileSize: file.size,
                                                fileType: 'csv',
                                                isSaved: true,
                                                lastSaved: new Date()
                                            });
                                            markAsSaved(saveResult.spreadsheetId);
                                        }

                                    } catch (saveError) {
                                        console.error('Firebase 저장 실패:', saveError);
                                    }
                                })();

                                const headerStatus = headerRow === -1
                                    ? '\n헤더가 자동으로 생성되었습니다.'
                                    : '';
                                const dataLocation = dataBounds.minRow > 0 || dataBounds.minCol > 0
                                    ? `\n데이터 위치: ${columnIndexToLetter(dataBounds.minCol)}${dataBounds.minRow + 1}부터 시작`
                                    : '';

                                const successMessage: ChatMessage = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `${file.name} 파일이 성공적으로 로드되었습니다.\n` +
                                        `${headers.length}열 × ${data.length}행의 데이터가 스프레드시트에 표시됩니다.${headerStatus}${dataLocation}`,
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
        markAsSaved
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

    // 메시지 전송 함수 - 시트 업로드 여부 확인 후 채팅 모드 결정
    const sendMessage = async () => {
        if (!inputValue.trim()) return;

        setIsLoading(true);

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

            // 시트가 업로드되어 있지 않으면 datageneration 모드 사용
            if (!xlsxData || !xlsxData.sheets || xlsxData.sheets.length === 0) {
                setCurrentMode('normal'); // datageneration은 ChatMode에 없으므로 normal로 설정
                await handleDataGenerationChat(currentInput, isFirebaseChatActive);
                return;
            }

            // 시트가 있는 경우 간단한 키워드 기반으로 채팅 모드 결정
            let mode: ChatMode = 'normal'; // 기본값 설정
            
            // 임시로 간단한 키워드 기반 모드 결정 (서버 액션 문제 회피)
            const input = currentInput.toLowerCase();
            if (input.includes('함수') || input.includes('수식') || input.includes('평균') || input.includes('합계') || input.includes('최대') || input.includes('최소')) {
                mode = 'formula';
            } else if (input.includes('시각화') || input.includes('차트') || input.includes('그래프') || input.includes('분석')) {
                mode = 'artifact';
            } else if (input.includes('정렬') || input.includes('필터') || input.includes('수정') || input.includes('변경') || input.includes('삭제')) {
                mode = 'datafix';
            } else {
                mode = 'normal';
            }
            
            console.log(`채팅 모드 결정: "${currentInput}" -> ${mode}`);
            
            // 채팅 모드 설정
            setCurrentMode(mode);

            // 해당 모드에 맞는 API 호출
            if (mode === 'formula') {
                await handleFormulaChat(currentInput, isFirebaseChatActive);
            } else if (mode === 'artifact') {
                await handleArtifactChat(currentInput, isFirebaseChatActive);
            } else if (mode === 'datafix') {
                await handleDataFixChat(currentInput, isFirebaseChatActive);
            } else {
                await handleNormalChat(currentInput, isFirebaseChatActive);
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

    // 각 채팅 모드별 핸들러 함수
    const handleFormulaChat = async (userInput: string, isFirebaseChat?: boolean) => {
        try {
            setCurrentMode('formula');

            const response = await callFormulaAPI(
                userInput,
                extendedSheetContext,
                getDataForGPTAnalysis,
                {
                    chatId: getCurrentFirebaseChatId() || getCurrentChatId(),
                    currentSheetIndex: activeSheetIndex
                }
            );

            if (response.success && response.formula) {
                console.log('🎉 포뮬러 응답 수신:', {
                    formula: response.formula,
                    cellAddress: response.cellAddress,
                    explanation: response.explanation?.korean,
                    activeSheetIndex
                });

                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: `수식이 생성되었습니다!\n\n` +
                        `수식: \`${response.formula}\`\n` +
                        `설명: ${response.explanation?.korean || '함수가 생성되었습니다.'}\n\n` +
                        `이 수식을 ${response.cellAddress} 에 적용하였습니다`,
                    timestamp: new Date()
                };

                // 현재 활성 시트에 응답 메시지 추가
                addMessageToSheet(activeSheetIndex, assistantMessage);

                const formulaApplication = {
                    formula: response.formula,
                    cellAddress: response.cellAddress || 'E1',
                    explanation: response.explanation?.korean || '함수가 생성되었습니다.',
                    timestamp: new Date()
                };

                console.log('🚀 setPendingFormula 호출 준비:', {
                    formulaApplication,
                    sheetIndex: activeSheetIndex,
                    finalObject: {
                        ...formulaApplication,
                        sheetIndex: activeSheetIndex
                    }
                });

                setPendingFormula({
                    ...formulaApplication,
                    sheetIndex: activeSheetIndex
                });

                console.log('✅ setPendingFormula 호출 완료');

                addToFormulaHistory({
                    ...formulaApplication,
                    sheetIndex: activeSheetIndex
                });
            } else {
                console.error('❌ 포뮬러 응답 실패:', {
                    success: response.success,
                    hasFormula: !!response.formula,
                    error: response.error
                });
                throw new Error(response.error || '함수 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('포뮬러 채팅 오류:', error);
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: `포뮬러 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };

            // 현재 활성 시트에 오류 메시지 추가
            addMessageToSheet(activeSheetIndex, assistantMessage);
        }
    };

    const handleArtifactChat = async (userInput: string, isFirebaseChat?: boolean) => {
        try {
            setCurrentMode('artifact');

            const response = await callArtifactAPI(
                userInput,
                extendedSheetContext,
                getDataForGPTAnalysis,
                {
                    chatId: getCurrentFirebaseChatId() || getCurrentChatId(),
                    currentSheetIndex: activeSheetIndex
                }
            );

            if (response.success && response.code) {
                const artifactData = {
                    type: response.type || 'analysis',
                    title: response.title || `${response.type} 분석`,
                    timestamp: new Date(),
                    code: response.code,
                    messageId: (Date.now() + 1).toString()
                };

                addToArtifactHistory(artifactData);

                // 백엔드에서 제공하는 설명 사용
                const explanation = typeof response.explanation === 'string' 
                    ? response.explanation 
                    : response.explanation?.korean || '';
                
                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: explanation, // 설명을 content에 저장
                    timestamp: new Date(),
                    artifactData: {
                        type: response.type || 'analysis',
                        title: response.title || `${response.type} 분석`,
                        timestamp: new Date(),
                        code: response.code,
                        artifactId: (Date.now() + 1).toString()
                    }
                };

                addMessageToSheet(activeSheetIndex, assistantMessage);
            } else {
                throw new Error(response.error || '아티팩트 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('아티팩트 채팅 오류:', error);
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: `아티팩트 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };

            addMessageToSheet(activeSheetIndex, assistantMessage);
        }
    };

    const handleDataGenerationChat = async (userInput: string, isFirebaseChat?: boolean) => {
        try {
            setCurrentMode('normal');

            const response = await callDataGenerationAPI(
                userInput,
                extendedSheetContext,
                getDataForGPTAnalysis,
                {
                    chatId: getCurrentFirebaseChatId() || getCurrentChatId(),
                    currentSheetIndex: activeSheetIndex
                }
            );

            if (response.success && response.editedData) {
                applyGeneratedData({
                    sheetName: response.editedData.sheetName,
                    headers: response.editedData.headers,
                    data: response.editedData.data,
                    sheetIndex: response.sheetIndex || activeSheetIndex
                });

                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: `데이터가 생성되었습니다!\n\n` +
                        `시트명: ${response.editedData.sheetName}\n` +
                        `생성된 행 수: ${response.editedData.data.length}개\n` +
                        `열 수: ${response.editedData.headers.length}개\n\n` +
                        `새로운 데이터가 스프레드시트에 추가되었습니다.`,
                    timestamp: new Date()
                };

                addMessageToSheet(activeSheetIndex, assistantMessage);
            } else {
                throw new Error(response.error || '데이터 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('데이터 생성 채팅 오류:', error);
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: `데이터 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };

            addMessageToSheet(activeSheetIndex, assistantMessage);
        }
    };

    const handleDataFixChat = async (userInput: string, isFirebaseChat?: boolean) => {
        try {
            setCurrentMode('datafix');

            const response = await callDataFixAPI(
                userInput,
                extendedSheetContext,
                getDataForGPTAnalysis,
                {
                    chatId: getCurrentFirebaseChatId() || getCurrentChatId(),
                    currentSheetIndex: activeSheetIndex
                }
            );

            if (response.success && response.editedData) {
                applyGeneratedData({
                    sheetName: response.editedData.sheetName,
                    headers: response.editedData.headers,
                    data: response.editedData.data,
                    sheetIndex: response.sheetIndex || activeSheetIndex
                });

                const changesText = response.changes 
                    ? (typeof response.changes === 'string' 
                        ? response.changes 
                        : JSON.stringify(response.changes))
                    : '데이터가 수정되었습니다.';

                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: `데이터가 수정되었습니다!\n\n` +
                        `시트명: ${response.editedData.sheetName}\n` +
                        `수정된 행 수: ${response.editedData.data.length}개\n` +
                        `열 수: ${response.editedData.headers.length}개\n\n` +
                        `변경 사항:\n${changesText}`,
                    timestamp: new Date()
                };

                addMessageToSheet(activeSheetIndex, assistantMessage);
            } else {
                throw new Error(response.error || '데이터 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('데이터 수정 채팅 오류:', error);
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: `데이터 수정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };

            // 현재 활성 시트에 오류 메시지 추가
            addMessageToSheet(activeSheetIndex, assistantMessage);
        }
    };

    const handleNormalChat = async (userInput: string, isFirebaseChat?: boolean) => {
        try {
            const response = await callNormalChatAPI(
                userInput,
                extendedSheetContext,
                getDataForGPTAnalysis,
                {
                    chatId: getCurrentFirebaseChatId() || getCurrentChatId(),
                    currentSheetIndex: activeSheetIndex
                }
            );

            if (response.success) {
                // 백엔드에서 반환된 chatId가 있으면 스토어에 업데이트
                if (response.chatId) {
                    setCurrentChatId(response.chatId);
                }

                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: response.message,
                    timestamp: new Date()
                };

                // 현재 활성 시트에 응답 메시지 추가
                addMessageToSheet(activeSheetIndex, assistantMessage);
            } else {
                throw new Error(response.error || '응답 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('일반 채팅 오류:', error);
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: `응답 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };

            // 현재 활성 시트에 오류 메시지 추가
            addMessageToSheet(activeSheetIndex, assistantMessage);
        }
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
                    <MessageDisplay
                        messages={activeSheetMessages}
                        onArtifactClick={handleArtifactClick}
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

                <div className="w-full max-w-3xl mx-auto flex-shrink-0">
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