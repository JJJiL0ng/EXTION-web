import { describe, expect, it } from 'vitest';
import { parseSSEBuffer } from './sseParser';

describe('parseSSEBuffer', () => {
  it('parses complete SSE event blocks', () => {
    expect(
      parseSSEBuffer('event: chat_started\ndata: {"chatId":"chat-1","messageId":"msg-1"}\n\n'),
    ).toEqual({
      events: [
        {
          type: 'chat_started',
          data: { chatId: 'chat-1', messageId: 'msg-1' },
        },
      ],
      remainingBuffer: '',
    });
  });

  it('keeps partial event blocks in the remaining buffer', () => {
    expect(
      parseSSEBuffer('event: chat_started\ndata: {"chatId":"chat-1"}\n\nevent: ai_update\ndata: {"progress":'),
    ).toEqual({
      events: [
        {
          type: 'chat_started',
          data: { chatId: 'chat-1' },
        },
      ],
      remainingBuffer: 'event: ai_update\ndata: {"progress":',
    });
  });

  it('parses multiple events and CRLF line endings', () => {
    expect(
      parseSSEBuffer(
        'event: ai_update\r\ndata: {"progress":50}\r\n\r\nevent: chat_completed\r\ndata: {"assistantMessageId":"a-1"}\r\n\r\n',
      ),
    ).toEqual({
      events: [
        {
          type: 'ai_update',
          data: { progress: 50 },
        },
        {
          type: 'chat_completed',
          data: { assistantMessageId: 'a-1' },
        },
      ],
      remainingBuffer: '',
    });
  });

  it('supports multi-line data payloads', () => {
    expect(
      parseSSEBuffer('event: chat_response\ndata: {"answer":\ndata: "hello"}\n\n'),
    ).toEqual({
      events: [
        {
          type: 'chat_response',
          data: { answer: 'hello' },
        },
      ],
      remainingBuffer: '',
    });
  });

  it('skips invalid JSON events without dropping later valid events', () => {
    expect(
      parseSSEBuffer('event: ai_update\ndata: invalid\n\nevent: error\ndata: {"error":"failed"}\n\n'),
    ).toEqual({
      events: [
        {
          type: 'error',
          data: { error: 'failed' },
        },
      ],
      remainingBuffer: '',
    });
  });
});
