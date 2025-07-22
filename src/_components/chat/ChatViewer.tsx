"use client";

import React, { useState, useRef } from 'react';

const ChatViewer: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    const message = messageInputRef.current?.value.trim();
    if (message) {
      setMessages([...messages, message]);
      if (messageInputRef.current) {
        messageInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="chat-viewer">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            {msg}
          </div>
        ))}
      </div>
      <textarea ref={messageInputRef} placeholder="Type your message..." />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}

export default ChatViewer;