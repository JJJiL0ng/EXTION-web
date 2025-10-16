export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  contentType: 'mapping-suggestion' | 'notification' | 'user-message'
  content: string;
  timestamp: number;
}