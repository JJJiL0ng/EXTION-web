import { useState, useRef, useCallback, useEffect } from 'react';
import { AiChatApiConnector } from '@/_ApiConnector/ai-chat/aiChatApiConnector';
import { aiChatApiReq, aiChatApiRes } from "@/_types/apiConnector/ai-chat-api/aiChatApi.types";
import { rollbackMessageReq, rollbackMessageRes } from "@/_types/apiConnector/ai-chat-api/rollbackMessageApi.types";

// Singleton connector instance
let globalConnector: AiChatApiConnector | null = null;
let globalConnectionState = {
  isConnected: false,
  isConnecting: false,
  listeners: new Set<() => void>()
};

interface UseAiChatApiConnectorReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connect: (serverUrl: string) => Promise<void>;
  disconnect: () => void;
  executeAiJob: (request: aiChatApiReq) => Promise<aiChatApiRes>;
  cancelJob: (jobId: string) => void;
  // rollback API 추가
  rollbackMessage: (request: rollbackMessageReq) => Promise<rollbackMessageRes>;
  // connector 인스턴스 노출
  connector: AiChatApiConnector | null;
}

export const useAiChatApiConnector = (): UseAiChatApiConnectorReturn => {
  const [isConnected, setIsConnected] = useState(globalConnectionState.isConnected);
  const [isConnecting, setIsConnecting] = useState(globalConnectionState.isConnecting);
  const pendingJobsRef = useRef<Map<string, {
    resolve: (value: aiChatApiRes) => void;
    reject: (reason: any) => void;
    plan?: any;
  }>>(new Map());

  // 글로벌 상태 변화 감지
  useEffect(() => {
    const updateState = () => {
      setIsConnected(globalConnectionState.isConnected);
      setIsConnecting(globalConnectionState.isConnecting);
    };

    globalConnectionState.listeners.add(updateState);

    return () => {
      globalConnectionState.listeners.delete(updateState);
    };
  }, []);

  // 글로벌 상태 업데이트 함수
  const updateGlobalState = useCallback((newIsConnected: boolean, newIsConnecting: boolean) => {
    globalConnectionState.isConnected = newIsConnected;
    globalConnectionState.isConnecting = newIsConnecting;

    // 모든 리스너에게 알림
    globalConnectionState.listeners.forEach(listener => listener());
  }, []);

  const connect = useCallback(async (serverUrl: string) => {
    console.log('🔌 [useAiChatApiConnector] Connect called with:', serverUrl);

    if (!globalConnector) {
      console.log('🔌 [useAiChatApiConnector] Creating new global connector');
      globalConnector = new AiChatApiConnector();
    }

    if (globalConnector.connected) {
      console.log('🔌 [useAiChatApiConnector] Already connected, skipping');
      return;
    }

    console.log('🔌 [useAiChatApiConnector] Starting connection process');
    updateGlobalState(false, true);
    try {
      await globalConnector.connect(serverUrl);
      console.log('✅ [useAiChatApiConnector] Connector connected successfully');
      updateGlobalState(true, false);

      // 이벤트 리스너 설정
      globalConnector.onJobPlanned((data) => {
        const pending = pendingJobsRef.current.get(data.jobId);
        if (pending) {
          pending.plan = data.plan;
        }
      });

      globalConnector.onTasksExecuted((data) => {
        const pending = pendingJobsRef.current.get(data.jobId);
        if (pending) {
          // aiChatApiRes 형태로 반환
          pending.resolve({
            jobId: data.jobId,
            chatSessionId: data.chatSessionId,
            taskManagerOutput: pending.plan,
            dataEditChatRes: data.dataEditChatRes,
            spreadSheetVersionId: data.spreadSheetVersionId,
            editLockVersion: data.editLockVersion
          });
          pendingJobsRef.current.delete(data.jobId);
        }
      });

      globalConnector.onJobError((data) => {
        const pending = pendingJobsRef.current.get(data.jobId || '');
        if (pending) {
          pending.reject(new Error(data.message));
          if (data.jobId) {
            pendingJobsRef.current.delete(data.jobId);
          }
        }
      });

      globalConnector.onJobCancelled((data) => {
        const pending = pendingJobsRef.current.get(data.jobId);
        if (pending) {
          pending.reject(new Error('Job was cancelled'));
          pendingJobsRef.current.delete(data.jobId);
        }
      });

      globalConnector.onJobTimeout((data) => {
        const pending = pendingJobsRef.current.get(data.jobId);
        if (pending) {
          pending.reject(new Error(data.message));
          pendingJobsRef.current.delete(data.jobId);
        }
      });

    } catch (error) {
      console.error('❌ [useAiChatApiConnector] Connection failed:', error);
      updateGlobalState(false, false);
      throw error;
    } finally {
      console.log('🏁 [useAiChatApiConnector] Connection process finished');
    }
  }, [updateGlobalState]);

  const disconnect = useCallback(() => {
    if (globalConnector) {
      globalConnector.disconnect();
      updateGlobalState(false, false);
    }
    // 모든 pending job들을 reject
    pendingJobsRef.current.forEach((pending) => {
      pending.reject(new Error('Connection closed'));
    });
    pendingJobsRef.current.clear();
  }, [updateGlobalState]);

  const executeAiJob = useCallback(async (request: aiChatApiReq): Promise<aiChatApiRes> => {
    if (!globalConnector) {
      throw new Error('Connector not initialized');
    }

    if (!globalConnector.connected) {
      throw new Error('Not connected to server');
    }

  return new Promise<aiChatApiRes>((resolve, reject) => {
      const jobId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

      pendingJobsRef.current.set(jobId, { resolve, reject });

      try {
        globalConnector!.startAiJob({ ...request, jobId });
      } catch (error) {
        pendingJobsRef.current.delete(jobId);
        reject(error);
      }
    });
  }, []);

  const cancelJob = useCallback((jobId: string) => {
    const pending = pendingJobsRef.current.get(jobId);
    if (pending) {
      pending.reject(new Error('Job cancelled by user'));
      pendingJobsRef.current.delete(jobId);
    }
  }, []);

  const rollbackMessage = useCallback(async (request: rollbackMessageReq): Promise<rollbackMessageRes> => {
    console.log('🔗 [useAiChatApiConnector] rollbackMessage 호출:', request);

    if (!globalConnector) {
      const error = 'Connector not initialized';
      console.error('❌ [useAiChatApiConnector]', error);
      throw new Error(error);
    }

    if (!globalConnector.connected) {
      const error = 'Not connected to server';
      console.error('❌ [useAiChatApiConnector]', error);
      throw new Error(error);
    }

    console.log('📡 [useAiChatApiConnector] 웹소켓 연결 상태 확인 완료, 요청 전송 중...');

    return new Promise<rollbackMessageRes>((resolve, reject) => {
      // 응답 리스너 등록
      const handleResponse = (response: rollbackMessageRes) => {
        console.log('✅ [useAiChatApiConnector] 롤백 응답 받음:', response);
        globalConnector!.offRollbackMessageResponse(handleResponse);
        resolve(response);
      };

      // 에러 리스너 등록
      const handleError = (error: any) => {
        console.error('❌ [useAiChatApiConnector] 롤백 에러 받음:', error);
        globalConnector!.offRollbackMessageError(handleError);
        reject(new Error(error.message || 'Rollback failed'));
      };

      globalConnector!.onRollbackMessageResponse(handleResponse);
      globalConnector!.onRollbackMessageError(handleError);

      // 요청 전송
      console.log('📤 [useAiChatApiConnector] 웹소켓으로 rollback_message 이벤트 전송');
      globalConnector!.rollbackMessage(request);
    });
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    executeAiJob,
    cancelJob,
    rollbackMessage,
    connector: globalConnector,
  };
};
