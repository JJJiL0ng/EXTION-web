'use client'

import React, { useState } from 'react';
import { ChatMessage } from '../../stores/store-types';
import { ChatMode } from '@/types/chat';
import { Loader2, ChevronDown, BarChart3, Table, FileText, Sparkles } from 'lucide-react';

// Message 인터페이스는 기존과의 호환성을 위해 유지
export interface Message extends ChatMessage {}

interface MessageDisplayProps {
    messages: ChatMessage[];
    onArtifactClick: (messageId: string) => void;
    isLoading?: boolean;
    onDataFixApply: (messageId: string) => void;
    appliedDataFixes: string[];
    onFunctionApply: (messageId: string) => void;
    appliedFunctionResults: string[];
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

// 데이터 수정 제안 메시지 컴포넌트
const DataFixMessage: React.FC<{
    message: ChatMessage;
    onDataFixApply: (messageId: string) => void;
    isApplied: boolean;
}> = ({ message, onDataFixApply, isApplied }) => {
    const { dataFixData } = message;
    if (!dataFixData) return null;

    const { editedData } = dataFixData;
    const isFromBackend = (message as any).isFromBackend;

    return (
        <div className="space-y-4">
            <div>
                <div
                    className="prose prose-sm max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{
                        __html: message.content.replace(/\n/g, '<br>')
                    }}
                />
            </div>
            
            <div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-900">
                        &quot;{editedData.sheetName}&quot; 시트에 변경사항 적용
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {editedData.data.length}개 행, {editedData.data[0]?.length || 0}개 열
                    </p>
                    
                    {/* 백엔드에서 불러온 메시지가 아닌 경우에만 적용 버튼 표시 */}
                    {!isFromBackend && (
                        <button
                            onClick={() => onDataFixApply(message.id)}
                            disabled={isApplied}
                            className={`mt-4 w-full text-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2
                                ${isApplied 
                                    ? 'bg-[#e6f0ff] text-[#005de9] cursor-not-allowed' 
                                    : 'bg-[#005de9] text-white hover:bg-[#004bc1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005de9]'
                                }`}
                        >
                            {isApplied ? (
                                <>
                                    <span>✓ 적용 완료</span>
                                </>
                            ) : (
                                '변경사항 적용하기'
                            )}
                        </button>
                    )}
                    
                    {/* 백엔드에서 불러온 메시지인 경우 적용 완료 표시 */}
                    {/* {isFromBackend && (
                        <div className="mt-4 w-full text-center px-4 py-2 text-sm font-medium rounded-lg bg-green-50 text-green-700 border border-green-200">
                            <span>✓ 과거 적용된 변경사항</span>
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
}

// 함수 실행 결과 메시지 컴포넌트
const FunctionResultMessage: React.FC<{
    message: ChatMessage;
    onFunctionApply: (messageId: string) => void;
    isApplied: boolean;
}> = ({ message, onFunctionApply, isApplied }) => {
    const { functionData } = message as any;
    if (!functionData) return null;

    const { functionDetails } = functionData;
    const isFromBackend = (message as any).isFromBackend;

    const resultPreview = Array.isArray(functionDetails.result)
        ? `[${functionDetails.result.length}x${functionDetails.result[0]?.length || 0} 데이터]`
        : `값: ${functionDetails.result}`;

    return (
        <div className="space-y-4">
            <div>
                <div
                    className="prose prose-sm max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{
                        __html: message.content.replace(/\n/g, '<br>')
                    }}
                />
            </div>
            
            <div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-900">
                        셀 <code className="text-sm bg-gray-100 p-1 rounded">{functionDetails.targetCell}</code>에 함수 결과 적용
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        결과 미리보기: {resultPreview}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        생성된 수식: <code className="text-xs bg-gray-100 p-1 rounded">{functionDetails.formula}</code>
                    </p>
                    
                    {/* 백엔드에서 불러온 메시지가 아닌 경우에만 적용 버튼 표시 */}
                    {!isFromBackend && (
                        <button
                            onClick={() => onFunctionApply(message.id)}
                            disabled={isApplied}
                            className={`mt-4 w-full text-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2
                                ${isApplied 
                                    ? 'bg-[#e6f0ff] text-[#005de9] cursor-not-allowed' 
                                    : 'bg-[#005de9] text-white hover:bg-[#004bc1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005de9]'
                                }`}
                        >
                            {isApplied ? (
                                <>
                                    <span>✓ 적용 완료</span>
                                </>
                            ) : (
                                '결과 적용하기'
                            )}
                        </button>
                    )}
                    
