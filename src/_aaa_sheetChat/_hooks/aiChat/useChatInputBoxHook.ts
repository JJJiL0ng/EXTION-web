import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatMode } from './useChatMode';
import { useSelectedSheetInfoStore } from '../sheet/common/useSelectedSheetInfoStore';
import { aiChatStore } from '@/_aaa_sheetChat/_store/aiChat/aiChatStore';
import useSpreadsheetIdStore from '@/_aaa_sheetChat/_store/sheet/spreadSheetIdStore';
import { getOrCreateGuestId } from '../../_utils/guestUtils';
import useSpreadsheetNamesStore from '@/_aaa_sheetChat/_store/sheet/spreadSheetNamesStore';
import useChatIdStore from '@/_aaa_sheetChat/_store/chat/chatIdAndChatSessionIdStore';
import { useAiChatApiConnector } from './useAiChatApiConnector';
import { aiChatApiReq } from '@/_aaa_sheetChat/_types/apiConnector/ai-chat-api/aiChatApi.types';
import applyDataEditCommands from '@/_aaa_sheetChat/_applyEngine/applyCommand/commandApplyRouter';
import { useSpreadsheetContext } from "@/_aaa_sheetChat/_contexts/SpreadsheetContext";
import { dataEditChatRes } from "@/_aaa_sheetChat/_types/apiConnector/ai-chat-api/dataEdit.types";
import { useGetActiveSheetName } from '@/_aaa_sheetChat/_hooks/sheet/common/useGetActiveSheetName';
import { useSpreadSheetVersionStore } from '@/_aaa_sheetChat/_store/sheet/spreadSheetVersionIdStore';
import { isSpreadSheetDataDirty } from '@/_aaa_sheetChat/_utils/sheet/authSave/isSpreadSheetDataDirty';
import { clearAllDirtyData } from '@/_aaa_sheetChat/_utils/sheet/authSave/clearAllDirtyData';
import { aiModelType } from '@/_aaa_sheetChat/_types/apiConnector/ai-chat-api/aiChatApi.types';
import { useIsEmptySheetStore } from '@/_aaa_sheetChat/_aa_superRefactor/store/sheet/isEmptySheetStore';
import useFileNameStore from '@/_aaa_sheetChat/_store/sheet/fileNameStore';

// 브라우저 Web Crypto API 사용 + 폴백
const safeRandomUUID = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (_) {
    // ignore
  }
  // 간단한 폴백 (충돌 가능성 낮음)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

interface UseChatInputBoxHookProps {
  userId?: string;
  isSheetUploaded?: boolean; // 시트 업로드 여부
}

