import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 테이블, 취소선 등 확장 마크다운 지원
import { MessageStatus } from '../../../_types/chat.types';

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
  status?: MessageStatus;
  className?: string;
}

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({ 
  content, 
  isStreaming = false,
  status = MessageStatus.COMPLETED,
  className = ""
}) => {
  
  // 스트리밍 중일 때 커서 효과 추가
  const displayContent = useMemo(() => {
    if (isStreaming || status === MessageStatus.STREAMING) {
      return content + '|'; // 타이핑 커서 효과
    }
    return content;
  }, [content, isStreaming, status]);
  
  // 상태에 따른 스타일 클래스
  const containerClass = useMemo(() => {
    const baseClass = "prose prose-sm max-w-none";
    const statusClass = isStreaming || status === MessageStatus.STREAMING 
      ? "streaming-content" 
      : "completed-content";
    
    return `${baseClass} ${statusClass} ${className}`.trim();
  }, [isStreaming, status, className]);

  return (
    <div className={containerClass}>
      {/* 
        react-markdown은 content가 변경될 때마다 다시 렌더링하므로
        스트리밍 효과를 자연스럽게 보여줍니다.
      */}
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // 코드 블록 커스터마이징
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            return (
              <code 
                className={`${className || ''} ${language ? `language-${language}` : ''}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // 테이블 스타일링 개선
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300" {...props}>
                {children}
              </table>
            </div>
          ),
          
          // 링크 안전성 강화
          a: ({ href, children, ...props }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
              {...props}
            >
              {children}
            </a>
          )
        }}
      >
        {displayContent}
      </ReactMarkdown>
      
      {/* 스트리밍 상태 표시 */}
      {(isStreaming || status === MessageStatus.STREAMING) && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
          </div>
          <span className="ml-2">AI가 응답하고 있습니다...</span>
        </div>
      )}
    </div>
  );
};

// 기본 내보내기 추가 (기존 코드와의 호환성)
export default StreamingMarkdown;