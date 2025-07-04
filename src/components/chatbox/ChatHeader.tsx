import React from 'react';

interface ChatHeaderProps {
  userName?: string;
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  className?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  userName = "LEE/JIHONG",
  title,
  subtitle = "님, 만들고 싶은 시트를 말씀해주세요",
  logoSrc = "/logo.png",
  className = ""
}) => {
  return (
    <div className={`mb-8 text-center ${className}`}>
      <div className="flex items-center justify-center mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3">
          <img src={logoSrc} alt="Extion Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-4xl font-semibold text-gray-800 mr-1">
          {title || userName}
        </h1>
        <h2 className="text-4xl font-sans text-gray-800 ml-1">            
          {subtitle}
        </h2>
      </div>
    </div>
  );
};

export default ChatHeader; 