// components/CSVChatComponent.tsx
'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, FileText, X, Paperclip, FunctionSquare } from 'lucide-react';
import Papa from 'papaparse';
import { useCSV } from '../contexts/CSVContext';
import { useSpreadsheetStore } from '../stores/useSpreadsheetStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: 'normal' | 'formula'; // 메시지가 포뮬러 모드에서 보낸 것인지 구분
}

interface FormulaResponse {
  success: boolean;
  formula?: string;
  explanation?: {
    korean: string;
  };
  cellAddress?: string;
  error?: string;
}

// UTF-8 검사 함수
const isValidUTF8 = (text: string): boolean => {
  try {
    new TextEncoder().encode(text);
    return true;
  } catch {
    return false;
  }
};

// 다양한 인코딩으로 디코딩 시도
const detectAndDecode = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer);
    if (isValidUTF8(decoded)) {
      return decoded;
    }
  } catch {
    console.log('UTF-8 디코딩 실패, 다른 인코딩 시도 중...');
  }
  
  const encodings = ['euc-kr', 'cp949', 'iso-8859-1', 'windows-1252'];
  
  for (const encoding of encodings) {
    try {
      const decoded = new TextDecoder(encoding).decode(arrayBuffer);
      if (decoded && decoded.length > 0) {
        return decoded;
      }
    } catch {
      console.log(`${encoding} 디코딩 실패`);
    }
  }
  
  return new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
};

