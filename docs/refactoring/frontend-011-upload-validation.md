# Frontend Step 11 - Upload Validation

## 목표

- 파일 업로드 검증 로직을 훅 내부에서 분리해 순수 함수로 테스트한다.
- 업로드 input accept 값과 실제 허용 확장자 기준을 맞춘다.

## 변경 사항

- `fileUploadValidation` 유틸을 추가해 파일 크기, 확장자, MIME 검증을 담당하게 했다.
- `useFileUpload`는 새 유틸을 호출하도록 변경했다.
- `useFileUploadIntegration`의 허용 확장자를 공용 기본값으로 교체해 `.sjs` 입력 허용과 실제 검증을 맞췄다.
- 파일 확장자, 크기, MIME 검증 테스트를 추가했다.

## 검증

- `npm run test`
- `npm run lint`
- `npm run build`
