'use server'

import { OpenAI } from 'openai';

// OpenAI API 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 채팅 모드 타입 정의
export type ChatMode = 'normal' | 'function' | 'datafix' | 'artifact';

// 사용자 의도에 따라 채팅 모드를 결정하는 함수
export async function determineChatMode(
  userMessage: string
): Promise<{ mode: ChatMode }> {
  try {
    const systemPrompt = `
      당신은 사용자 메시지를 분석하여 적절한 처리 모드를 결정하는 어시스턴트입니다.
      
      주어진 메시지의 의도를 다음 4가지 모드 중 하나로 분류하세요:
      
      1. normal: 일반적인 대화나 간단한 질문(ex: 안녕, 데이터 분석 어떻게 해야 할지 모르겠어요,보고서 써주세요)
      2. function: 데이터 처리 함수 요청, 기존 액셀에서 함수를 사용해서 하던 작업들(ex: 데이터 평균, 총합, 오름차순 정렬, 중복 제거, 특정 값 수정, 데이터 삭제)
      3. datafix:  전체 데이터의 변환이나 수정(ex: 데이터 삭제, 데이터 구조 수정, 데이터 변환, 전체 데이터 수정, 데이터 추가)
      4. artifact: 데이터 시각화 관련 요청(ex: 시트 데이터 시각화, 데이터 트렌드 시각화 자료)
      
      반드시 위의 3가지 모드 중 하나만 단어로 응답하세요.
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
    
    console.log('GPT 응답:', gptResponse);

    // 유효한 모드로 변환
    let mode: ChatMode = 'normal';
    
    if (gptResponse.includes('function')) {
      mode = 'function';
    } else if (gptResponse.includes('datafix')) {
      mode = 'datafix';
    } else if (gptResponse.includes('artifact')) {
      mode = 'artifact';
    }

    return { mode };
  } catch (error) {
    console.error('채팅 모드 결정 중 오류 발생:', error);
    return { mode: 'normal' }; // 오류 발생시 기본값
  }
} 