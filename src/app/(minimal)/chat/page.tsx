'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Shuffle, Search, Send, Edit, GraduationCap, Code, FolderOpen, Grid3X3 } from 'lucide-react';
import DashboardBackButton from '@/components/shared/DashboardBackButton';

const ClaudeInputUI = () => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 에어리어 높이 자동 조절
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current as HTMLTextAreaElement;
    if (textarea) { 
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    console.log('메시지 전송:', inputValue);
    setInputValue('');
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
      {/* 대시보드로 돌아가기 버튼 */}
      <DashboardBackButton />

      {/* 헤더 */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3">
            <img src="/logo.png" alt="Extion Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-light text-gray-800">
            LEE/JIHONG님, 만들고 싶은 시트를 말씀해주세요
          </h1>
        </div>
      </div>

      {/* 메인 입력 영역 */}
      <div className="w-full max-w-4xl">
        {/* 입력창 */}
        <div className="input-container bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 transition-all duration-200" style={{ borderColor: inputValue ? '#005ed9' : '#e5e7eb' }}>
          <style jsx>{`
            .input-container:focus-within {
              border-color: #005ed9 !important;
              box-shadow: 0 0 0 3px rgba(0, 94, 217, 0.1);
            }
          `}</style>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="어떤 시트를 만들어볼까요? 가지고 계신 데이터들을 보내주세요"
            className="w-full bg-transparent border-none outline-none resize-none px-6 py-6 text-gray-900 placeholder-gray-500 text-lg min-h-[80px] max-h-48"
            style={{ height: 'auto' }}
          />
          
          {/* 하단 컨트롤 */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <button className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200">
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
              
              <button className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200">
                <Shuffle className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-2 text-sm text-gray-600">
                Claude Sonnet 4
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  inputValue.trim() 
                    ? 'text-white shadow-sm' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                style={{ backgroundColor: inputValue.trim() ? '#005ed9' : undefined }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaudeInputUI;