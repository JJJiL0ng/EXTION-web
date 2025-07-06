import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ChatState, createChatSlice } from './slices/chatSlice';
import { SpreadsheetState, createSpreadsheetSlice } from './slices/spreadsheetSlice';
import { UIState, createUISlice } from './slices/uiSlice';
import { TableGenerateState, createTableGenerateSlice } from './slices/tableGenerateSlice';

type AppState = ChatState & SpreadsheetState & UIState & TableGenerateState;

export const useUnifiedDataStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createChatSlice(...a),
        ...createSpreadsheetSlice(...a),
        ...createUISlice(...a),
        ...createTableGenerateSlice(...a),
      }),
      {
        name: 'extion-storage',
        // partialize: (state) => ({ chat: state.chat, spreadsheet: state.spreadsheet }),
      }
    )
  )
);
