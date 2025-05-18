'use client'

import React from 'react';
import { FunctionSquare, BarChart3 } from 'lucide-react';

interface MessageProps {
    messages: Message[];
    onArtifactClick: (messageId: string) => void;
}

export interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    mode?: 'normal' | 'formula' | 'artifact';
    artifactData?: {
        type: 'chart' | 'table' | 'analysis';
        title: string;
        timestamp: Date;
    };
}

export default function MessageDisplay({ messages, onArtifactClick }: MessageProps) {
    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
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
        );
    }

    return (
        <div className="space-y-4">
            {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                    {message.type === 'assistant' && message.mode === 'artifact' && message.artifactData ? (
                        // 아티팩트 결과 박스
                        <div
                            onClick={() => onArtifactClick(message.id)}
                            className="cursor-pointer bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-indigo-300"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {message.artifactData.title}
                                        </h3>
                                        <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                                            {message.artifactData.type.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        분석 결과를 보려면 클릭하세요
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        생성됨: {message.artifactData.timestamp.toLocaleString('ko-KR')}
                                    </p>
                                </div>
                                <div className="text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // 일반 메시지 렌더링
                        <div
                            className={`${message.type === 'user'
                                ? message.mode === 'formula'
                                    ? 'bg-blue-100 text-blue-900'
                                    : message.mode === 'artifact'
                                        ? 'bg-indigo-100 text-indigo-900'
                                        : 'bg-blue-50 text-blue-900'
                                : 'bg-gray-50 text-gray-900'
                                } rounded-xl p-3`}
                        >
                            <div className="flex items-start space-x-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                                    ? message.mode === 'formula'
                                        ? 'bg-blue-200 text-blue-700'
                                        : message.mode === 'artifact'
                                            ? 'bg-indigo-200 text-indigo-700'
                                            : 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {message.type === 'user' ? (
                                        message.mode === 'formula' ? (
                                            <FunctionSquare className="w-6 h-6" />
                                        ) : message.mode === 'artifact' ? (
                                            <BarChart3 className="w-6 h-6" />
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
                                        {message.type === 'user' && message.mode === 'artifact' && (
                                            <span className="ml-2 text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                                                Artifact
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
                    )}
                </div>
            ))}
        </div>
    );
} 