import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 테이블, 취소선 등 확장 마크다운 지원

interface StreamingMarkdownProps {
  content: string;
}

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none">
      {/* 
        react-markdown은 content가 변경될 때마다 다시 렌더링하므로
        스트리밍 효과를 자연스럽게 보여줍니다.
      */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};