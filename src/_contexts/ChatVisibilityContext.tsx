// "use client";

// import React, { createContext, useContext, useState, ReactNode } from 'react';

// interface ChatVisibilityContextType {
//   isChatVisible: boolean;
//   showChat: () => void;
//   hideChat: () => void;
//   toggleChat: () => void;
// }

// const ChatVisibilityContext = createContext<ChatVisibilityContextType | undefined>(undefined);

// interface ChatVisibilityProviderProps {
//   children: ReactNode;
//   initialVisible?: boolean;
// }

// export function ChatVisibilityProvider({ children, initialVisible = true }: ChatVisibilityProviderProps) {
//   const [isChatVisible, setIsChatVisible] = useState(initialVisible);

//   const showChat = () => setIsChatVisible(true);
//   const hideChat = () => setIsChatVisible(false);
//   const toggleChat = () => setIsChatVisible(prev => !prev);

//   return (
//     <ChatVisibilityContext.Provider value={{
//       isChatVisible,
//       showChat,
//       hideChat,
//       toggleChat
//     }}>
//       {children}
//     </ChatVisibilityContext.Provider>
//   );
// }

// export function useChatVisibility() {
//   const context = useContext(ChatVisibilityContext);
//   if (context === undefined) {
//     throw new Error('useChatVisibility must be used within a ChatVisibilityProvider');
//   }
//   return context;
// }
