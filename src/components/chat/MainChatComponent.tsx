'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { useExtendedUnifiedDataStore } from '../../stores/useUnifiedDataStore';
import { processXLSXFile } from '../../utils/fileProcessing';
import { detectAndDecode, isValidSpreadsheetFile } from '../../utils/chatUtils';
import { callArtifactAPI, callFormulaAPI, callDataGenerationAPI, callNormalChatAPI } from '../../services/api/dataServices';
import { Message } from './MessageDisplay';
import { determineChatMode, ChatMode } from '../../app/actions/chatActions'; // 서버 액션 import

// 컴포넌트 가져오기
import MessageDisplay from './MessageDisplay';
import FileUploadHandler from './FileUploadHandler';
import ChatInput from './ChatInput';

export default function MainChatComponent() {
    // 상태들 선언
    const [currentMode, setCurrentMode] = useState<ChatMode>('normal');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

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
        applyGeneratedData
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

                // 기존 xlsxData가 있는 경우 새 시트로 추가
                if (xlsxData) {
                    const newXlsxData = { ...xlsxData };
                    const newSheets = result.sheets.map(sheet => ({
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
                    }));

                    // 새 시트들을 기존 시트 목록에 추가
                    newXlsxData.sheets = [...newXlsxData.sheets, ...newSheets];
                    setXLSXData(newXlsxData);

                    const successMessage: Message = {
                        id: Date.now().toString(),
                        type: 'Extion ai',
                        content: `✅ ${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
                            `📊 **추가된 시트 정보:**\n` +
                            newSheets.map((sheet, index) =>
                                `• ${sheet.sheetName}: ${sheet.headers.length}열 × ${sheet.data.length}행`
                            ).join('\n'),
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, successMessage]);
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

                    const successMessage: Message = {
                        id: Date.now().toString(),
                        type: 'Extion ai',
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
                                const errorMessage: Message = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `⚠️ 파일에 충분한 데이터가 없습니다. 헤더 행과 최소 1개 이상의 데이터 행이 필요합니다.`,
                                    timestamp: new Date()
                                };
                                setMessages(prev => [...prev, errorMessage]);
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

                                const successMessage: Message = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `✅ ${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
                                        `📊 **추가된 시트 정보:**\n` +
                                        `• ${newSheet.sheetName}: ${validHeaders.length}열 × ${data.length}행`,
                                    timestamp: new Date()
                                };
                                setMessages(prev => [...prev, successMessage]);
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

                                const successMessage: Message = {
                                    id: Date.now().toString(),
                                    type: 'Extion ai',
                                    content: `✅ ${file.name} 파일이 성공적으로 로드되었습니다.\n` +
                                        `📊 ${validHeaders.length}열 × ${data.length}행의 데이터가 스프레드시트에 표시됩니다.\n` +
                                        `📍 **구조:** 원본 위치 유지, 유효한 헤더 ${validHeaders.length}개 추출`,
                                    timestamp: new Date()
                                };
                                setMessages(prev => [...prev, successMessage]);
                            }
                        }
                    },
                    error: (error: Error) => {
                        console.error('CSV 파싱 오류:', error);
                        setError('fileError', error.message);
                        const errorMessage: Message = {
                            id: Date.now().toString(),
                            type: 'Extion ai',
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
                type: 'Extion ai',
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

    // 메시지 전송 함수 - 서버 액션을 사용하여 채팅 모드 결정
    const sendMessage = async () => {
        if (!inputValue.trim()) return;

        setIsLoading(true);
        
        // 먼저 사용자 메시지 추가
        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        
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
            } else {
                await handleNormalChat(currentInput);
            }
        } catch (error) {
            console.error('메시지 처리 중 오류 발생:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: `❌ 메시지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
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
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
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
                type: 'Extion ai',
                content: errorMessage,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
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

                const assistantMessage: Message = {
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
                type: 'Extion ai',
                content: errorMessage,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
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
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: `✅ 데이터가 성공적으로 ${xlsxData ? '업데이트' : '생성'}되었습니다.\n\n` +
                        `**시트 이름:** ${result.editedData.sheetName}\n` +
                        `**데이터 크기:** ${result.editedData.headers.length}열 × ${result.editedData.data.length}행\n\n` +
                        `${result.explanation || ''}`,
                    timestamp: new Date(),
                    mode: 'datageneration'
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error(result.error || '데이터 생성에 실패했습니다.');
            }
        } catch (error) {
            let errorMessage = '데이터 생성 중 오류가 발생했습니다.';

            if (error instanceof Error && error.message === 'timeout') {
                errorMessage = '⏰ 요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
            } else if (error instanceof Error) {
                errorMessage = `❌ ${error.message}`;
            }

            setError('dataGenerationError', errorMessage);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: errorMessage,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        } finally {
            setLoadingState('dataGeneration', false);
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
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'Extion ai',
                    content: result.message,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error(result.error || '응답 생성에 실패했습니다.');
            }
        } catch (error) {
            let errorMessage = '응답 생성 중 오류가 발생했습니다.';

            if (error instanceof Error && error.message === 'timeout') {
                errorMessage = '⏰ 요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
            } else if (error instanceof Error) {
                errorMessage = `❌ ${error.message}`;
            }

            setError('fileError', errorMessage);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'Extion ai',
                content: errorMessage,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
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
                    handleFileInputChange={handleFileInputChange}
                />
            </div>
        </div>
    );
} 