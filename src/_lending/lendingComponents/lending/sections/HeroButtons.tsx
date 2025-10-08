'use client'

import Image from 'next/image'
import { Button } from '@/_lending/lendingComponents/lending-common-ui/Button'
import { scrollToElement } from '@/_aaa_sheetChat/_utils/lending-utils/lending-utils'
import { useRouter } from 'next/navigation'
import { useGenerateSpreadSheetId } from '../../../../_aaa_sheetChat/_hooks/sheet/common/useGenerateSpreadSheetId'
import { useGenerateChatId } from '../../../../_aaa_sheetChat/_hooks/aiChat/useGenerateChatId';
import useChatStore from '@/_aaa_sheetChat/_store/chat/chatIdAndChatSessionIdStore'
import {useSpreadSheetVersionStore} from '@/_aaa_sheetChat/_store/sheet/spreadSheetVersionIdStore';
import Link from 'next/link'
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
  // spreadSheetId, chatId 생상
  const { generateSpreadSheetId } = useGenerateSpreadSheetId();
  const { generateChatId } = useGenerateChatId();

  // chatSessionId 초기화 
  const resetChatSessionId = useChatStore((state) => state.resetChatSessionId);
  const { resetSpreadSheetVersion, resetEditLockVersion } = useSpreadSheetVersionStore();




  // handleFileChange를 컴포넌트 내부로 이동
  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = event.target.files;
  //   if (files && files.length > 0) {
  //     const file = files[0];
  //     console.log('선택된 파일:', file.name, file.type, file.size);

  //     // 파일 유효성 검사
  //     const allowedTypes = [
  //       'application/vnd.ms-excel', // .xls
  //       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  //       'text/csv', // .csv
  //       'application/csv' // .csv (일부 브라우저)
  //     ];

  //     const fileExtension = file.name.toLowerCase().split('.').pop();
  //     const allowedExtensions = ['xls', 'xlsx', 'csv'];

  //     if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
  //       alert('지원되는 파일 형식이 아닙니다. Excel 파일(.xlsx, .xls) 또는 CSV 파일(.csv)만 업로드 가능합니다.');
  //       return;
  //     }

  //     // 파일 크기 제한 (예: 10MB)
  //     const maxSize = 10 * 1024 * 1024; // 10MB
  //     if (file.size > maxSize) {
  //       alert('파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.');
  //       return;
  //     }

  //     // 새 ID 생성 후 파일과 함께 스토어에 저장
  //     const spreadsheetId = generateSpreadSheetId();
  //     const chatId = generateChatId();

  //     resetChatSessionId(); // chatSessionId 초기화
  //     resetSpreadSheetVersion(); // spreadSheetVersionId 초기화
  //     resetEditLockVersion(); // editLockVersion 초기화

  //     // 디버깅: 초기화 후 로컬 스토리지 상태 확인 (약간의 지연 후)
  //     setTimeout(() => {
  //       console.log('Reset 후 로컬 스토리지 상태:', localStorage.getItem('spreadsheet-version-storage'));
  //       console.log('Reset 후 스토어 상태:', useSpreadSheetVersionStore.getState());
  //     }, 100);


  //     // 새 창에서 sheetchat 페이지 열기
  //     const url = `/sheetchat/${spreadsheetId}/${chatId}`;
  //     window.open(url, '_blank');

  //     console.log('파일 업로드 처리 완료:', file.name);
  //     console.log('새 창 URL:', url);
  //   }
  // };

  // 새로운 SpreadSheet ID와 Chat ID를 생성하여 동적 URL 만들기
  // const createNewSheetChatUrl = () => {
  //   const spreadsheetId = generateSpreadSheetId();
  //   const chatId = generateChatId();
  //   return `/sheetchat/${spreadsheetId}/${chatId}`;
  // };

  // 새 시트 생성 버튼 클릭 핸들러
  // const handleNewSheetClick = () => {
  //   // ID 생성 및 초기화
  //   resetChatSessionId(); // chatSessionId 초기화
  //   resetSpreadSheetVersion(); // spreadSheetVersionId 초기화
  //   resetEditLockVersion(); // editLockVersion 초기화

  //   // 디버깅 로그
  //   setTimeout(() => {
  //     console.log('handleNewSheetClick - Reset 후 로컬 스토리지:', localStorage.getItem('spreadsheet-version-storage'));
  //     console.log('handleNewSheetClick - Reset 후 스토어 상태:', useSpreadSheetVersionStore.getState());
  //   }, 100);

  //   // window.open(createNewSheetChatUrl(), '_blank');
    
  // };


  return (
    <div className="flex flex-row gap-2 sm:gap-4 lg:gap-6 justify-center items-center mb-8 lg:mb-12">
      <Link href="/invite-check">
        <Button
          variant="secondary"
          size="lg"
          className="text-white bg-[#005de9] hover:bg-blue-700 px-1 py-1 sm:px-2 sm:py-2 lg:px-2 lg:py-2 border-2 border-[#005de9] text-sm sm:text-base lg:text-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl rounded"
          // onClick={handleNewSheetClick}
        >
          <span className="flex items-center">
            Start for free
          </span>
        </Button>
      </Link>

      <Button
        variant="outline"
        size="lg"
        className="px-1 py-1 sm:px-2 sm:py-2 lg:px-2 lg:py-2 text-sm sm:text-base lg:text-xl border-2 hover:bg-blue-50 transition-all duration-200 rounded"
        onClick={() => {
          if (typeof window !== 'undefined') {
        window.open('https://discord.gg/4BS9TxG8MA', '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <span className="flex items-center gap-1.5 sm:gap-2">
          Discord
          <Image src="/discord.png" alt="Discord logo" width={20} height={20} className="inline-block sm:w-6 sm:h-6" />
        </span>
      </Button>
    </div >
  )
}