export default function CSVChatComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isFormulaMode, setIsFormulaMode] = useState(false); // 포뮬러 모드 상태
  const [isLoading, setIsLoading] = useState(false); // API 호출 중 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCsvData, setIsLoading: setCSVLoading } = useCSV();
  const { sheetContext, updateSheetContext } = useSpreadsheetStore();
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
      processCSVFile(droppedFile);
    }
  }, []);

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
  };

  const processCSVFile = async (file: File) => {
    setCSVLoading(true);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `⚠️ 현재 XLSX/XLS 파일은 완전히 지원되지 않습니다. CSV 파일로 변환 후 시도해주세요.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setCSVLoading(false);
        return;
      }
      
      const fileContent = await detectAndDecode(file);
      
      Papa.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<unknown>) => {
          if (results.data && results.data.length > 0) {
            const data = results.data as string[][];
            
            if (data.length <= 1) {
              const errorMessage: Message = {
                id: Date.now().toString(),
                type: 'assistant',
                content: `⚠️ 파일에 충분한 데이터가 없습니다. 헤더 행과 최소 1개 이상의 데이터 행이 필요합니다.`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
              setCSVLoading(false);
              return;
            }
            
            const headers = data[0] || [];
            const rows = data.slice(1).filter(row => row.length > 0 && row.some(cell => cell !== ''));
            
            const csvData = {
              headers,
              data: rows,
              fileName: file.name
            };
            
            // CSVContext 업데이트
            setCsvData(csvData);
            
            // Zustand 스토어 업데이트
            updateSheetContext(csvData);
            
            const successMessage: Message = {
              id: Date.now().toString(),
              type: 'assistant',
              content: `✅ ${file.name} 파일이 성공적으로 로드되었습니다. ${results.data.length}행의 데이터가 스프레드시트에 표시됩니다.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, successMessage]);
          }
        },
        error: (error: Error) => {
          console.error('CSV 파싱 오류:', error);
          const errorMessage: Message = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `❌ 파일 처리 중 오류가 발생했습니다: ${error.message}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      });
    } catch (error) {
      console.error('파일 읽기 오류:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ 파일 읽기 중 오류가 발생했습니다. 파일 형식을 확인해주세요.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setCSVLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
      processCSVFile(selectedFile);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    setMessages([]);
    setCsvData(null);
    updateSheetContext(null);
  };

  // 포뮬러 모드 토글
  const toggleFormulaMode = () => {
    setIsFormulaMode(!isFormulaMode);
  };

  // 포뮬러 API 호출
  const callFormulaAPI = async (userInput: string): Promise<FormulaResponse> => {
    if (!sheetContext) {
      throw new Error('시트 데이터가 없습니다.');
    }

    const requestBody = {
      userInput,
      sheetContext,
      language: 'ko'
    };

    const response = await fetch(`${API_BASE_URL}/formula/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    return response.json();
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      mode: isFormulaMode ? 'formula' : 'normal'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');

    if (isFormulaMode) {
      // 포뮬러 모드일 때 API 호출
      setIsLoading(true);
      
      try {
        // 15초 타임아웃 설정
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 15000);
        });

        const apiCall = callFormulaAPI(currentInput);
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

          // HyperFormula를 사용하여 실제 스프레드시트에 함수 적용
          const { setPendingFormula } = useSpreadsheetStore.getState();
          setPendingFormula({
            formula: result.formula,
            cellAddress: result.cellAddress || 'E1',
            explanation: result.explanation?.korean || '함수가 생성되었습니다.',
            timestamp: new Date()
          });
          
          console.log('Formula applied to spreadsheet', {
            formula: result.formula,
            cellAddress: result.cellAddress || 'E1'
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

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // 일반 모드 (기존 로직 유지)
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
        
        {file && (
          <div className="bg-white border-b border-gray-100 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Extion - 파일과의 대화
                </h2>
                <p className="text-base text-gray-600 max-w-md">
                  파일을 업로드하여 데이터 분석을 시작하세요. <br />
                  업로드 후 질문을 입력하여 대화할 수 있습니다.<br />
                  포뮬러 모드로 한글로 셀을 조정할 수 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div
                    className={`${
                      message.type === 'user'
                        ? message.mode === 'formula'
                          ? 'bg-blue-100 text-blue-900' // 포뮬러 모드에서 보낸 메시지
                          : 'bg-blue-50 text-blue-900'   // 일반 모드에서 보낸 메시지
                        : 'bg-gray-50 text-gray-900'     // 어시스턴트 메시지
                    } rounded-xl p-3`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? message.mode === 'formula'
                            ? 'bg-blue-200 text-blue-700'  // 포뮬러 모드 아이콘
                            : 'bg-blue-100 text-blue-600'  // 일반 모드 아이콘
                          : 'bg-gray-100 text-gray-600'    // 어시스턴트 아이콘
                      }`}>
                        {message.type === 'user' ? (
                          message.mode === 'formula' ? (
                            <FunctionSquare className="w-6 h-6" />
                          ) : (
                            <div className="w-5 h-5 bg-blue-600 rounded-full"></div>
                          )
                        ) : (
                          <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">
                          {message.type === 'user' ? 'You' : 'Assistant'}
                          {message.type === 'user' && message.mode === 'formula' && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              Formula
                            </span>
                          )}
                        </p>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="space-y-2">
                  <div className="bg-gray-50 text-gray-900 rounded-xl p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-600">
                        <div className="w-3 h-3 bg-gray-600 rounded-sm animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Assistant</p>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          <span className="text-sm text-gray-500 ml-2">함수를 생성하고 있습니다...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-white p-2">
          <div 
            className={`relative border-2 border-dashed rounded-xl transition-all ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : isFormulaMode
                ? 'border-blue-200 bg-gray-300'  // 포뮬러 모드 배경색
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center space-x-2 p-2">
              <button
                onClick={handleFileButtonClick}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white transition-colors group"
              >
                <Paperclip className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
              </button>
              
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder={
                  isFormulaMode 
                    ? "스프레드시트 함수에 반영 할 명령을 입력하세요..." 
                    : "파일을 첨부하거나 질문을 입력하세요..."
                }
                className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder-gray-500"
                disabled={isLoading}
              />
              
              {/* fx 아이콘 추가 */}
              <button
                onClick={toggleFormulaMode}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  isFormulaMode
                    ? 'bg-[#005DE9] text-white'  // 활성화된 상태
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'  // 비활성화된 상태
                }`}
                title={isFormulaMode ? "일반 채팅 모드로 전환" : "포뮬러 모드로 전환"}
              >
                <FunctionSquare className="h-5 w-5" />
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#005DE9] hover:bg-[#0052d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
          
          {!file && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              {isFormulaMode 
                ? "포뮬러 모드: 자연어로 스프레드시트 함수를 생성하세요"
                : "CSV 또는 XLSX 파일을 드래그하여 업로드하거나 클립 아이콘을 클릭하세요"
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}