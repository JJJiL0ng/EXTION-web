'use server'

import { OpenAI } from 'openai';

// OpenAI API 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 채팅 모드 타입 정의
export type ChatMode = 'normal' | 'formula' | 'datageneration' | 'artifact';

// 사용자 의도에 따라 채팅 모드를 결정하는 함수
export async function determineChatMode(
  userMessage: string
): Promise<{ mode: ChatMode }> {
  try {
    const systemPrompt = `
      당신은 사용자 메시지를 분석하여 적절한 처리 모드를 결정하는 어시스턴트입니다.
      
      주어진 메시지의 의도를 다음 4가지 모드 중 하나로 분류하세요:
      
      1. normal: 일반적인 대화나 질문
      2. formula: 스프레드시트 함수 생성이나 수식 관련 요청
      3. datageneration: 데이터 생성이나 수정 요청
      4. artifact: 데이터 분석이나 시각화 관련 요청
      
      반드시 위의 4가지 모드 중 하나만 단어로 응답하세요.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 10 // 짧은 응답만 필요
    });

    // GPT 응답에서 모드 추출
    const gptResponse = response.choices[0].message.content?.trim().toLowerCase() ?? 'normal';
    
    // 유효한 모드로 변환
    let mode: ChatMode = 'normal';
    
    if (gptResponse.includes('formula')) {
      mode = 'formula';
    } else if (gptResponse.includes('datageneration')) {
      mode = 'datageneration';
    } else if (gptResponse.includes('artifact')) {
      mode = 'artifact';
    }

    return { mode };
  } catch (error) {
    console.error('채팅 모드 결정 중 오류 발생:', error);
    return { mode: 'normal' }; // 오류 발생시 기본값
  }
} 