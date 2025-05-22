'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { useExtendedUnifiedDataStore, ChatMessage } from '../../stores/useUnifiedDataStore';
import { processXLSXFile } from '../../utils/fileProcessing';
import { detectAndDecode, isValidSpreadsheetFile } from '../../utils/chatUtils';
import { callArtifactAPI, callFormulaAPI, callDataGenerationAPI, callNormalChatAPI, callDataFixAPI } from '../../services/api/dataServices';
import { Message } from './MessageDisplay';
import { determineChatMode, ChatMode } from '../../app/actions/chatActions'; // 서버 액션 import

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

    // Zustand 스토어 사용
    const {
        xlsxData,
        extendedSheetContext,
        loadingStates,
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
        clearAllMessages
    } = useExtendedUnifiedDataStore();

    // 파일이 로드되었는지 확인
    const file = xlsxData ? { name: xlsxData.fileName } : null;
    
    // 현재 활성 시트 인덱스 가져오기
    const activeSheetIndex = xlsxData?.activeSheetIndex || 0;

    // 로딩 상태 관리를 위한 효과
    useEffect(() => {
        if (isLoading) {
            // 로딩이 시작될 때 초기화
            setLoadingProgress(0);
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
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && isValidSpreadsheetFile(droppedFile)) {
            processFile(droppedFile);
        }
    }, []);

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
                        rawData: s.rawData?.length || 0
                    }))
                });

                // 기존 xlsxData가 있는 경우 새 시트로 추가
                if (xlsxData) {
                    const newXlsxData = { ...xlsxData };
                    
                    // 각 시트의 데이터 확인 및 빈 시트 필터링
                    const newSheets = result.sheets
                        .filter(sheet => sheet.headers.length > 0) // 유효한 헤더가 있는 시트만 처리
                        .map(sheet => {
                            console.log(`시트 처리: ${sheet.sheetName}, 헤더: ${sheet.headers.length}, 데이터 행: ${sheet.data.length}`);
                            
                            return {
                                sheetName: sheet.sheetName,
                                rawData: sheet.rawData,
                                headers: sheet.headers,
                                data: sheet.data,
                                metadata: {
                                    rowCount: sheet.data.length,
                                    columnCount: sheet.headers.length,
                                    headerRow: sheet.metadata.headerRow,
                                    dataRange: {
                                        startRow: sheet.metadata.headerRow + 1,
                                        endRow: sheet.metadata.headerRow + sheet.data.length,
                                        startCol: 0,
                                        endCol: sheet.headers.length - 1,
                                        startColLetter: 'A',
                                        endColLetter: String.fromCharCode(65 + sheet.headers.length - 1)
                                    },
                                    headerRowData: sheet.metadata.headerRowData,
                                    headerMap: sheet.metadata.headerMap,
                                    preserveOriginalStructure: sheet.metadata.preserveOriginalStructure,
                                    lastModified: new Date()
                                }
                            };
                        });

                    if (newSheets.length === 0) {
                        const errorMessage: ChatMessage = {
                            id: Date.now().toString(),
                            type: 'Extion ai',
                            content: `${file.name} 파일에서 유효한 데이터를 가진 시트를 찾을 수 없습니다.`,
                            timestamp: new Date()
                        };
                        addMessageToSheet(activeSheetIndex, errorMessage);
                        setLoadingState('fileUpload', false);
                        return;
                    }

                    // 새 시트들을 기존 시트 목록에 추가
                    newXlsxData.sheets = [...newXlsxData.sheets, ...newSheets];
                    setXLSXData(newXlsxData);

                    const successMessage: ChatMessage = {
                        id: Date.now().toString(),
                        type: 'Extion ai',
                        content: `${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
                            `추가된 시트 정보:\n` +
                            newSheets.map((sheet, index) =>
                                `• ${sheet.sheetName}: ${sheet.headers.length}열 × ${sheet.data.length}행`
                            ).join('\n'),
                        timestamp: new Date()
                    };
                    
                    // 현재 활성 시트에 메시지 추가
                    addMessageToSheet(activeSheetIndex, successMessage);
                } else {
                    // 유효한 시트만 필터링
                    const validSheets = result.sheets.filter(sheet => sheet.headers.length > 0);
                    
                    if (validSheets.length === 0) {
                        const errorMessage: ChatMessage = {
                            id: Date.now().toString(),
                            type: 'Extion ai',
                            content: `${file.name} 파일에서 유효한 데이터를 가진 시트를 찾을 수 없습니다.`,
                            timestamp: new Date()
                        };
                        addMessageToSheet(0, errorMessage);
                        setLoadingState('fileUpload', false);
                        return;
                    }
                    
                    // xlsxData가 없는 경우 새로 생성
                    const xlsxData = {
                        fileName: result.fileName,
                        sheets: validSheets.map(sheet => ({
                            sheetName: sheet.sheetName,
                            rawData: sheet.rawData,
                            headers: sheet.headers,
                            data: sheet.data,
                            metadata: {
                                rowCount: sheet.data.length,
                                columnCount: sheet.headers.length,
                                headerRow: sheet.metadata.headerRow,
                                dataRange: {
                                    startRow: sheet.metadata.headerRow + 1,
                                    endRow: sheet.metadata.headerRow + sheet.data.length,
                                    startCol: 0,
                                    endCol: sheet.headers.length - 1,
                                    startColLetter: 'A',
                                    endColLetter: String.fromCharCode(65 + sheet.headers.length - 1)
                                },
                                headerRowData: sheet.metadata.headerRowData,
                                headerMap: sheet.metadata.headerMap,
                                preserveOriginalStructure: sheet.metadata.preserveOriginalStructure,
                                lastModified: new Date()
                            }
                        })),
                        activeSheetIndex: 0
                    };

                    setXLSXData(xlsxData);

                    const successMessage: ChatMessage = {
                        id: Date.now().toString(),
                        type: 'Extion ai',
                        content: `${file.name} 파일이 성공적으로 업로드되었습니다.\n\n` +
                            `시트 정보:\n` +
                            xlsxData.sheets.map((sheet, index) =>
                                `${sheet.sheetName}: ${sheet.headers.length}열 × ${sheet.data.length}행`
                            ).join('\n') + '\n\n' +
                            `활성 시트: ${xlsxData.sheets[0].sheetName}\n` +
                            `헤더 위치: 원본 구조 유지됨`,
                        timestamp: new Date()
                    };
                    
                    // 첫 번째 시트(인덱스 0)에 메시지 추가
                    addMessageToSheet(0, successMessage);
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

                            if (rawData.length <= 1) {
                                const errorMessage: ChatMessage = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `⚠️ 파일에 충분한 데이터가 없습니다. 헤더 행과 최소 1개 이상의 데이터 행이 필요합니다.`,
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

                            const headerRow = findHeaderRow(rawData);
                            const {
                                headerRowData,
                                validHeaders,
                                headerMap,
                                maxRow,
                                maxCol
                            } = findDataRange(rawData, headerRow);

                            const data: string[][] = [];
                            for (let row = headerRow + 1; row <= maxRow; row++) {
                                const dataRow: string[] = [];
                                const originalRow = rawData[row] || [];

                                Object.keys(headerMap).forEach(originalIndexStr => {
                                    const originalIndex = parseInt(originalIndexStr);
                                    const cellValue = originalRow[originalIndex] || '';
                                    dataRow.push(cellValue);
                                });

                                data.push(dataRow);
                            }

                            // 기존 xlsxData가 있는 경우 새 시트로 추가
                            if (xlsxData) {
                                const newXlsxData = { ...xlsxData };
                                const newSheet = {
                                    sheetName: file.name.replace('.csv', ''),
                                    headers: validHeaders,
                                    data: data,
                                    rawData: rawData,
                                    metadata: {
                                        rowCount: data.length,
                                        columnCount: validHeaders.length,
                                        headerRow,
                                        dataRange: {
                                            startRow: headerRow + 1,
                                            endRow: maxRow,
                                            startCol: 0,
                                            endCol: maxCol,
                                            startColLetter: columnIndexToLetter(0),
                                            endColLetter: columnIndexToLetter(maxCol)
                                        },
                                        headerRowData,
                                        headerMap,
                                        preserveOriginalStructure: true,
                                        lastModified: new Date()
                                    }
                                };

                                newXlsxData.sheets = [...newXlsxData.sheets, newSheet];
                                setXLSXData(newXlsxData);

                                const successMessage: ChatMessage = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
                                        `추가된 시트 정보:\n` +
                                        `• ${newSheet.sheetName}: ${validHeaders.length}열 × ${data.length}행`,
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
                                        headers: validHeaders,
                                        data: data,
                                        rawData: rawData,
                                        metadata: {
                                            rowCount: data.length,
                                            columnCount: validHeaders.length,
                                            headerRow,
                                            dataRange: {
                                                startRow: headerRow + 1,
                                                endRow: maxRow,
                                                startCol: 0,
                                                endCol: maxCol,
                                                startColLetter: columnIndexToLetter(0),
                                                endColLetter: columnIndexToLetter(maxCol)
                                            },
                                            headerRowData,
                                            headerMap,
                                            preserveOriginalStructure: true,
                                            lastModified: new Date()
                                        }
                                    }],
                                    activeSheetIndex: 0
                                };

                                setXLSXData(xlsxData);

                                const successMessage: ChatMessage = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `${file.name} 파일이 성공적으로 로드되었습니다.\n` +
                                        `${validHeaders.length}열 × ${data.length}행의 데이터가 스프레드시트에 표시됩니다.\n` +
                                        `구조: 원본 위치 유지, 유효한 헤더 ${validHeaders.length}개 추출`,
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

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // 메시지 전송 함수 - 서버 액션을 사용하여 채팅 모드 결정
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
            // 서버 액션을 호출하여 채팅 모드 결정
            const { mode } = await determineChatMode(inputValue);
            const currentInput = inputValue;
            setInputValue('');
            
            // 채팅 모드 설정
            setCurrentMode(mode);
            
            // 해당 모드에 맞는 API 호출
            if (mode === 'formula') {
                await handleFormulaChat(currentInput);
            } else if (mode === 'artifact') {
                await handleArtifactChat(currentInput);
            } else if (mode === 'datageneration') {
                await handleDataGenerationChat(currentInput);
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

            const apiCall = callFormulaAPI(userInput, extendedSheetContext);
            const result = await Promise.race([apiCall, timeoutPromise]);

            if (result.success && result.formula) {
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

            const apiCall = callArtifactAPI(userInput, extendedSheetContext, getDataForGPTAnalysis);
            const result = await Promise.race([apiCall, timeoutPromise]);

            if (result.success && result.code) {
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

            const apiCall = callDataGenerationAPI(userInput, extendedSheetContext, getDataForGPTAnalysis);
            const result = await Promise.race([apiCall, timeoutPromise]);

            if (result.success && result.editedData) {
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
                    mode: 'datageneration'
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
                mode: 'datageneration'
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

            const apiCall = callDataFixAPI(userInput, extendedSheetContext, getDataForGPTAnalysis);
            const result = await Promise.race([apiCall, timeoutPromise]);

            if (result.success && result.editedData) {
                // 수정된 데이터 적용
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

            const apiCall = callNormalChatAPI(userInput, extendedSheetContext, getDataForGPTAnalysis);
            const result = await Promise.race([apiCall, timeoutPromise]);

            if (result.success) {
                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: result.message,
                    timestamp: new Date()
                };
                
                // 현재 활성 시트에 응답 메시지 추가
                addMessageToSheet(activeSheetIndex, assistantMessage);
            } else {
                throw new Error(result.error || '응답 생성에 실패했습니다.');
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