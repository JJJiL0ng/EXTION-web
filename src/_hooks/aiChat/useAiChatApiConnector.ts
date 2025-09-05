import { useState, useRef, useCallback, useEffect } from 'react';
import { AiChatApiConnector } from '@/_ApiConnector/ai-chat/aiChatApiConnector';
import { aiChatApiReq, aiChatApiRes } from "@/_types/ai-chat-api/aiChatApi.types";

interface UseAiChatApiConnectorReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connect: (serverUrl: string) => Promise<void>;
  disconnect: () => void;
  executeAiJob: (request: aiChatApiReq) => Promise<aiChatApiRes>;
  cancelJob: (jobId: string) => void;
}

export const useAiChatApiConnector = (): UseAiChatApiConnectorReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const connectorRef = useRef<AiChatApiConnector | null>(null);
  const pendingJobsRef = useRef<Map<string, {
    resolve: (value: aiChatApiRes) => void;
    reject: (reason: any) => void;
    plan?: any;
  }>>(new Map());

  const connect = useCallback(async (serverUrl: string) => {
    console.log('🔌 [useAiChatApiConnector] Connect called with:', serverUrl);
    
    if (!connectorRef.current) {
      console.log('🔌 [useAiChatApiConnector] Creating new connector');
      connectorRef.current = new AiChatApiConnector();
    }

    if (connectorRef.current.connected) {
      console.log('🔌 [useAiChatApiConnector] Already connected, skipping');
      return;
    }

    console.log('🔌 [useAiChatApiConnector] Starting connection process');
    setIsConnecting(true);
    try {
      await connectorRef.current.connect(serverUrl);
      console.log('✅ [useAiChatApiConnector] Connector connected successfully');
      setIsConnected(true);

      // 이벤트 리스너 설정
      connectorRef.current.onJobPlanned((data) => {
        const pending = pendingJobsRef.current.get(data.jobId);
        if (pending) {
          pending.plan = data.plan;
        }
      });

      connectorRef.current.onTasksExecuted((data) => {
        const pending = pendingJobsRef.current.get(data.jobId);
        if (pending) {
          // aiChatApiRes 형태로 반환
          pending.resolve({
            jobId: data.jobId,
            taskManagerOutput: pending.plan,
            dataEditChatRes: data.dataEditChatRes,
          });
          pendingJobsRef.current.delete(data.jobId);
        }
      });

      connectorRef.current.onJobError((data) => {
        const pending = pendingJobsRef.current.get(data.jobId || '');
        if (pending) {
          pending.reject(new Error(data.message));
          if (data.jobId) {
            pendingJobsRef.current.delete(data.jobId);
          }
        }
      });

      connectorRef.current.onJobCancelled((data) => {
        const pending = pendingJobsRef.current.get(data.jobId);
        if (pending) {
          pending.reject(new Error('Job was cancelled'));
          pendingJobsRef.current.delete(data.jobId);
        }
      });

      connectorRef.current.onJobTimeout((data) => {
        const pending = pendingJobsRef.current.get(data.jobId);
        if (pending) {
          pending.reject(new Error(data.message));
          pendingJobsRef.current.delete(data.jobId);
        }
      });

    } catch (error) {
      console.error('❌ [useAiChatApiConnector] Connection failed:', error);
      setIsConnected(false);
      throw error;
    } finally {
      console.log('🏁 [useAiChatApiConnector] Connection process finished');
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (connectorRef.current) {
      connectorRef.current.disconnect();
      setIsConnected(false);
    }
    // 모든 pending job들을 reject
    pendingJobsRef.current.forEach((pending) => {
      pending.reject(new Error('Connection closed'));
    });
    pendingJobsRef.current.clear();
  }, []);

  const executeAiJob = useCallback(async (request: aiChatApiReq): Promise<aiChatApiRes> => {
    if (!connectorRef.current) {
      throw new Error('Connector not initialized');
    }

    if (!connectorRef.current.connected) {
      throw new Error('Not connected to server');
    }

  return new Promise<aiChatApiRes>((resolve, reject) => {
      const jobId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      
      pendingJobsRef.current.set(jobId, { resolve, reject });
      
      try {
        connectorRef.current!.startAiJob({ ...request, jobId });
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
  };
};
