export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  contentType: 'mapping-suggestion' | 'notification' | 'user-message' | 'multiturn-chat-response';
  content: string;
  timestamp: number;
}