# AiChatApiConnector 사용 가이드

## 기본 사용법

### 1. 커넥터 인스턴스 생성 및 연결

```typescript
import { AiChatApiConnector } from '@/_ApiConnector/ai-chat/aiChatApiConnector';

const useAiChat = () => {
  const [connector] = useState(() => new AiChatApiConnector());
  const [isConnected, setIsConnected] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  // 연결
  const connect = async () => {
    try {
      await connector.connect('ws://localhost:3001');
      setIsConnected(true);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  // 연결 해제
  const disconnect = () => {
    connector.disconnect();
    setIsConnected(false);
  };

  return { connector, isConnected, connect, disconnect, jobId, setJobId };
};
```

### 2. 이벤트 리스너 설정

```typescript
useEffect(() => {
  if (!connector || !isConnected) return;

  // 작업 계획 수신
  const handleJobPlanned = (data: aiChatApiRes) => {
    setJobId(data.jobId);
    console.log('Job planned:', data.taskManagerOutput);
    
    // agent 모드가 아닌 경우 사용자 확인 후 진행
    if (chatMode === 'edit') {
      // UI에서 사용자 확인 받기
      showPlanConfirmation(data.taskManagerOutput);
    }
  };

  // 작업 실행 완료 수신
  const handleTasksExecuted = (data: aiChatApiRes) => {
    console.log('Tasks executed:', data.dataEditChatRes);
    
    // 스프레드시트에 명령어 적용
    applyDataEditCommands(data.dataEditChatRes.dataEditCommands);
    
    // 작업 완료 처리
    setJobId(null);
  };

  // 에러 처리
  const handleJobError = (error: AiJobError) => {
    console.error('Job error:', error);
    showErrorMessage(error.message);
    setJobId(null);
  };

  // 작업 취소
  const handleJobCancelled = (data: AiJobCancelled) => {
    console.log('Job cancelled:', data.jobId);
    setJobId(null);
  };

  // 타임아웃
  const handleJobTimeout = (data: AiJobTimeout) => {
    console.log('Job timeout:', data.jobId);
    showTimeoutMessage();
    setJobId(null);
  };

  // 이벤트 리스너 등록
  connector.onJobPlanned(handleJobPlanned);
  connector.onTasksExecuted(handleTasksExecuted);
  connector.onJobError(handleJobError);
  connector.onJobCancelled(handleJobCancelled);
  connector.onJobTimeout(handleJobTimeout);

  // 클린업
  return () => {
    connector.offJobPlanned(handleJobPlanned);
    connector.offTasksExecuted(handleTasksExecuted);
    connector.offJobError(handleJobError);
    connector.offJobCancelled(handleJobCancelled);
    connector.offJobTimeout(handleJobTimeout);
  };
}, [connector, isConnected, chatMode]);
```

### 3. AI 작업 시작

```typescript
const startAiJob = (userMessage: string) => {
  if (!connector || !isConnected) {
    console.error('Not connected to server');
    return;
  }

  const request: aiChatApiReq = {
    websocketClientId: connector.socket?.id || 'unknown',
    spreadsheetId: currentSpreadsheetId,
    chatId: currentChatId,
    userId: currentUserId,
    chatMode: 'agent', // 또는 'edit'
    userQuestionMessage: userMessage,
    parsedSheetNames: selectedSheetNames,
  };

  connector.startAiJob(request);
};
```

### 4. 작업 확인/취소 (edit 모드에서)

```typescript
const confirmTask = () => {
  if (jobId) {
    connector.acknowledgeTask(jobId, 'SUCCESS');
  }
};

const cancelTask = () => {
  if (jobId) {
    connector.acknowledgeTask(jobId, 'FAILURE');
  }
};
```

## 완전한 훅 예시

