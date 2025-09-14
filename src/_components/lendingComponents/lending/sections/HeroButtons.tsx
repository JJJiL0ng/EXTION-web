'use client'

import { Button } from '@/_components/lendingComponents/lending-common-ui/Button'
import { scrollToElement } from '@/_utils/lending-utils/lending-utils'
import { useRouter } from 'next/navigation'
import { useGenerateSpreadSheetId } from '../../../../_hooks/sheet/common/useGenerateSpreadSheetId'
import { useGenerateChatId } from '../../../../_hooks/aiChat/useGenerateChatId';
// 클라이언트에서만 실행되는 인터랙티브 버튼들
export function HeroButtons() {
  const router = useRouter()

  const handleCTAClick = () => {
    router.push('/dashboard')

    // 이벤트 트래킹
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', {
        event_category: 'engagement',
        event_label: 'hero_beta_signup',
        value: 1
      })
    }
  }

  const handleDemoClick = () => {
    scrollToElement('demo-video', 80)

    // 이벤트 트래킹
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'demo_click', {
        event_category: 'engagement',
        event_label: 'hero_demo_video',
        value: 1
      })
    }
  }
  const { generateSpreadSheetId } = useGenerateSpreadSheetId();
  const { generateChatId } = useGenerateChatId();

  // handleFileChange를 컴포넌트 내부로 이동
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('선택된 파일:', file.name, file.type, file.size);

      // 파일 유효성 검사
      const allowedTypes = [
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/csv', // .csv
        'application/csv' // .csv (일부 브라우저)
      ];

      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['xls', 'xlsx', 'csv'];

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
        alert('지원되는 파일 형식이 아닙니다. Excel 파일(.xlsx, .xls) 또는 CSV 파일(.csv)만 업로드 가능합니다.');
        return;
      }

      // 파일 크기 제한 (예: 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.');
        return;
      }

      // 새 ID 생성 후 파일과 함께 스토어에 저장
      const spreadsheetId = generateSpreadSheetId();
      const chatId = generateChatId();

      // 새 창에서 sheetchat 페이지 열기
      const url = `/sheetchat/${spreadsheetId}/${chatId}`;
      window.open(url, '_blank');

      console.log('파일 업로드 처리 완료:', file.name);
      console.log('새 창 URL:', url);
    }
  };

  // 새로운 SpreadSheet ID와 Chat ID를 생성하여 동적 URL 만들기
  const createNewSheetChatUrl = () => {
    const spreadsheetId = generateSpreadSheetId();
    const chatId = generateChatId();
    return `/sheetchat/${spreadsheetId}/${chatId}`;
  };

  // 새 시트 생성 버튼 클릭 핸들러
  const handleNewSheetClick = () => {
    window.open(createNewSheetChatUrl(), '_blank');
  };

  return (
    <div className="flex flex-row gap-4 sm:gap-6 justify-center items-center mb-8 lg:mb-12">
      <Button
        variant="secondary"
        size="lg"
        className="text-white bg-[#005de9] hover:bg-blue-700 px-2 py-2 border-2 border-[#005de9] text-lg lg:text-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl w-[150px] sm:w-[160px] rounded-full"
        onClick={handleNewSheetClick}
      >
        <span className="flex items-center gap-2">
          start for free
          {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg> */}
        </span>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="px-2 py-2 text-lg lg:text-xl border-2 hover:bg-blue-50 transition-all duration-200 w-[150px] sm:w-[160px] rounded-full"
        onClick={handleNewSheetClick}
      >
        <span className="flex items-center gap-2">
          demo
        </span>
      </Button>
    </div >
  )
}