                    {/* 백엔드에서 불러온 메시지인 경우 적용 완료 표시 */}
                    {isFromBackend && (
                        <div className="mt-4 w-full text-center px-4 py-2 text-sm font-medium rounded-lg bg-green-50 text-green-700 border border-green-200">
                            <span>✓ 과거 적용된 함수 결과</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MessageDisplay({ 
    messages, 
    onArtifactClick, 
    isLoading = false, 
    onDataFixApply, 
    appliedDataFixes,
    onFunctionApply,
    appliedFunctionResults 
}: MessageDisplayProps) {
    const getModeIcon = (mode?: ChatMode) => {
        if (!mode || mode === 'normal') return null;
        
        switch (mode) {
            case 'function':
                return <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md mr-2">함수</span>;
            case 'artifact':
                return <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md mr-2">시각화</span>;
            case 'datafix':
                return <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md mr-2">자동수정</span>;
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {messages.map((message, index) => {
                const isUser = message.type === 'user';
                const hasArtifactData = !!(message as any).artifactData;
                const isDataFix = !!(message as any).dataFixData;
                const isFunctionResult = !!(message as any).functionData;
                
                // console.log('🎨 메시지 렌더링:', {
                //     id: message.id,
                //     type: message.type,
                //     hasContent: !!message.content,
                //     hasArtifactData,
                //     isDataFix,
                //     isFunctionResult,
                //     mode: (message as any).mode
                // });
                
                return (
                    <div key={message.id} className={`py-6 ${index !== 0 ? 'border-t border-gray-100' : ''}`}>
                        <div className="flex items-start">
                            {/* AI 메시지 아바타 */}
                            {/* {!isUser && (
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-1">
                                    <span className="text-white text-sm font-medium">AI</span>
                                </div>
                            )} */}
                            
                            <div className="flex-1">
                                <div className="flex items-center mb-1">
                                    {!isUser && getModeIcon((message as any).mode)}
                                </div>
                                
                                {/* 함수 실행 결과 메시지 */}
                                {isFunctionResult ? (
                                    <FunctionResultMessage
                                        message={message}
                                        onFunctionApply={onFunctionApply}
                                        isApplied={appliedFunctionResults.includes(message.id)}
                                    />
                                ) : 
                                /* 데이터 수정 메시지 */
                                isDataFix ? (
                                    <DataFixMessage 
                                        message={message}
                                        onDataFixApply={onDataFixApply}
                                        isApplied={appliedDataFixes.includes(message.id)}
                                    />
                                ) : 
                                /* 아티팩트 메시지 */
                                hasArtifactData ? (
                                    <ArtifactMessage 
                                        message={message} 
                                        onArtifactClick={onArtifactClick} 
                                    />
                                ) : 
                                /* 일반 텍스트 메시지 (사용자 + AI) */
                                message.content ? (
                                    <div
                                        className={`prose prose-sm max-w-none ${
                                            isUser 
                                                ? 'bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center' 
                                                : 'text-gray-800'
                                        }`}
                                    >
                                        {isUser && (
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center mr-3">
                                                <span className="text-white text-xs font-medium">U</span>
                                            </div>
                                        )}
                                        <div className="flex-1"
                                            dangerouslySetInnerHTML={{
                                                __html: message.content.replace(/\n/g, '<br>')
                                            }}
                                        />
                                    </div>
                                ) : 
                                /* 콘텐츠가 없는 경우 */
                                (
                                    <div className="text-gray-500 italic">
                                        (메시지 내용이 없습니다)
                                    </div>
                                )}
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