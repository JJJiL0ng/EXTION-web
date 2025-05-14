// components/CSVChatComponent.tsx
'use client'

import React, { useState, useCallback, useRef } from 'react';
import { Send, FileText, X, Paperclip } from 'lucide-react';
import Papa from 'papaparse';
import { useCSV } from '../contexts/CSVContext';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// UTF-8 검사 함수
const isValidUTF8 = (text: string): boolean => {
  try {
    // UTF-8로 인코딩된 텍스트인지 확인
    new TextEncoder().encode(text);
    return true;
  } catch {
    return false;
  }
};

// 다양한 인코딩으로 디코딩 시도
const detectAndDecode = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // 먼저 UTF-8로 시도
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer);
    if (isValidUTF8(decoded)) {
      return decoded;
    }
  } catch {
    console.log('UTF-8 디코딩 실패, 다른 인코딩 시도 중...');
  }
  
  // 다른 인코딩들 시도
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
  
  // 모든 인코딩이 실패한 경우 기본 디코딩 사용
  return new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
};

export default function CSVChatComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isComposing, setIsComposing] = useState(false); // IME 조합 상태 추적
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCsvData, setIsLoading } = useCSV();

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
    setIsLoading(true);
    
    try {
      // 파일 확장자 확인
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // XLSX/XLS 파일은 현재 Papa Parse만으로는 처리할 수 없음을 알리는 메시지
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `⚠️ 현재 XLSX/XLS 파일은 완전히 지원되지 않습니다. CSV 파일로 변환 후 시도해주세요.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }
      
      // UTF-8 검사 및 디코딩
      const fileContent = await detectAndDecode(file);
      
      // Papa Parse를 사용하여 CSV 파싱
      Papa.parse(fileContent, {
        header: false,
        skipEmptyLines: true, // 빈 행을 건너뛰기
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const data = results.data as string[][];
            
            // 데이터 검증
            if (data.length <= 1) {
              const errorMessage: Message = {
                id: Date.now().toString(),
                type: 'assistant',
                content: `⚠️ 파일에 충분한 데이터가 없습니다. 헤더 행과 최소 1개 이상의 데이터 행이 필요합니다.`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
              setIsLoading(false);
              return;
            }
            
            const headers = data[0] || [];
            const rows = data.slice(1).filter(row => row.length > 0 && row.some(cell => cell !== '')); // 완전히 빈 행 제거
            
            console.log('CSV 헤더:', headers);
            console.log('CSV 데이터 행 수:', rows.length);
            console.log('첫 번째 데이터 행:', rows[0]);
            
            setCsvData({
              headers,
              data: rows,
              fileName: file.name
            });
            
            // 성공 메시지 추가
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
      setIsLoading(false);
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
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // 시뮬레이션된 Assistant 응답
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `${file?.name} 파일에 대한 질문을 받았습니다: "${inputValue}"\n\n이는 시뮬레이션된 응답입니다. 실제 구현에서는 파일을 파싱하고 적절한 분석을 제공할 수 있습니다.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // IME 조합 중에는 Enter 키 처리 건너뛰기
    if (isComposing) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        sendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 메인 컨테이너 - 최대 너비 제한 */}
      <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
        
        {/* 첨부된 파일이 있을 때 헤더 표시 */}
        {file && (
          <div className="bg-white border-b border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-green-600" />
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
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 채팅 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  CSV/XLSX 분석 채팅
                </h2>
                <p className="text-gray-600 max-w-md">
                  파일을 업로드하여 데이터 분석을 시작하세요. 업로드 후 질문을 입력하여 대화할 수 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((message) => (
                <div key={message.id} className="space-y-4">
                  <div
                    className={`${
                      message.type === 'user'
                        ? 'bg-blue-50 text-blue-900'
                        : 'bg-gray-50 text-gray-900'
                    } rounded-xl p-6`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {message.type === 'user' ? (
                          <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                        ) : (
                          <div className="w-4 h-4 bg-gray-600 rounded-sm"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">
                          {message.type === 'user' ? 'You' : 'Assistant'}
                        </p>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-gray-100 bg-white p-6">
          <div 
            className={`relative border-2 border-dashed rounded-xl transition-all ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center space-x-3 p-4">
              <button
                onClick={handleFileButtonClick}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white transition-colors group"
              >
                <Paperclip className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
              </button>
              
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="파일을 첨부하거나 질문을 입력하세요..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
              />
              
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim()}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#005DE9] hover:bg-[#0052d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5 text-white" />
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
            <p className="text-xs text-gray-500 mt-2 text-center">
              CSV 또는 XLSX 파일을 드래그하여 업로드하거나 클립 아이콘을 클릭하세요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}