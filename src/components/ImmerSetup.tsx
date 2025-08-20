"use client";

import { enableMapSet } from 'immer';
import { useEffect } from 'react';

// Immer MapSet 플러그인을 활성화하는 컴포넌트
export default function ImmerSetup() {
  useEffect(() => {
    // 애플리케이션 시작 시 Immer MapSet 플러그인 활성화
    enableMapSet();
    console.log('✅ Immer MapSet 플러그인 활성화됨');
  }, []);

  return null; // UI를 렌더링하지 않음
}
