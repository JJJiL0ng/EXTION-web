import { useEffect, useRef, useCallback } from 'react';
import { AiChatApiConnector } from '@/_ApiConnector/ai-chat/aiChatApiConnector';
import { aiChatApiReq, aiChatApiRes } from "@/_types/ai-chat-api/aiChatApi.types";
import type { AiJobError, AiJobCancelled, AiJobTimeout } from '@/_ApiConnector/ai-chat/aiChatApiConnector';

interface UseAiChatApiConnectorOptions {
  serverUrl: string;
  autoConnect?: boolean;
}

export const useAiChatApiConnector = ({ serverUrl, autoConnect = true }: UseAiChatApiConnectorOptions) => {
  const connectorRef = useRef<AiChatApiConnector | null>(null);

  useEffect(() => {
    connectorRef.current = new AiChatApiConnector();

    if (autoConnect) {
      connectorRef.current.connect(serverUrl).catch(console.error);
    }

    return () => {
      if (connectorRef.current) {
        connectorRef.current.disconnect();
        connectorRef.current = null;
      }
    };
  }, [serverUrl, autoConnect]);

  const connect = useCallback(async (): Promise<void> => {
    if (!connectorRef.current) return;
    return connectorRef.current.connect(serverUrl);
  }, [serverUrl]);

  const disconnect = useCallback((): void => {
    if (!connectorRef.current) return;
    connectorRef.current.disconnect();
  }, []);

  const startAiJob = useCallback((request: aiChatApiReq): void => {
    if (!connectorRef.current) throw new Error('Connector not initialized');
    connectorRef.current.startAiJob(request);
  }, []);

  const acknowledgeTask = useCallback((jobId: string, feedback: 'SUCCESS' | 'FAILURE'): void => {
    if (!connectorRef.current) throw new Error('Connector not initialized');
    connectorRef.current.acknowledgeTask(jobId, feedback);
  }, []);

  const onJobPlanned = useCallback((callback: (data: aiChatApiRes) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onJobPlanned(callback);
  }, []);

  const onTasksExecuted = useCallback((callback: (data: aiChatApiRes) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onTasksExecuted(callback);
  }, []);

  const onJobError = useCallback((callback: (data: AiJobError) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onJobError(callback);
  }, []);

  const onJobCancelled = useCallback((callback: (data: AiJobCancelled) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onJobCancelled(callback);
  }, []);

  const onJobTimeout = useCallback((callback: (data: AiJobTimeout) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.onJobTimeout(callback);
  }, []);

  const offJobPlanned = useCallback((callback?: (data: aiChatApiRes) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offJobPlanned(callback);
  }, []);

  const offTasksExecuted = useCallback((callback?: (data: aiChatApiRes) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offTasksExecuted(callback);
  }, []);

  const offJobError = useCallback((callback?: (data: AiJobError) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offJobError(callback);
  }, []);

  const offJobCancelled = useCallback((callback?: (data: AiJobCancelled) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offJobCancelled(callback);
  }, []);

  const offJobTimeout = useCallback((callback?: (data: AiJobTimeout) => void): void => {
    if (!connectorRef.current) return;
    connectorRef.current.offJobTimeout(callback);
  }, []);

  const isConnected = connectorRef.current?.connected || false;

  return {
    connect,
    disconnect,
    startAiJob,
    acknowledgeTask,
    onJobPlanned,
    onTasksExecuted,
    onJobError,
    onJobCancelled,
    onJobTimeout,
    offJobPlanned,
    offTasksExecuted,
    offJobError,
    offJobCancelled,
    offJobTimeout,
    isConnected,
  };
};