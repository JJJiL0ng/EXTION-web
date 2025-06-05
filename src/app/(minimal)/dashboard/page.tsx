'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { MessageCircle, User, Bot, FileSpreadsheetIcon, Menu } from 'lucide-react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import DashFileUpload from '@/components/dashboard/DashFileUpload';
import DashChatInput from '@/components/dashboard/DashChatInput';

interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    hasFile?: boolean;
    fileName?: string;
}

export default function DashboardPage() {
    // 사이드바 상태
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // 채팅 상태
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    
    // 파일 업로드 상태
    const [hasUploadedFile, setHasUploadedFile] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    
    // 로딩 상태들
    const [loadingStates, setLoadingStates] = useState({
        formulaGeneration: false,
        artifactGeneration: false,
        dataGeneration: false,
        dataFix: false
    });
    
    const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);



    // 사이드바 토글
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // 파일 드래그 이벤트 핸들러
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        if (hasUploadedFile) return;
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // 파일 입력 핸들러
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // 파일 업로드 처리
    const handleFileUpload = (file: File) => {
        if (hasUploadedFile) return;
        
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            alert('CSV, XLSX, XLS 파일만 업로드 가능합니다.');
            return;
        }
        
        setHasUploadedFile(true);
        setUploadedFileName(file.name);
        
        // 파일 업로드 메시지 추가
        const fileMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: `파일을 업로드했습니다: ${file.name}`,
            timestamp: new Date(),
            hasFile: true,
            fileName: file.name
        };
        
        setMessages(prev => [...prev, fileMessage]);
        
        // AI 응답 시뮬레이션
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: `${file.name} 파일을 성공적으로 업로드했습니다! 이제 이 데이터에 대해 질문하거나 분석을 요청해보세요.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    // 채팅 입력 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = () => {
        setIsComposing(false);
    };

    // 메시지 전송
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;
        
        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        
        // AI 응답 시뮬레이션
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: `"${userMessage.content}"에 대한 답변입니다. 현재는 데모 모드로 실제 AI 응답이 연동되면 더 정확한 답변을 제공할 수 있습니다.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1500);
    };

    // 메시지 시간 포맷팅
    const formatMessageTime = (date: Date) => {
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 메시지가 있는지 확인
    const hasMessages = messages.length > 0;

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* 사이드바 */}
            <Suspense fallback={<div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>}>
                <ChatSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
            </Suspense>
            
            {/* 메인 콘텐츠 */}
            <div className="flex-1 flex flex-col">
                {/* 헤더 */}
                <div className="bg-transparent px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">E</span>
                            </div>
                            <span className="text-lg font-semibold text-gray-800">extion.ai</span>
                        </div>
                    </div>
                    
                    {/* 업로드된 파일 표시 */}
                    {hasUploadedFile && uploadedFileName && (
                        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-purple-100 shadow-sm">
                            <FileSpreadsheetIcon className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-purple-600 font-medium">{uploadedFileName}</span>
                        </div>
                    )}
                </div>

                {/* 메인 콘텐츠 영역 */}
                <div className="flex-1 flex flex-col">
                    {!hasMessages ? (
                        /* 초기 화면 - 중앙 정렬 */
                        <div className="flex-1 flex flex-col items-center justify-center px-6">
                            <div className="w-full max-w-2xl space-y-8">
                                {/* 제목 영역 */}
                                <div className="text-center space-y-4">
                                    <h1 className="text-5xl font-bold text-blue-600">
                                        Extion
                                    </h1>
                                </div>
                                
                                {/* 입력 영역 */}
                                <div className="flex items-center space-x-4">
                                    {/* 파일 업로드 */}
                                    <DashFileUpload
                                        hasUploadedFile={hasUploadedFile}
                                        isDragOver={isDragOver}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        handleFileInputChange={handleFileInputChange}
                                    />
                                    
                                    {/* 채팅 입력 */}
                                    <DashChatInput
                                        inputValue={inputValue}
                                        isLoading={isLoading}
                                        loadingStates={loadingStates}
                                        isArtifactModalOpen={isArtifactModalOpen}
                                        onInputChange={handleInputChange}
                                        onKeyPress={handleKeyPress}
                                        onCompositionStart={handleCompositionStart}
                                        onCompositionEnd={handleCompositionEnd}
                                        onSendMessage={handleSendMessage}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* 채팅 화면 */
                        <>
                            {/* 채팅 영역 */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                {/* 아바타 */}
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                    message.type === 'user' 
                                                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                    {message.type === 'user' ? (
                                                        <User className="h-4 w-4" />
                                                    ) : (
                                                        <Bot className="h-4 w-4" />
                                                    )}
                                                </div>
                                                
                                                {/* 메시지 내용 */}
                                                <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-4 py-3 rounded-2xl ${
                                                        message.type === 'user'
                                                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                                            : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                                                    }`}>
                                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                        {message.hasFile && message.fileName && (
                                                            <div className="mt-2 flex items-center space-x-2 text-xs opacity-75">
                                                                <FileSpreadsheetIcon className="h-3 w-3" />
                                                                <span>{message.fileName}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-1">
                                                        {formatMessageTime(message.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* 로딩 인디케이터 */}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex items-start space-x-3 max-w-3xl">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                                                    <Bot className="h-4 w-4" />
                                                </div>
                                                <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                        </div>
                                                        <span className="text-sm text-gray-500">AI가 답변을 생성하고 있습니다...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 하단 입력 영역 */}
                            <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 px-6 py-4">
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex items-center space-x-4">
                                        {/* 파일 업로드 */}
                                        <DashFileUpload
                                            hasUploadedFile={hasUploadedFile}
                                            isDragOver={isDragOver}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            handleFileInputChange={handleFileInputChange}
                                        />
                                        
                                        {/* 채팅 입력 */}
                                        <DashChatInput
                                            inputValue={inputValue}
                                            isLoading={isLoading}
                                            loadingStates={loadingStates}
                                            isArtifactModalOpen={isArtifactModalOpen}
                                            onInputChange={handleInputChange}
                                            onKeyPress={handleKeyPress}
                                            onCompositionStart={handleCompositionStart}
                                            onCompositionEnd={handleCompositionEnd}
                                            onSendMessage={handleSendMessage}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
