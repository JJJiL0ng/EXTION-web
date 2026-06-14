export interface ParsedSSEEvent<TData = unknown> {
  type: string;
  data: TData;
}

export interface SSEParseResult<TData = unknown> {
  events: ParsedSSEEvent<TData>[];
  remainingBuffer: string;
}

function parseEventBlock(block: string): ParsedSSEEvent | null {
  const lines = block.split('\n');
  const eventLine = lines.find((line) => line.startsWith('event:'));
  const dataLines = lines.filter((line) => line.startsWith('data:'));

  if (!eventLine || dataLines.length === 0) {
    return null;
  }

  const type = eventLine.substring('event:'.length).trim();
  const rawData = dataLines
    .map((line) => line.substring('data:'.length).trim())
    .join('\n');

  try {
    return {
      type,
      data: JSON.parse(rawData),
    };
  } catch {
    return null;
  }
}

export function parseSSEBuffer(buffer: string): SSEParseResult {
  const normalizedBuffer = buffer.replace(/\r\n/g, '\n');
  const blocks = normalizedBuffer.split('\n\n');
  const hasCompleteTrailingBlock = normalizedBuffer.endsWith('\n\n');
  const remainingBuffer = hasCompleteTrailingBlock ? '' : blocks.pop() ?? '';

  return {
    events: blocks
      .map(parseEventBlock)
      .filter((event): event is ParsedSSEEvent => event !== null),
    remainingBuffer,
  };
}
