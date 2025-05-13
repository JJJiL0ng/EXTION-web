'use client'

import React, { useState, useCallback, useRef } from 'react';
import { Upload, Send, FileText, X } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CSVChatComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    setMessages([]);
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 파일이 업로드되지 않은 경우의 UI
  if (!file) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-2xl mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              CSV/XLSX 분석 채팅
            </h1>
            <p className="text-gray-600">
              파일을 업로드하여 데이터 분석을 시작하세요
            </p>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                CSV 또는 XLSX 파일 업로드
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                파일을 드래그하여 놓거나 버튼을 클릭하여 선택하세요
              </p>
              <button
                onClick={handleFileButtonClick}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                파일 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 파일이 업로드된 후의 채팅 UI
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {file.name}
              </h2>
              <p className="text-sm text-gray-600">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>파일이 업로드되었습니다. 질문을 입력하여 분석을 시작하세요!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="파일에 대해 질문하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}