# Frontend Step 10 - SpreadJS Runtime

## 목표

- SpreadJS 부가 모듈 로딩과 런타임 설정을 한 진입점으로 모은다.
- 여러 컴포넌트에 중복된 라이선스 문자열과 culture 설정을 제거한다.

## 변경 사항

- `src/shared/spreadjs/spreadRuntime.ts`를 추가해 SpreadJS IO, 한국어 리소스, 라이선스, culture 초기화를 담당하게 했다.
- 기존 `configureLicense`는 새 `configureSpreadRuntime`을 재사용하도록 변경했다.
- 메인 시트와 스키마 컨버터 시트의 중복 라이선스 초기화를 shared 런타임으로 교체했다.

## 검증

- `npm run test`
- `npm run lint`
- `npm run build`
