"use client";

import React from 'react';

interface TypingIndicatorProps {
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex space-x-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ 
            backgroundColor: '#005ed9',
            animation: 'bounce 1.2s infinite',
            animationDelay: '0ms',
          }}
        />
        <div 
          className="w-3 h-3 rounded-full"
          style={{ 
            backgroundColor: '#005ed9',
            animation: 'bounce 1.2s infinite',
            animationDelay: '200ms',
          }}
        />
        <div 
          className="w-3 h-3 rounded-full"
          style={{ 
            backgroundColor: '#005ed9',
            animation: 'bounce 1.2s infinite',
            animationDelay: '400ms',
          }}
        />
      </div>
      <span 
        className="text-base text-gray-500 ml-3 animate-pulse"
        style={{
          animationDuration: '2s'
        }}
      >
        thinking...
      </span>
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.7) translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2) translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;