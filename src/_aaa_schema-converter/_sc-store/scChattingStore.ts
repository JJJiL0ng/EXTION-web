//채팅 상태관리 스토어. ScChatviewer에서 이걸 구독하여 새로새로 추가되는 메시지를 랜더링 할거임

import { create } from "zustand";
import { ChatMessage } from "../_sc-type/scChatting.types";


interface ScChattingStore {
    messages: ChatMessage[];
    hasPendingMappingSuggestion: boolean;
    respondedMappingSuggestionId: string | null;
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;
    setHasPendingMappingSuggestion: (pending: boolean) => void;
    setRespondedMappingSuggestionId: (id: string) => void;
}

export const useScChattingStore = create<ScChattingStore>((set) => ({
    messages: [],
    hasPendingMappingSuggestion: false,
    respondedMappingSuggestionId: null,

    addMessage: (message) =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    ...message,
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                },
            ],
            // mapping-suggestion 메시지가 추가되면 pending 상태로 설정
            hasPendingMappingSuggestion: message.contentType === 'mapping-suggestion' ? true : state.hasPendingMappingSuggestion,
        })),

    clearMessages: () => set({ messages: [], hasPendingMappingSuggestion: false, respondedMappingSuggestionId: null }),

    setHasPendingMappingSuggestion: (pending) => set({ hasPendingMappingSuggestion: pending }),

    setRespondedMappingSuggestionId: (id) => set({ respondedMappingSuggestionId: id }),
}));