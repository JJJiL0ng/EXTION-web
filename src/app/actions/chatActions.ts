'use server'

import { GoogleGenerativeAI } from '@google/generative-ai';

// Google AI API 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
      
      1. normal: 일반적인 대화, 보고서 작성, 또는 아래 3가지 모드에 해당하지 않는 모든 요청 (ex: "안녕", "데이터 요약해줘", "보고서 초안 만들어줘")
      2. function: 특정 데이터 범위에 대한 계산, 집계, 정렬 등 Excel 함수와 유사한 작업 요청. (ex: "A열의 총합 알려줘", "매출 상위 5개 제품 찾아줘", "데이터를 날짜순으로 정렬해줘", "특정 조건에 맞는 데이터 개수 세줘")
      3. datafix:  시트의 구조를 변경하거나 여러 데이터에 대한 일괄 수정, 추가, 삭제 작업 요청. (ex: "빈 행들을 모두 삭제해줘", "A열과 B열을 합쳐서 새 열을 만들어줘", "가격이 10000원 이상인 제품 정보만 남겨줘")
      4. artifact: 차트, 그래프 등 데이터 시각화 생성 요청. (ex: "월별 매출 추이를 막대그래프로 보여줘", "제품 카테고리별 판매량 파이차트 만들어줘")
      
      사용자의 핵심 의도를 파악하여, 가장 적합한 모드 하나를 영어 소문자로만 응답하세요. 다른 설명은 붙이지 마세요.
    `;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const gptResponse = response.text().trim().toLowerCase() ?? 'normal';
    
    console.log('GPT 응답:', gptResponse);

    // 키워드 기반 추가 판별: GPT가 artifact로 분류하지 못했을 때 보정
    const artifactKeywordRegex = /(시각화|그래프|chart|차트|plot|막대그래프|파이차트|bar chart|pie chart|line chart|scatter|산점도)/i;

    // 유효한 모드로 변환
    let mode: ChatMode = 'normal';
    const validModes: ChatMode[] = ['normal', 'function', 'datafix', 'artifact'];
    
    if (validModes.includes(gptResponse as ChatMode)) {
        mode = gptResponse as ChatMode;
    }

    // GPT 결과가 artifact가 아니지만, 메시지에 시각화 관련 키워드가 포함된 경우 artifact로 보정
    if (mode === 'normal' && artifactKeywordRegex.test(userMessage)) {
        console.log('🔍 시각화 키워드 감지 – 모드를 artifact로 보정합니다.');
        mode = 'artifact';
    }

    console.log('선택된 채팅 모드:', mode);

    return { mode };
  } catch (error) {
    console.error('채팅 모드 결정 중 오류 발생:', error);
    return { mode: 'normal' }; // 오류 발생시 기본값
  }
} 