```typescript
import { useState, useEffect, useCallback } from 'react';
import { AiChatApiConnector, AiJobError } from '@/_ApiConnector/ai-chat/aiChatApiConnector';
import { aiChatApiReq, aiChatApiRes } from '@/_types/ai-chat-api/aiChatApi.types';

export const useAiChatWebSocket = (serverUrl: string = 'ws://localhost:3001') => {
  const [connector] = useState(() => new AiChatApiConnector());
  const [isConnected, setIsConnected] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 연결
  const connect = useCallback(async () => {
    try {
      setError(null);
      await connector.connect(serverUrl);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [connector, serverUrl]);

  // 연결 해제
  const disconnect = useCallback(() => {
    connector.disconnect();
    setIsConnected(false);
    setJobId(null);
    setIsLoading(false);
  }, [connector]);

  // AI 작업 시작
  const startAiJob = useCallback((request: aiChatApiReq) => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    connector.startAiJob(request);
  }, [connector, isConnected]);

  // 작업 확인/취소
  const acknowledgeTask = useCallback((feedback: 'SUCCESS' | 'FAILURE') => {
    if (jobId) {
      connector.acknowledgeTask(jobId, feedback);
      if (feedback === 'FAILURE') {
        setJobId(null);
        setIsLoading(false);
      }
    }
  }, [connector, jobId]);

  // 이벤트 핸들러들
  useEffect(() => {
    if (!isConnected) return;

    const handleJobPlanned = (data: aiChatApiRes) => {
      setJobId(data.jobId);
      setIsLoading(false);
      // 계획 수신 이벤트 발생
    };

    const handleTasksExecuted = (data: aiChatApiRes) => {
      setJobId(null);
      setIsLoading(false);
      // 실행 완료 이벤트 발생
    };

    const handleJobError = (error: AiJobError) => {
      setError(error.message);
      setJobId(null);
      setIsLoading(false);
    };

    const handleJobCancelled = () => {
      setJobId(null);
      setIsLoading(false);
    };

    const handleJobTimeout = () => {
      setError('Job timeout');
      setJobId(null);
      setIsLoading(false);
    };

    // 리스너 등록
    connector.onJobPlanned(handleJobPlanned);
    connector.onTasksExecuted(handleTasksExecuted);
    connector.onJobError(handleJobError);
    connector.onJobCancelled(handleJobCancelled);
    connector.onJobTimeout(handleJobTimeout);

    return () => {
      connector.offJobPlanned(handleJobPlanned);
      connector.offTasksExecuted(handleTasksExecuted);
      connector.offJobError(handleJobError);
      connector.offJobCancelled(handleJobCancelled);
      connector.offJobTimeout(handleJobTimeout);
    };
  }, [connector, isConnected]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // 상태
    isConnected,
    jobId,
    isLoading,
    error,
    
    // 메서드
    connect,
    disconnect,
    startAiJob,
    acknowledgeTask,
    
    // 연결 상태 확인
    connected: connector.connected,
  };
};
```

## 사용 예시 (컴포넌트에서)

```typescript
const ChatComponent = () => {
  const {
    isConnected,
    jobId,
    isLoading,
    error,
    connect,
    disconnect,
    startAiJob,
    acknowledgeTask,
  } = useAiChatWebSocket();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleSendMessage = (message: string) => {
    const request: aiChatApiReq = {
      websocketClientId: 'client-id',
      spreadsheetId: 'sheet-1',
      chatId: 'chat-1',
      userId: 'user-1',
      chatMode: 'agent',
      userQuestionMessage: message,
      parsedSheetNames: [],
    };

    startAiJob(request);
  };

  return (
    <div>
      {!isConnected && <div>연결 중...</div>}
      {error && <div>에러: {error}</div>}
      {isLoading && <div>AI 작업 중...</div>}
      {jobId && <div>작업 ID: {jobId}</div>}
      
      <button 
        onClick={() => handleSendMessage('데이터 분석해줘')}
        disabled={!isConnected || isLoading}
      >
        메시지 전송
      </button>
      
      {jobId && (
        <div>
          <button onClick={() => acknowledgeTask('SUCCESS')}>확인</button>
          <button onClick={() => acknowledgeTask('FAILURE')}>취소</button>
        </div>
      )}
    </div>
  );
};
```

## 주요 포인트

1. **연결 관리**: 컴포넌트 마운트/언마운트 시 자동 연결/해제
2. **에러 처리**: 연결 실패, 작업 에러, 타임아웃 등 모든 케이스 처리
3. **상태 관리**: 연결 상태, 작업 상태, 로딩 상태 등 실시간 추적
4. **메모리 누수 방지**: useCallback과 적절한 cleanup으로 메모리 누수 방지
5. **타입 안전성**: 모든 데이터에 TypeScript 타입 적용