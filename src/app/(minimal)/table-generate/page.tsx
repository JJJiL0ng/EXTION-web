'use client';

import React, { useEffect } from 'react';
import { useUnifiedDataStore } from '@/stores/useUnifiedDataStore';
import { useRouter } from 'next/navigation';
import MainLoadingSpinner from '@/components/dashboard/MainLoadingSpinner';
import { transformToXLSXData } from '@/utils/spreadsheetUtils';

const TableGeneratePage = () => {
    const router = useRouter();
    const loading = useUnifiedDataStore((state) => state.loading);
    const error = useUnifiedDataStore((state) => state.error);
    const data = useUnifiedDataStore((state) => state.data);
    const progress = useUnifiedDataStore((state) => state.progress);
    const setXLSXData = useUnifiedDataStore((state) => state.setXLSXData);

    useEffect(() => {
        if (data && data.success && data.sheetMetaData) {
            console.log("TableGeneratePage: 데이터 수신 성공, 변환 및 저장 시작", data.sheetMetaData);
            
            // 1. 데이터 변환
            const xlsxData = transformToXLSXData(data.sheetMetaData);
            console.log("TableGeneratePage: 데이터 변환 완료", xlsxData);

            // 2. Zustand 스토어에 데이터 저장
            setXLSXData(xlsxData);
            console.log("TableGeneratePage: Zustand 스토어에 데이터 저장 완료");

            // 3. 스프레드시트 페이지로 이동
            router.push(`/sheetchat/${data.chatId}`);
        }
    }, [data, router, setXLSXData]);

    if (loading) {
        return (
           <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-8">
             {/* 메인 로딩 컨테이너 */}
             <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 max-w-md w-full backdrop-blur-sm">
               {/* 애니메이션 로딩 스피너 */}
               <div className="flex justify-center mb-6">
                 <div className="relative">
                   <div className="w-16 h-16 border-4 border-slate-200 rounded-full animate-spin border-t-[#005ed9]"></div>
                   <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-[#005ed9]/20"></div>
                 </div>
               </div>
               
               {/* 메인 텍스트 */}
               <div className="text-center mb-6">
                 <h2 className="text-xl font-semibold text-slate-800 mb-2">
                   테이블 생성 중
                 </h2>
                 <p className="text-slate-600 text-sm">
                   잠시만 기다려주세요...
                 </p>
               </div>
               
               {/* 프로그레스 바 */}
                {progress.total > 0 && (
                 <div className="space-y-3">
                   <div className="relative">
                     <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                       <div 
                         className="bg-gradient-to-r from-[#005ed9] to-[#0066ff] h-2 rounded-full transition-all duration-500 ease-out relative"
                         style={{ width: `${progress.percentage}%` }}
                       >
                         {/* 프로그레스 바 애니메이션 효과 */}
                         <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-600">
                       {progress.loaded}/{progress.total} 완료
                     </span>
                     <span className="font-medium text-[#005ed9]">
                       {progress.percentage}%
                     </span>
                   </div>
                 </div>
                )}
             </div>
             
             {/* 하단 서브 텍스트 */}
             <p className="text-slate-500 text-sm mt-6 text-center max-w-sm">
               데이터를 안전하게 처리하고 있습니다
             </p>
           </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-4 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">테이블 생성 오류</h2>
                <p className="bg-red-100 text-red-800 p-4 rounded-md max-w-lg">{error}</p>
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    대시보드로 돌아가기
                </button>
            </div>
        );
    }
    
    if (data && !data.success) {
         return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-4 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">테이블 생성 실패</h2>
                <p className="bg-red-100 text-red-800 p-4 rounded-md max-w-lg">{data.error || data.message || '알 수 없는 서버 오류가 발생했습니다.'}</p>
                 <button 
                    onClick={() => router.push('/dashboard')}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    대시보드로 돌아가기
                </button>
            </div>
        );
    }

    // 사용자가 이 페이지에 직접 접속했고, 로딩/에러/성공 상태가 아닌 경우
    if (!loading && !error && !data) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-4 text-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">진행중인 테이블 생성 작업이 없습니다</h2>
                <p className="text-gray-600">먼저 대시보드에서 요청을 시작해주세요.</p>
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    대시보드로 돌아가기
                </button>
            </div>
        );
    }

    // 로딩, 에러, 성공 후 리디렉션 대기 상태에서는 아무것도 렌더링하지 않거나 로딩 인디케이터를 보여줄 수 있습니다.
    // 여기서는 기본 로딩 화면을 재사용합니다.
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
            <MainLoadingSpinner />
            <p className="mt-4 text-gray-600">상태를 확인 중입니다...</p>
        </div>
    );
};

export default TableGeneratePage;