export const useChatInputBoxHook = ({
  userId = getOrCreateGuestId(),
  isSheetUploaded = false
}: UseChatInputBoxHookProps = {}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeModalRef = useRef<HTMLDivElement>(null);
  const modelModalRef = useRef<HTMLDivElement>(null);

  // useSpreadsheetContext 훅을 사용해서 spread 객체 가져오기
  const { spread } = useSpreadsheetContext();

  // useChatMode 훅을 사용해서 mode 상태와 액션 가져오기
  const { mode, setMode } = useChatMode();

  const [model, setModel] = useState<aiModelType>('Extion small' as aiModelType);


  // useSelectedSheetInfoStore 훅 사용
  const { selectedSheets, removeSelectedSheet, addSelectedSheet } = useSelectedSheetInfoStore();

  // aiChatStore 훅 사용
  const { addUserMessage, isSendingMessage, setIsSendingMessage } = aiChatStore();

  // AI Chat API Connector 훅 사용
  const { isConnected, isConnecting, connect, executeAiJob } = useAiChatApiConnector();

  const { activeSheetName } = useGetActiveSheetName();

  const { isEmptySheet, setIsEmptySheet } = useIsEmptySheetStore();

  // Spread 객체 초기화 시 옵션 설정
  useEffect(() => {
    if (spread && spread.options) {
      console.log('🔧 [ChatInputBoxHook] Setting spread options');
      spread.options.allowDynamicArray = true; // 동적 배열 허용
    } else {
      console.log('⏳ [ChatInputBoxHook] Spread object not ready yet');
    }
  }, [spread]);

  // AI Chat API 서버 연결
  useEffect(() => {
    const connectToAiChatServer = async () => {
      console.log('🔄 [ChatInputBoxHook] Connection effect triggered:', {
        isConnected,
        isConnecting,
        shouldConnect: !isConnected && !isConnecting
      });

      if (!isConnected && !isConnecting) {
        try {
          console.log('🔌 [ChatInputBoxHook] Attempting to connect to AI Chat server');
          const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'ws://localhost:8080';

          await connect(serverUrl);
        } catch (error) {
          console.error('❌ [ChatInputBoxHook] Failed to connect to AI Chat server:', error);
        }
      } else if (isConnected) {
        console.log('✅ [ChatInputBoxHook] Already connected to AI Chat server');
      } else if (isConnecting) {
        console.log('⏳ [ChatInputBoxHook] Connection in progress...');
      }
    };

    connectToAiChatServer();
  }, [isConnected, isConnecting, connect]);

  // 연결 상태 변화 로깅
  // useEffect(() => {
  //   console.log('🔗 [ChatInputBoxHook] Connection status changed:', {
  //     isConnected,
  //     isConnecting,
  //     timestamp: new Date().toISOString()
  //   });
  // }, [isConnected, isConnecting]);

  // 컴포넌트 언마운트 로깅
  // useEffect(() => {
  //   return () => {
  //     console.log('🏗️ [ChatInputBoxHook] Hook unmounting');
  //   };
  // }, []);

  // activeSheetName을 기본 선택으로 추가 (컴포넌트 마운트 시 또는 isSheetUploaded 변경 시)
  const didInitDefaultSelection = useRef(false);

  // useEffect(() => {
  //   console.log('🔍 [ChatInputBoxHook] Default selection effect triggered:', {
  //     didInitDefaultSelection: didInitDefaultSelection.current,
  //     activeSheetName,
  //     isSheetUploaded,
  //     selectedSheetsLength: selectedSheets.length,
  //     selectedSheets: selectedSheets.map(s => s.name)
  //   });

  //   // isSheetUploaded가 변경되면 초기화 상태를 리셋하여 다시 선택할 수 있게 함
  //   if (isSheetUploaded && didInitDefaultSelection.current) {
  //     console.log('📋 [ChatInputBoxHook] Sheet uploaded, resetting initialization flag');
  //     didInitDefaultSelection.current = false;
  //   }

  //   // 이미 초기화했고 시트가 업로드되지 않았으면 실행하지 않음
  //   if (didInitDefaultSelection.current && !isSheetUploaded) {
  //     console.log('🚫 [ChatInputBoxHook] Already initialized, skipping');
  //     return;
  //   }

  //   // activeSheetName이 없으면 대기
  //   if (!activeSheetName) {
  //     console.log('⏳ [ChatInputBoxHook] No activeSheetName yet, waiting...');
  //     return;
  //   }

  //   // 이미 선택된 시트가 있는지 현재 상태를 직접 확인 (시트 업로드 시에는 무시)
  //   const currentSelectedSheets = selectedSheets;
  //   if (currentSelectedSheets.length > 0 && !isSheetUploaded) {
  //     console.log('✅ [ChatInputBoxHook] Sheets already selected, marking as initialized');
  //     didInitDefaultSelection.current = true;
  //     return;
  //   }

  //   console.log('🎯 [ChatInputBoxHook] Adding default sheet:', activeSheetName);
  //   addSelectedSheet(activeSheetName);
  //   didInitDefaultSelection.current = true;
  // }, [activeSheetName, addSelectedSheet, selectedSheets, isSheetUploaded]);

  // 이 로직은 제거됨 - 모달에서 시트 선택 시 activeSheetName이 간섭하지 않도록 함
  // 활성 시트명이 변경될 때 자동 동기화는 하지 않음

  // textarea 높이 조정
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      // 빈 메시지일 때는 최소 높이로 고정
      if (!message.trim()) {
        textareaRef.current.style.height = '24px';
        return;
      }

      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      const minHeight = 24; // line-height와 일치
      textareaRef.current.style.height = `${Math.max(minHeight, Math.min(scrollHeight, maxHeight))}px`;
      adjustTextareaHeight();
    }
  }, [message]);

  // 모달 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showModeModal && modeModalRef.current && !modeModalRef.current.contains(target)) {
        setShowModeModal(false);
      }
    };

    if (showModeModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModeModal]);

  // 모델 모달 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showModelModal && modelModalRef.current && !modelModalRef.current.contains(target)) {
        setShowModelModal(false);
      }
    };

    if (showModelModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModelModal]);


  const handleSend = async () => {
    if (message.trim() || selectedFile) {

      // Spread 객체가 초기화되지 않은 경우 처리
      if (!spread) {
        console.warn('⚠️ [ChatInputBoxHook] Spreadsheet not initialized yet, please wait...');
        return;
      }

      // 전송 상태 시작
      setIsSendingMessage(true);

      const messageToSend = message;

      // 메시지 전송 전에 입력창 초기화
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // textarea 포커스 해제 후 다시 포커스를 주어 IME 상태를 초기화
      if (textareaRef.current) {
        textareaRef.current.blur();
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
      const userChatSessionBranchId = 'user_c_s_b_id_' + safeRandomUUID(); // 새로운 브랜치 ID 생성

      try {
        const messageId = addUserMessage(messageToSend, userChatSessionBranchId);

        console.log('✅ [ChatInputBoxHook] User message added to store:', {
          messageId,
          content: messageToSend,
          timestamp: Date.now()
        });

        console.log('📊 [ChatInputBoxHook] Current store state:', aiChatStore.getState());

        // AI Chat API 호출
        if (isConnected) {
          console.log('🤖 [ChatInputBoxHook] Starting AI job execution');
          console.log('🔗 [ChatInputBoxHook] Connection status:', { isConnected, isConnecting });


          const aiChatApiRequest: aiChatApiReq = {
            spreadsheetId: useSpreadsheetIdStore.getState().spreadSheetId!,
            chatId: useChatIdStore.getState().chatId!,
            chatSessionId: useChatIdStore.getState().chatSessionId,
            userChatSessionBranchId: userChatSessionBranchId,
            userId,
            chatMode: mode,
            userQuestionMessage: messageToSend,
            parsedSheetNames: useSpreadsheetNamesStore.getState().selectedSheets.map(s => s.name),
            jobId: `jobId_${safeRandomUUID()}`,
            spreadSheetVersionId: useSpreadSheetVersionStore.getState().spreadSheetVersionId,
            ...(spread && isSpreadSheetDataDirty(spread) && {
              newVersionSpreadSheetData: spread.toJSON({
                includeBindingSource: true,
                ignoreFormula: false,
                ignoreStyle: false,
                saveAsView: true,
                rowHeadersAsFrozenColumns: false,
                columnHeadersAsFrozenRows: false,
                includeAutoMergedCells: true,
                saveR1C1Formula: true,
                includeUnsupportedFormula: true,
                includeUnsupportedStyle: true
              }),
            }),
            editLockVersion: useSpreadSheetVersionStore.getState().editLockVersion || null, // 낙관적 잠금을 위한 버전 번호
            aiModel: model,
            isEmptySheet: isEmptySheet
          };
          // 전송 직후 시트의 dirty 데이터 모두 초기화 (spread 객체가 있을 때만)
          if (spread) {
            clearAllDirtyData(spread);
          }

          console.log('📤📤📤📤📤📤📤📤📤📤📤 AI request payload:', aiChatApiRequest);
          console.log('📊 [ChatInputBoxHook] Current version before request:', useSpreadSheetVersionStore.getState().spreadSheetVersionId);

          try {
            const result = await executeAiJob(aiChatApiRequest);
            console.log('🎉🎉🎉🎉🎉🎉🎉🎉🎉 AI job completed successfully:', result);

            // AI 응답을 채팅 스토어에 추가, spreadSheetVersionNum 업데이트
            if (result) {
              setIsEmptySheet(false); // 시트가 비어있지 않음으로 설정

              aiChatStore.getState().addAiMessage(result);
              // 다른 저장소 쓰는 프로퍼티들은 값이 유효한지 간단히 체크 후 저장
              if (typeof result.spreadSheetVersionId === 'string' && result.spreadSheetVersionId && result.editLockVersion && result.chatSessionId) {
                useSpreadSheetVersionStore.getState().setSpreadSheetVersion(result.spreadSheetVersionId);
                useSpreadSheetVersionStore.getState().setEditLockVersion(result.editLockVersion);
                useChatIdStore.getState().setChatSessionId(result.chatSessionId);
                useFileNameStore.getState().setFileName(result.fileName || ''); // 파일 이름이 있으면 설정, 없으면 빈 문자열
                console.log('asfasfasfsdafsafhhhhhhhㅗㅗㅗㅗ',result.fileName);
              } else {
                console.warn('⚠️ [ChatInputBoxHook] Invalid version id received:', result.spreadSheetVersionId);
              }
            }
            // 시트에 데이터 편집 명령 적용 (spread 객체가 있을 때만)
            if (spread) {
              applyDataEditCommands({ dataEditChatRes: result.dataEditChatRes as dataEditChatRes, spread: spread });
            } else {
              console.warn('⚠️ [ChatInputBoxHook] Spread object not available for applying data edit commands');
            }


          } catch (aiError) {
            console.error('❌ [ChatInputBoxHook] AI job failed:', aiError);
          }
        } else {
          console.warn('⚠️ [ChatInputBoxHook] Not connected to AI server, skipping AI job');
        }

      } catch (error) {
        console.error('❌ [ChatInputBoxHook] Message sending failed:', error);
      } finally {
        console.log('🏁 [ChatInputBoxHook] Finishing message send process');
        setIsSendingMessage(false);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault();
      if (!isSendingMessage && (message.trim() || selectedFile)) {
        handleSend();
      }
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return {
    // State
    message,
    setMessage,
    selectedFile,
    setSelectedFile,
    showModeModal,
    setShowModeModal,
    showModelModal,
    setShowModelModal,
    isComposing,
    isFocused,
    mode,
    setMode,
    model,
    setModel,
    selectedSheets,
    removeSelectedSheet,
    addSelectedSheet,
    isSendingMessage,
    isConnected,
    isConnecting,

    // Refs
    fileInputRef,
    textareaRef,
    modeModalRef,
    modelModalRef,

    // Handlers
    handleSend,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
    handleFocus,
    handleBlur,
  };
};