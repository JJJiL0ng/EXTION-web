import { beforeEach, describe, expect, it } from 'vitest';

import useChatStore, { CHAT_STORAGE_KEY } from './chatIdAndChatSessionIdStore';

describe('useChatStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useChatStore.setState({
      chatId: null,
      chatSessionId: null,
    });
  });

  it('stores and resets the active chat ids', () => {
    useChatStore.getState().setChatId('chat-1');
    useChatStore.getState().setChatSessionId('session-1');

    expect(useChatStore.getState().chatId).toBe('chat-1');
    expect(useChatStore.getState().chatSessionId).toBe('session-1');

    useChatStore.getState().resetChatId();
    useChatStore.getState().resetChatSessionId();

    expect(useChatStore.getState().chatId).toBeNull();
    expect(useChatStore.getState().chatSessionId).toBeNull();
  });

  it('persists only serializable chat id fields', () => {
    useChatStore.getState().setChatId('chat-2');
    useChatStore.getState().setChatSessionId('session-2');

    const persisted = JSON.parse(sessionStorage.getItem(CHAT_STORAGE_KEY) ?? '{}');

    expect(persisted).toEqual({
      state: {
        chatId: 'chat-2',
        chatSessionId: 'session-2',
      },
      version: 1,
    });
  });
});
