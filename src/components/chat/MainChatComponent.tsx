'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { useExtendedUnifiedDataStore, ChatMessage } from '../../stores/useUnifiedDataStore';
import { processXLSXFile } from '../../utils/fileProcessing';
import { detectAndDecode, isValidSpreadsheetFile } from '../../utils/chatUtils';
import { callArtifactAPI, callFormulaAPI, callDataGenerationAPI, callNormalChatAPI, callDataFixAPI } from '../../services/api/dataServices';
import { Message } from './MessageDisplay';
import { determineChatMode, ChatMode } from '../../app/actions/chatActions';
import { findActualDataBounds } from '../../utils/fileProcessing';
import { saveSpreadsheetToFirebase } from '../../services/api/dataServices';

// 컴포넌트 가져오기
import MessageDisplay from './MessageDisplay';
import FileUploadHandler from './FileUploadHandler';
import ChatInput from './ChatInput';

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
    const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
        setCurrentSpreadsheetId,
        setSpreadsheetMetadata,
        markAsSaved,
        canUploadFile,
        saveCurrentSessionToStore,
        loadChatSessionsFromStorage,
    } = useExtendedUnifiedDataStore();

    // 파일이 로드되었는지 확인
    const file = xlsxData ? { name: xlsxData.fileName } : null;

    // 현재 활성 시트 인덱스 가져오기
    const activeSheetIndex = xlsxData?.activeSheetIndex || 0;

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

    // === 채팅 ID 초기화 Effect 추가 ===
    useEffect(() => {
        const initChat = () => {
            // 채팅 ID 초기화 (기존 것이 있으면 사용, 없으면 새로 생성)
            const chatId = initializeChatId();
            console.log('채팅 ID 초기화됨:', chatId);
        };

        initChat();
    }, []); // 컴포넌트 마운트 시 한 번만 실행

     // === URL 파라미터 변경 감지 Effect (옵션) ===
     useEffect(() => {
        const handleUrlChange = () => {
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                const chatIdFromUrl = urlParams.get('chatId');
                
                if (chatIdFromUrl && chatIdFromUrl !== currentChatId) {
                    setCurrentChatId(chatIdFromUrl);
                }
            }
        };

        // popstate 이벤트 리스너 (뒤로 가기/앞으로 가기)
        window.addEventListener('popstate', handleUrlChange);
        
        return () => {
            window.removeEventListener('popstate', handleUrlChange);
        };
    }, [currentChatId, setCurrentChatId]);

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

        // 파일 업로드가 이미 된 경우 파일 드롭 비활성화
        if (!canUploadFile()) {
            console.log('이미 파일이 업로드되어 새로운 파일을 업로드할 수 없습니다.');
            return;
        }

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && isValidSpreadsheetFile(droppedFile)) {
            processFile(droppedFile);
        }
    }, [canUploadFile]);

    // 파일 처리 함수
    const processFile = async (file: File) => {
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
                                headerRow: sheet.metadata?.headerRow || -1,
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
                                headerRow: sheet.metadata?.headerRow || -1,
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
                                fileName: xlsxData.fileName,
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

                    const firstSheet = result.sheets[0];
                    const headerInfo = firstSheet.headerInfo;
                    const headerStatus = headerInfo?.isAutoGenerated
                        ? '\n헤더가 자동으로 생성되었습니다. 추후 헤더를 직접 지정할 수 있습니다.'
                        : headerInfo?.headerRow === -1
                            ? '\n헤더를 감지하지 못했습니다. 데이터가 첫 행부터 시작됩니다.'
                            : '';

                    const successMessage: ChatMessage = {
                        id: Date.now().toString(),
                        type: 'Extion ai',
                        content: `${file.name} 파일이 성공적으로 업로드되었습니다.\n\n` +
                            `시트 정보:\n` +
                            xlsxData.sheets.map((sheet, index) => {
                                const originalSheet = result.sheets[index];
                                const headerInfo = originalSheet.headerInfo;
                                const headerStatus = headerInfo?.isAutoGenerated
                                    ? '(자동 생성된 헤더)'
                                    : headerInfo?.headerRow === -1
                                        ? '(헤더 없음)'
                                        : '';

                                // 데이터 위치 정보
                                const bounds = originalSheet.dataBounds;
                                const dataLocation = bounds.minRow > 0 || bounds.minCol > 0
                                    ? ` - 데이터 위치: ${columnIndexToLetter(bounds.minCol)}${bounds.minRow + 1}부터`
                                    : '';

                                return `${sheet.sheetName}: ${sheet.headers.length}열 × ${sheet.data.length}행 ${headerStatus}${dataLocation}`;
                            }).join('\n') + headerStatus,
                        timestamp: new Date()
                    };

                    // 각 시트별로 별도의 채팅 메시지 추가
                    xlsxData.sheets.forEach((sheet, index) => {
                        const sheetMessage: ChatMessage = {
                            id: `${Date.now()}-${index}`,
                            type: 'Extion ai',
                            content: `${sheet.sheetName} 시트가 업로드되었습니다.\n\n` +
                                `• 열 수: ${sheet.headers.length}\n` +
                                `• 행 수: ${sheet.data.length}\n` +
                                `• 헤더: ${sheet.headers.slice(0, 5).join(', ')}${sheet.headers.length > 5 ? '...' : ''}`,
                            timestamp: new Date()
                        };
                        addMessageToSheet(index, sheetMessage);
                    });
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


    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 파일 업로드가 이미 된 경우 새로운 파일 업로드 비활성화
        if (!canUploadFile()) {
            console.log('이미 파일이 업로드되어 새로운 파일을 업로드할 수 없습니다.');
            return;
        }

        const selectedFile = e.target.files?.[0];
        if (selectedFile && isValidSpreadsheetFile(selectedFile)) {
            processFile(selectedFile);
        }
    };

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

        try {
            const currentInput = inputValue;
            setInputValue('');

            // 시트가 업로드되어 있지 않으면 datageneration 모드 사용
            if (!xlsxData || !xlsxData.sheets || xlsxData.sheets.length === 0) {
                setCurrentMode('normal'); // datageneration은 ChatMode에 없으므로 normal로 설정
                await handleDataGenerationChat(currentInput);
                return;
            }

            // 시트가 있는 경우 서버 액션을 호출하여 채팅 모드 결정
            const { mode } = await determineChatMode(inputValue);
            
            // 채팅 모드 설정
            setCurrentMode(mode);

            // 해당 모드에 맞는 API 호출
            if (mode === 'formula') {
                await handleFormulaChat(currentInput);
            } else if (mode === 'artifact') {
                await handleArtifactChat(currentInput);
            } else if (mode === 'datafix') {
                await handleDataFixChat(currentInput);
            } else {
                await handleNormalChat(currentInput);
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
    const handleFormulaChat = async (userInput: string) => {
        setLoadingState('formulaGeneration', true);
        setError('formulaError', null);

        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('timeout')), 15000);
            });

            // 현재 chatId를 가져와서 API 호출에 포함
            const chatId = getCurrentChatId();

            const apiCall = callFormulaAPI(userInput, extendedSheetContext, {
                chatId: chatId || undefined,
                currentSheetIndex: activeSheetIndex // 현재 시트 인덱스 전달
            });
            const result = await Promise.race([apiCall, timeoutPromise]);

            if (result.success && result.formula) {
                // 백엔드에서 반환된 chatId가 있으면 스토어에 업데이트
                if (result.chatId) {
                    setCurrentChatId(result.chatId);
                }

                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: `함수가 생성되었습니다!

생성된 함수: ${result.formula}
적용 위치: ${result.cellAddress || 'E1'}

설명: ${result.explanation?.korean || '함수가 생성되었습니다.'}

${result.cellAddress ? `셀 ${result.cellAddress}에 함수가 적용됩니다.` : ''}`,
                    timestamp: new Date(),
                    mode: 'formula'
                };

                // 현재 활성 시트에 응답 메시지 추가
                addMessageToSheet(activeSheetIndex, assistantMessage);

                const formulaApplication = {
                    formula: result.formula,
                    cellAddress: result.cellAddress || 'E1',
                    explanation: result.explanation?.korean || '함수가 생성되었습니다.',
                    timestamp: new Date()
                };

                setPendingFormula({
                    ...formulaApplication,
                    sheetIndex: activeSheetIndex // 현재 활성화된 시트 인덱스 추가
                });
                addToFormulaHistory({
                    ...formulaApplication,
                    sheetIndex: activeSheetIndex // 현재 활성화된 시트 인덱스 추가
                });
            } else {
                throw new Error(result.error || '함수 생성에 실패했습니다.');
            }
        } catch (error) {
            let errorMessage = '함수 생성 중 오류가 발생했습니다.';

            if (error instanceof Error && error.message === 'timeout') {
                errorMessage = '요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
            } else if (error instanceof Error) {
                errorMessage = `${error.message}`;
            }

            setError('formulaError', errorMessage);

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: errorMessage,
                timestamp: new Date(),
                mode: 'formula'
            };

            // 현재 활성 시트에 오류 메시지 추가
            addMessageToSheet(activeSheetIndex, assistantMessage);
        } finally {
            setLoadingState('formulaGeneration', false);
        }
    };

    const handleArtifactChat = async (userInput: string) => {
        setLoadingState('artifactGeneration', true);
        setError('artifactError', null);

        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('timeout')), 30000);
            });

            // 현재 chatId를 가져와서 API 호출에 포함
            const chatId = getCurrentChatId();

            const apiCall = callArtifactAPI(userInput, extendedSheetContext, getDataForGPTAnalysis, {
                chatId: chatId || undefined,
                currentSheetIndex: activeSheetIndex // 현재 시트 인덱스 전달
            });
            const result = await Promise.race([apiCall, timeoutPromise]);

            if (result.success && result.code) {
                // 백엔드에서 반환된 chatId가 있으면 스토어에 업데이트
                if (result.chatId) {
                    setCurrentChatId(result.chatId);
                }

                const artifactData = {
                    code: result.code,
                    type: result.type || 'analysis',
                    timestamp: result.timestamp || new Date(),
                    title: result.title || `${result.type} 분석`,
                    messageId: (Date.now() + 1).toString()
                };

                addToArtifactHistory(artifactData);

                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: '',
                    timestamp: new Date(),
                    mode: 'artifact',
                    artifactData: {
                        type: result.type || 'analysis',
                        title: result.title || `${result.type} 분석`,
                        timestamp: result.timestamp || new Date()
                    }
                };

                // 현재 활성 시트에 응답 메시지 추가
                addMessageToSheet(activeSheetIndex, assistantMessage);
            } else {
                throw new Error(result.error || '아티팩트 생성에 실패했습니다.');
            }
        } catch (error) {
            let errorMessage = '아티팩트 생성 중 오류가 발생했습니다.';

            if (error instanceof Error && error.message === 'timeout') {
                errorMessage = '요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
            } else if (error instanceof Error) {
                errorMessage = `${error.message}`;
            }

            setError('artifactError', errorMessage);

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: errorMessage,
                timestamp: new Date(),
                mode: 'artifact'
            };

            // 현재 활성 시트에 오류 메시지 추가
            addMessageToSheet(activeSheetIndex, assistantMessage);
        } finally {
            setLoadingState('artifactGeneration', false);
        }
    };

    const handleDataGenerationChat = async (userInput: string) => {
        setLoadingState('dataGeneration', true);
        setError('dataGenerationError', null);

        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('timeout')), 30000);
            });

            // 현재 chatId를 가져와서 API 호출에 포함
            const chatId = getCurrentChatId();

            const apiCall = callDataGenerationAPI(userInput, extendedSheetContext, getDataForGPTAnalysis, {
                chatId: chatId || undefined,
                currentSheetIndex: activeSheetIndex, // 현재 시트 인덱스 전달
            });
            const result = await Promise.race([apiCall, timeoutPromise]);

            if (result.success && result.editedData) {
                // 백엔드에서 반환된 chatId가 있으면 스토어에 업데이트
                if (result.chatId) {
                    setCurrentChatId(result.chatId);
                }

                // 생성된 데이터 적용
                applyGeneratedData({
                    sheetName: result.editedData.sheetName,
                    headers: result.editedData.headers,
                    data: result.editedData.data,
                    sheetIndex: result.sheetIndex
                });

                // 성공 메시지 표시
                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: `데이터가 성공적으로 ${xlsxData ? '업데이트' : '생성'}되었습니다.\n\n` +
                        `시트 이름: ${result.editedData.sheetName}\n` +
                        `데이터 크기: ${result.editedData.headers.length}열 × ${result.editedData.data.length}행\n\n` +
                        `${result.explanation || ''}`,
                    timestamp: new Date(),
                    mode: 'normal'
                };

                // 현재 활성 시트에 응답 메시지 추가
                addMessageToSheet(activeSheetIndex, assistantMessage);
            } else {
                throw new Error(result.error || '데이터 생성에 실패했습니다.');
            }
        } catch (error) {
            let errorMessage = '데이터 생성 중 오류가 발생했습니다.';

            if (error instanceof Error && error.message === 'timeout') {
                errorMessage = '요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
            } else if (error instanceof Error) {
                errorMessage = `${error.message}`;
            }

            setError('dataGenerationError', errorMessage);

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: errorMessage,
                timestamp: new Date(),
                mode: 'normal'
            };

            // 현재 활성 시트에 오류 메시지 추가
            addMessageToSheet(activeSheetIndex, assistantMessage);
        } finally {
            setLoadingState('dataGeneration', false);
        }
    };

    const handleDataFixChat = async (userInput: string) => {
        setLoadingState('dataFix', true);
        setError('dataFixError', null);

        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('timeout')), 30000);
            });

            // 현재 chatId를 가져와서 API 호출에 포함
            const chatId = getCurrentChatId();

            const apiCall = callDataFixAPI(userInput, extendedSheetContext, getDataForGPTAnalysis, {
                chatId: chatId || undefined,
                currentSheetIndex: activeSheetIndex, // 현재 시트 인덱스 전달
            });
            const result = await Promise.race([apiCall, timeoutPromise]);

            if (result.success && result.editedData) {
                // 백엔드에서 반환된 chatId가 있으면 스토어에 업데이트
                if (result.chatId) {
                    setCurrentChatId(result.chatId);
                }

                // 생성된 데이터 적용
                applyGeneratedData({
                    sheetName: result.editedData.sheetName,
                    headers: result.editedData.headers,
                    data: result.editedData.data,
                    sheetIndex: result.sheetIndex
                });

                // 변경 내역 설명 생성
                let changeDescription = '';
                if (result.changes) {
                    const typeMap = {
                        'sort': '정렬',
                        'filter': '필터링',
                        'modify': '값 수정',
                        'transform': '데이터 변환'
                    };

                    changeDescription = `변경 유형: ${typeMap[result.changes.type] || result.changes.type}\n`;
                    changeDescription += `세부 내용: ${result.changes.details}\n\n`;
                }

                // 성공 메시지 표시
                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: `데이터가 성공적으로 수정되었습니다.\n\n` +
                        `시트 이름: ${result.editedData.sheetName}\n` +
                        `데이터 크기: ${result.editedData.headers.length}열 × ${result.editedData.data.length}행\n\n` +
                        `${changeDescription}` +
                        `${result.explanation || ''}`,
                    timestamp: new Date(),
                    mode: 'datafix'
                };

                // 현재 활성 시트에 응답 메시지 추가
                addMessageToSheet(activeSheetIndex, assistantMessage);
            } else {
                throw new Error(result.error || '데이터 수정에 실패했습니다.');
            }
        } catch (error) {
            let errorMessage = '데이터 수정 중 오류가 발생했습니다.';

            if (error instanceof Error && error.message === 'timeout') {
                errorMessage = '요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
            } else if (error instanceof Error) {
                errorMessage = `${error.message}`;
            }

            setError('dataFixError', errorMessage);

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: errorMessage,
                timestamp: new Date(),
                mode: 'datafix'
            };

            // 현재 활성 시트에 오류 메시지 추가
            addMessageToSheet(activeSheetIndex, assistantMessage);
        } finally {
            setLoadingState('dataFix', false);
        }
    };

    const handleNormalChat = async (userInput: string) => {
        setError('fileError', null);

        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('timeout')), 30000);
            });

            // 현재 chatId를 가져와서 API 호출에 포함
            const chatId = getCurrentChatId();
            
            const response = await callNormalChatAPI(
                userInput,
                extendedSheetContext,
                getDataForGPTAnalysis,
                {
                    chatId: currentChatId || undefined,
                    chatTitle: userInput.length > 30 ? userInput.substring(0, 30) + '...' : userInput,
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
            let errorMessage = '응답 생성 중 오류가 발생했습니다.';

            if (error instanceof Error && error.message === 'timeout') {
                errorMessage = '요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
            } else if (error instanceof Error) {
                errorMessage = `${error.message}`;
            }

            setError('fileError', errorMessage);

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: errorMessage,
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
        <div className="flex flex-col h-full w-full bg-white">
            {/* 디버그 정보 - chatId 표시 */}
            {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs">
                    <div className="max-w-3xl mx-auto">
                        <span className="font-medium text-yellow-800">디버그:</span>{' '}
                        <span className="text-yellow-700">
                            현재 ChatID: {currentChatId || '없음'}
                        </span>
                    </div>
                </div>
            )}
            
            <div className="flex flex-col h-full w-full">
                {/* 파일 정보를 채팅 맨 위에 표시 */}
                {xlsxData && (
                    <div className="w-full border-b border-gray-200 bg-gray-50 shadow-sm">
                        <div className="w-full max-w-3xl mx-auto">
                            <FileUploadHandler
                                isDragOver={isDragOver}
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

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
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

                <div className="w-full max-w-3xl mx-auto">
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