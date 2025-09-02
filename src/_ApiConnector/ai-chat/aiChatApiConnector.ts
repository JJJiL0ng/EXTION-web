import { io, Socket } from 'socket.io-client';
import { aiChatApiReq, aiChatApiRes } from "@/_types/ai-chat-api/aiChatApi.types";

export interface AiJobError {
  jobId?: string;
  message: string;
  code: string;
  executionTime?: number;
  timestamp?: string;
}

export interface AiJobCancelled {
  jobId: string;
}

export interface AiJobTimeout {
  jobId: string;
  message: string;
}

export class AiChatApiConnector {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.socket = io(serverUrl, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  startAiJob(request: aiChatApiReq): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('start_ai_job', request);
  }

  acknowledgeTask(jobId: string, feedback: 'SUCCESS' | 'FAILURE'): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('acknowledge_task', { jobId, feedback });
  }

  onJobPlanned(callback: (data: aiChatApiRes) => void): void {
    if (!this.socket) return;
    this.socket.on('ai_job_planned', callback);
  }

  onTasksExecuted(callback: (data: aiChatApiRes) => void): void {
    if (!this.socket) return;
    this.socket.on('ai_tasks_executed', callback);
  }

  onJobError(callback: (data: AiJobError) => void): void {
    if (!this.socket) return;
    this.socket.on('ai_job_error', callback);
  }

  onJobCancelled(callback: (data: AiJobCancelled) => void): void {
    if (!this.socket) return;
    this.socket.on('ai_job_cancelled', callback);
  }

  onJobTimeout(callback: (data: AiJobTimeout) => void): void {
    if (!this.socket) return;
    this.socket.on('ai_job_timeout', callback);
  }

  offJobPlanned(callback?: (data: aiChatApiRes) => void): void {
    if (!this.socket) return;
    this.socket.off('ai_job_planned', callback);
  }

  offTasksExecuted(callback?: (data: aiChatApiRes) => void): void {
    if (!this.socket) return;
    this.socket.off('ai_tasks_executed', callback);
  }

  offJobError(callback?: (data: AiJobError) => void): void {
    if (!this.socket) return;
    this.socket.off('ai_job_error', callback);
  }

  offJobCancelled(callback?: (data: AiJobCancelled) => void): void {
    if (!this.socket) return;
    this.socket.off('ai_job_cancelled', callback);
  }

  offJobTimeout(callback?: (data: AiJobTimeout) => void): void {
    if (!this.socket) return;
    this.socket.off('ai_job_timeout', callback);
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

