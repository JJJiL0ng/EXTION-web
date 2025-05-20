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
        <div className="space-y-4">
            {messages.map((message) => {
                const isUser = message.type === 'user';
                const userClass = isUser
                    ? 'bg-blue-50 text-blue-900'
                    : 'bg-white text-gray-900 border border-gray-200';
                    
                const alignClass = isUser ? 'ml-auto' : 'mr-auto';
                
                return (
                    <div key={message.id} className="flex flex-col">
                        <div className={`max-w-[85%] rounded-lg p-3 ${userClass} ${alignClass}`}>
                            <div className="flex items-center text-sm mb-1 text-gray-600">
                                <div className="flex items-center">
                                    {!isUser && getModeIcon(message.mode)}
                                    <span className="font-medium">{message.type}</span>
                                </div>
                                <span className="mx-1.5">•</span>
                                <span className="text-xs">{formatMessageDate(message.timestamp)}</span>
                            </div>
                            
                            {message.content ? (
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: message.content.replace(/\n/g, '<br>')
                                    }}
                                />
                            ) : message.artifactData ? (
                                <div 
                                    onClick={() => onArtifactClick(message.id)}
                                    className="cursor-pointer bg-indigo-50 p-2 rounded-md hover:bg-indigo-100 transition-colors"
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
                );
            })}
        </div>
    );
} 