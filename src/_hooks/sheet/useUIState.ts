import { useReducer, useCallback } from 'react';

// UI 상태 타입 정의
export interface UIState {
    isDragActive: boolean;
    dragCounter: number;
    showChatButton: boolean;
    hasAutoOpenedChat: boolean;
}

// UI 상태 액션 타입
export type UIAction =
    | { type: 'SET_DRAG_ACTIVE'; payload: boolean }
    | { type: 'INCREMENT_DRAG_COUNTER' }
    | { type: 'DECREMENT_DRAG_COUNTER' }
    | { type: 'RESET_DRAG_COUNTER' }
    | { type: 'SET_SHOW_CHAT_BUTTON'; payload: boolean }
    | { type: 'SET_AUTO_OPENED_CHAT'; payload: boolean }
    | { type: 'RESET_UI_STATE' };

// UI 상태 reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'SET_DRAG_ACTIVE':
            return { ...state, isDragActive: action.payload };
        case 'INCREMENT_DRAG_COUNTER':
            return { ...state, dragCounter: state.dragCounter + 1 };
        case 'DECREMENT_DRAG_COUNTER': {
            const newDragCounter = Math.max(0, state.dragCounter - 1);
            return { 
                ...state, 
                dragCounter: newDragCounter,
                isDragActive: newDragCounter > 0 && state.isDragActive
            };
        }
        case 'RESET_DRAG_COUNTER':
            return { ...state, dragCounter: 0, isDragActive: false };
        case 'SET_SHOW_CHAT_BUTTON':
            return { ...state, showChatButton: action.payload };
        case 'SET_AUTO_OPENED_CHAT':
            return { ...state, hasAutoOpenedChat: action.payload };
        case 'RESET_UI_STATE':
            return {
                isDragActive: false,
                dragCounter: 0,
                showChatButton: true,
                hasAutoOpenedChat: false,
            };
        default:
            return state;
    }
};

// 초기 UI 상태
const initialUIState: UIState = {
    isDragActive: false,
    dragCounter: 0,
    showChatButton: true,
    hasAutoOpenedChat: false,
};

// UI 상태 관리 훅
export const useUIState = () => {
    const [uiState, dispatch] = useReducer(uiReducer, initialUIState);

    // 액션 헬퍼 함수들
    const actions = {
        setDragActive: useCallback((active: boolean) => {
            dispatch({ type: 'SET_DRAG_ACTIVE', payload: active });
        }, []),

        incrementDragCounter: useCallback(() => {
            dispatch({ type: 'INCREMENT_DRAG_COUNTER' });
        }, []),

        decrementDragCounter: useCallback(() => {
            dispatch({ type: 'DECREMENT_DRAG_COUNTER' });
        }, []),

        resetDragCounter: useCallback(() => {
            dispatch({ type: 'RESET_DRAG_COUNTER' });
        }, []),

        setShowChatButton: useCallback((show: boolean) => {
            dispatch({ type: 'SET_SHOW_CHAT_BUTTON', payload: show });
        }, []),

        setAutoOpenedChat: useCallback((opened: boolean) => {
            dispatch({ type: 'SET_AUTO_OPENED_CHAT', payload: opened });
        }, []),

        resetUIState: useCallback(() => {
            dispatch({ type: 'RESET_UI_STATE' });
        }, [])
    };

    return {
        uiState,
        actions,
        dispatch // 직접 dispatch도 제공 (기존 코드 호환성을 위해)
    };
};