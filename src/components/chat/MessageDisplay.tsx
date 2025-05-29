'use client'

import React from 'react';
import { formatMessageDate } from '../../utils/chatUtils';
import { ChatMode } from '../../app/actions/chatActions';
import { ChatMessage } from '../../stores/useUnifiedDataStore';
import { Loader2 } from 'lucide-react';

// Message 인터페이스는 기존과의 호환성을 위해 유지
export interface Message extends ChatMessage {}

interface MessageDisplayProps {
    messages: ChatMessage[];
    onArtifactClick: (messageId: string) => void;
    isLoading?: boolean;
}

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
                
                return (
                    <div key={message.id} className={`py-6 ${index !== 0 ? 'border-t border-gray-100' : ''}`}>
                        <div className="flex items-start">
                            <div className="flex-1">
                                <div className="flex items-center mb-1">
                                    {!isUser && getModeIcon(message.mode)}
                                </div>
                                
                                {message.content ? (
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
                                ) : message.artifactData ? (
                                    <div 
                                        onClick={() => onArtifactClick(message.id)}
                                        className="cursor-pointer bg-indigo-50 p-3 rounded-md hover:bg-indigo-100 transition-colors border border-indigo-100"
                                    >
                                        <div className="flex items-center">
                                            <div className="mr-2 bg-indigo-100 p-1 rounded">📊</div>
                                            <div>
                                                <p className="font-medium">{message.artifactData.title}</p>
                                                <p className="text-xs text-gray-500">클릭하여 살펴보기</p>
                                            </div>
                                        </div>
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