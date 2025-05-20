'use client'

import React from 'react';
import { formatMessageDate } from '../../utils/chatUtils';
import { ChatMode } from '../../app/actions/chatActions';

export interface Message {
    id: string;
    type: 'user' | 'Extion ai';
    content: string;
    timestamp: Date;
    mode?: ChatMode;
    artifactData?: {
        type: string;
        title: string;
        timestamp: Date;
    };
}

interface MessageDisplayProps {
    messages: Message[];
    onArtifactClick: (messageId: string) => void;
}

export default function MessageDisplay({ messages, onArtifactClick }: MessageDisplayProps) {
    const getModeIcon = (mode?: ChatMode) => {
        if (!mode || mode === 'normal') return null;
        
        switch (mode) {
            case 'formula':
                return <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-md mr-2">수식</span>;
            case 'artifact':
                return <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md mr-2">분석</span>;
            case 'datageneration':
                return <span className="text-xs px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded-md mr-2">데이터</span>;
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
        </div>
    );
} 