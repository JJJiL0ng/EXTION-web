'use client'

import React, { useState } from 'react';
import { formatMessageDate } from '../../utils/chatUtils';
import { ChatMode } from '../../app/actions/chatActions';
import { ChatMessage } from '../../stores/useUnifiedDataStore';
import { Loader2, ChevronDown, ChevronUp, BarChart3, Table, FileText, Sparkles } from 'lucide-react';

// Message 인터페이스는 기존과의 호환성을 위해 유지
export interface Message extends ChatMessage {}

interface MessageDisplayProps {
    messages: ChatMessage[];
    onArtifactClick: (messageId: string) => void;
    isLoading?: boolean;
}

// 아티팩트 타입별 아이콘 매핑
const getArtifactIcon = (type?: string) => {
    switch (type) {
        case 'chart':
            return <BarChart3 className="w-5 h-5 text-indigo-600" />;
        case 'table':
            return <Table className="w-5 h-5 text-indigo-600" />;
        case 'analysis':
            return <FileText className="w-5 h-5 text-indigo-600" />;
        default:
            return <Sparkles className="w-5 h-5 text-indigo-600" />;
    }
};

// 아티팩트 타입별 한국어 이름
const getArtifactTypeName = (type?: string) => {
    switch (type) {
        case 'chart':
            return '차트 분석';
        case 'table':
            return '테이블 분석';
        case 'analysis':
            return '데이터 분석';
        default:
            return '분석 결과';
    }
};

// 개별 아티팩트 메시지 컴포넌트
const ArtifactMessage: React.FC<{
    message: ChatMessage;
    onArtifactClick: (messageId: string) => void;
}> = ({ message, onArtifactClick }) => {
    const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);
    
    const artifactData = message.artifactData;
    if (!artifactData) return null;

    const hasExplanation = message.content && message.content.trim().length > 0;

    return (
        <div className="space-y-3">
            {/* 아티팩트 박스 */}
            <div 
                onClick={() => onArtifactClick(message.id)}
                className="group cursor-pointer bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border border-indigo-200 rounded-xl p-4 hover:from-indigo-100 hover:via-blue-100 hover:to-purple-100 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-100 group-hover:shadow-md transition-shadow">
                            {getArtifactIcon(artifactData.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate text-lg">
                                {artifactData.title || getArtifactTypeName(artifactData.type)}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                    {getArtifactTypeName(artifactData.type)}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{new Date(artifactData.timestamp).toLocaleString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 설명 섹션 */}
            {hasExplanation && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <button
                        onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                                <FileText className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                                <span className="font-medium text-gray-900">분석 설명</span>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {isExplanationExpanded ? '설명 숨기기' : '자세한 설명 보기'}
                                </p>
                            </div>
                        </div>
                        <div className={`transform transition-transform duration-200 ${isExplanationExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                        </div>
                    </button>
                    
                    {isExplanationExpanded && (
                        <div className="px-4 pb-4">
                            <div className="prose prose-sm max-w-none text-gray-700 bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: message.content.replace(/\n/g, '<br>')
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function MessageDisplay({ messages, onArtifactClick, isLoading = false }: MessageDisplayProps) {
    const getModeIcon = (mode?: ChatMode) => {
        if (!mode || mode === 'normal') return null;
        
        switch (mode) {
            case 'formula':
                return <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-md mr-2">수식</span>;
            case 'artifact':
                return <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md mr-2">분석</span>;
            case 'datafix':
                return <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-md mr-2">수정</span>;
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {messages.map((message, index) => {
                const isUser = message.type === 'user';
                const isArtifact = message.artifactData && !message.content;
                const isArtifactWithExplanation = message.artifactData && message.content;
                
                return (
                    <div key={message.id} className={`py-6 ${index !== 0 ? 'border-t border-gray-100' : ''}`}>
                        <div className="flex items-start">
                            <div className="flex-1">
                                <div className="flex items-center mb-1">
                                    {!isUser && getModeIcon(message.mode)}
                                </div>
                                
                                {/* 아티팩트 메시지 (설명 포함/미포함) */}
                                {(isArtifact || isArtifactWithExplanation) ? (
                                    <ArtifactMessage 
                                        message={message} 
                                        onArtifactClick={onArtifactClick} 
                                    />
                                ) : message.content ? (
                                    /* 일반 텍스트 메시지 */
                                    <div
                                        className={`prose prose-sm max-w-none ${isUser ? 'bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center' : ''}`}
                                    >
                                        {isUser && (
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                                                <span className="text-white text-xs font-medium">U</span>
                                            </div>
                                        )}
                                        <div className="flex-1"
                                            dangerouslySetInnerHTML={{
                                                __html: message.content.replace(/\n/g, '<br>')
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {/* 로딩 인디케이터 */}
            {isLoading && (
                <div className="py-6 border-t border-gray-100">
                    <div className="flex items-start">
                        <div className="flex-1">
                            <div className="animate-pulse">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-2 bg-gray-200 rounded"></div>
                                        <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-500 flex items-center">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping mr-2"></div>
                                생각 중입니다...
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 