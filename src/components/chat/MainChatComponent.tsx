'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { useExtendedUnifiedDataStore } from '../../stores/useUnifiedDataStore';
import { processXLSXFile } from '../../utils/fileProcessing';
import { detectAndDecode, isValidSpreadsheetFile } from '../../utils/chatUtils';
import { callArtifactAPI, callFormulaAPI } from '../../services/api/dataServices';
import { Message } from './MessageDisplay';

// 컴포넌트 가져오기
import MessageDisplay from './MessageDisplay';
import FileUploadHandler from './FileUploadHandler';
import ChatInput from './ChatInput';

export default function MainChatComponent() {
    // 상태들 선언
    const [currentMode, setCurrentMode] = useState<'normal' | 'formula' | 'datageneration' | 'artifact'>('normal');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // 모드 변경 함수들
    const toggleFormulaMode = () => {
        setCurrentMode(currentMode === 'formula' ? 'normal' : 'formula');
    };

    const toggleArtifactMode = () => {
        setCurrentMode(currentMode === 'artifact' ? 'normal' : 'artifact');
    };

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
        getDataForGPTAnalysis
    } = useExtendedUnifiedDataStore();

    // 파일이 로드되었는지 확인
    const file = xlsxData ? { name: xlsxData.fileName } : null;

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

                const xlsxData = {
                    fileName: result.fileName,
                    sheets: result.sheets.map(sheet => ({
                        sheetName: sheet.sheetName,
                        rawData: sheet.rawData, // 원본 데이터 보존
                        headers: sheet.headers, // 유효한 헤더만
                        data: sheet.data, // 헤더에 맞춰 정리된 데이터
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
                            headerRowData: sheet.metadata.headerRowData, // 원본 헤더 행
                            headerMap: sheet.metadata.headerMap, // 매핑 정보
                            preserveOriginalStructure: sheet.metadata.preserveOriginalStructure,
                            lastModified: new Date()
                        }
                    })),
                    activeSheetIndex: 0
                };

                setXLSXData(xlsxData);

                const successMessage: Message = {
                    id: Date.now().toString(),
                    type: 'assistant',
                    content: `✅ ${file.name} 파일이 성공적으로 로드되었습니다.\n\n` +
                        `📊 **시트 정보:**\n` +
                        xlsxData.sheets.map((sheet, index) =>
                            `• ${sheet.sheetName}: ${sheet.headers.length}열 × ${sheet.data.length}행`
                        ).join('\n') + '\n\n' +
                        `🎯 **활성 시트:** ${xlsxData.sheets[0].sheetName}\n` +
                        `📍 **헤더 위치:** 원본 구조 유지됨`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, successMessage]);

            } else if (fileExtension === 'csv') {
                // CSV 파일 처리
                const fileContent = await detectAndDecode(file);

                Papa.parse(fileContent, {
                    header: false,
                    skipEmptyLines: false, // 빈 행도 유지
                    complete: (results: Papa.ParseResult<unknown>) => {
                        if (results.data && results.data.length > 0) {
                            const rawData = results.data as string[][];

                            if (rawData.length <= 1) {
                                const errorMessage: Message = {
                                    id: Date.now().toString(),
                                    type: 'assistant',
                                    content: `⚠️ 파일에 충분한 데이터가 없습니다. 헤더 행과 최소 1개 이상의 데이터 행이 필요합니다.`,
                                    timestamp: new Date()
                                };
                                setMessages(prev => [...prev, errorMessage]);
                                setLoadingState('fileUpload', false);
                                return;
                            }

                            // CSV에도 동적 헤더 감지 적용
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

                            // CSV 데이터도 헤더에 맞춰 정리
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

                            // CSV 데이터를 XLSX 형식으로 변환하여 통합 관리
                            const xlsxData = {
                                fileName: file.name,
                                sheets: [{
                                    sheetName: 'Sheet1',
                                    rawData, // 원본 데이터 보존
                                    headers: validHeaders, // 유효한 헤더만
                                    data, // 헤더에 맞춰 정리된 데이터
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
                                        headerRowData, // 원본 헤더 행
                                        headerMap, // 매핑 정보
                                        preserveOriginalStructure: true,
                                        lastModified: new Date()
                                    }
                                }],
                                activeSheetIndex: 0
                            };

                            setXLSXData(xlsxData);

                            const successMessage: Message = {
                                id: Date.now().toString(),
                                type: 'assistant',
                                content: `✅ ${file.name} 파일이 성공적으로 로드되었습니다.\n` +
                                    `📊 ${validHeaders.length}열 × ${data.length}행의 데이터가 스프레드시트에 표시됩니다.\n` +
                                    `📍 **구조:** 원본 위치 유지, 유효한 헤더 ${validHeaders.length}개 추출`,
                                timestamp: new Date()
                            };
                            setMessages(prev => [...prev, successMessage]);
                        }
                    },
                    error: (error: Error) => {
                        console.error('CSV 파싱 오류:', error);
                        setError('fileError', error.message);
                        const errorMessage: Message = {
                            id: Date.now().toString(),
                            type: 'assistant',
                            content: `❌ 파일 처리 중 오류가 발생했습니다: ${error.message}`,
                            timestamp: new Date()
                        };
                        setMessages(prev => [...prev, errorMessage]);
                    }
                });
            } else {
                throw new Error('지원하지 않는 파일 형식입니다. CSV 또는 XLSX 파일을 업로드해주세요.');
            }
        } catch (error) {
            console.error('파일 읽기 오류:', error);
            setError('fileError', error instanceof Error ? error.message : '알 수 없는 오류');
            const errorMessage: Message = {
                id: Date.now().toString(),
                type: 'assistant',
                content: `❌ 파일 읽기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
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
        setMessages([]);
        setXLSXData(null);
    };

    const handleArtifactClick = (messageId: string) => {
        openArtifactModal(messageId);
    };

    // 메시지 전송 함수
    const sendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date(),
            mode: currentMode
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputValue;
        setInputValue('');

        if (currentMode === 'formula') {
            // 포뮬러 모드 로직
            setIsLoading(true);
            setLoadingState('formulaGeneration', true);
            setError('formulaError', null);

            try {
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('timeout')), 15000);
                });

                const apiCall = callFormulaAPI(currentInput, extendedSheetContext);
                const result = await Promise.race([apiCall, timeoutPromise]);

                if (result.success && result.formula) {
                    const assistantMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        type: 'assistant',
                        content: `✅ 함수가 생성되었습니다!

**생성된 함수:** \`${result.formula}\`
**적용 위치:** ${result.cellAddress || 'E1'}

**설명:** ${result.explanation?.korean || '함수가 생성되었습니다.'}

${result.cellAddress ? `셀 ${result.cellAddress}에 함수가 적용됩니다.` : ''}`,
                        timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, assistantMessage]);

                    const formulaApplication = {
                        formula: result.formula,
                        cellAddress: result.cellAddress || 'E1',
                        explanation: result.explanation?.korean || '함수가 생성되었습니다.',
                        timestamp: new Date()
                    };

                    setPendingFormula({
                        ...formulaApplication,
                        sheetIndex: 0 // 현재 활성화된 시트 인덱스 추가
                    });
                    addToFormulaHistory({
                        ...formulaApplication,
                        sheetIndex: 0 // 현재 활성화된 시트 인덱스 추가
                    });
                } else {
                    throw new Error(result.error || '함수 생성에 실패했습니다.');
                }
            } catch (error) {
                let errorMessage = '함수 생성 중 오류가 발생했습니다.';

                if (error instanceof Error && error.message === 'timeout') {
                    errorMessage = '⏰ 요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
                } else if (error instanceof Error) {
                    errorMessage = `❌ ${error.message}`;
                }

                setError('formulaError', errorMessage);

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'assistant',
                    content: errorMessage,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
            } finally {
                setIsLoading(false);
                setLoadingState('formulaGeneration', false);
            }
        } else if (currentMode === 'artifact') {
            // 아티팩트 모드 로직
            setIsLoading(true);
            setLoadingState('artifactGeneration', true);
            setError('artifactError', null);

            try {
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('timeout')), 30000);
                });

                const apiCall = callArtifactAPI(currentInput, extendedSheetContext, getDataForGPTAnalysis);
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

                    const assistantMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        type: 'assistant',
                        content: '',
                        timestamp: new Date(),
                        mode: 'artifact',
                        artifactData: {
                            type: result.type || 'analysis',
                            title: result.title || `${result.type} 분석`,
                            timestamp: result.timestamp || new Date()
                        }
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                } else {
                    throw new Error(result.error || '아티팩트 생성에 실패했습니다.');
                }
            } catch (error) {
                let errorMessage = '아티팩트 생성 중 오류가 발생했습니다.';

                if (error instanceof Error && error.message === 'timeout') {
                    errorMessage = '⏰ 요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
                } else if (error instanceof Error) {
                    errorMessage = `❌ ${error.message}`;
                }

                setError('artifactError', errorMessage);

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'assistant',
                    content: errorMessage,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
            } finally {
                setIsLoading(false);
                setLoadingState('artifactGeneration', false);
            }
        } else {
            // 일반 모드
            setTimeout(() => {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'assistant',
                    content: `${file?.name} 파일에 대한 질문을 받았습니다: "${currentInput}"\n\n이는 시뮬레이션된 응답입니다. 실제 구현에서는 파일을 파싱하고 적절한 분석을 제공할 수 있습니다.`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            }, 1000);
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
    }, [messages, isLoading]);

    return (
        <div className="flex flex-col h-full w-full bg-white">
            <div className="flex flex-col h-full w-full">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-2">
                    <MessageDisplay
                        messages={messages}
                        onArtifactClick={handleArtifactClick}
                    />
                </div>

                {/* 파일이 있을 때만 FileUploadHandler 표시 */}
                {xlsxData && (
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
                )}

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
                    toggleFormulaMode={toggleFormulaMode}
                    toggleArtifactMode={toggleArtifactMode}
                    handleFileInputChange={handleFileInputChange}
                />
            </div>
        </div>
    );
} 