// "use client";
// import '@mescius/spread-sheets-resources-ko';
// import '@mescius/spread-sheets-io';
// import React, { useState, useRef, useEffect, useCallback } from "react";
// import { SpreadSheets, Worksheet, Column } from "@mescius/spread-sheets-react";
// import * as GC from "@mescius/spread-sheets";
// import { useSheetRender } from '../../_hooks/sheet/useSheetRender'; // 훅 import

// // SpreadJS 라이선싱
// // var SpreadJSKey = "xxx";          // 라이선스 키 입력
// // GC.Spread.Sheets.LicenseKey = SpreadJSKey;
// GC.Spread.Common.CultureManager.culture("ko-kr");

// export default function SpreadSheet() {
//     const [hostStyle, setHostStyle] = useState({
//         width: '100vw',
//         height: 'calc(100vh - 24px)', // 상단 바 높이(24px)를 제외한 전체 화면
//         minWidth: '100%',
//         boxSizing: 'border-box' as const,
//     });

//     // SpreadJS 인스턴스 참조
//     const spreadRef = useRef<any>(null);

//     // useSheetRender 훅 사용
//     const { renderState, renderFile, resetState } = useSheetRender({
//         maxDirectLoadSize: 10 * 1024 * 1024, // 10MB
//         onSuccess: (fileName) => {
//             console.log(`✅ 파일 렌더링 성공: ${fileName}`);
//             alert(`${fileName} 파일이 성공적으로 업로드되었습니다.`);
//         },
//         onError: (error, fileName) => {
//             console.error(`❌ 파일 렌더링 실패: ${fileName}`, error);
//             alert(`파일 업로드 중 오류가 발생했습니다: ${error.message}`);
//         }
//     });

//     // 메모리 관리를 위한 cleanup 함수
//     const cleanup = useCallback(() => {
//         if (spreadRef.current) {
//             try {
//                 spreadRef.current.destroy && spreadRef.current.destroy();
//             } catch (error) {
//                 console.warn('Cleanup warning:', error);
//             }
//         }
//     }, []);

//     // 컴포넌트 언마운트 시 정리
//     useEffect(() => {
//         return () => {
//             cleanup();
//         };
//     }, [cleanup]);

//     // 화면 크기 변경 시 SpreadJS 크기 조정
//     useEffect(() => {
//         const handleResize = () => {
//             setHostStyle({
//                 width: '100vw',
//                 height: 'calc(100vh - 24px)',
//                 minWidth: '100%',
//                 boxSizing: 'border-box' as const,
//             });
            
//             // SpreadJS 인스턴스가 있으면 리사이즈
//             if (spreadRef.current) {
//                 setTimeout(() => {
//                     spreadRef.current.refresh();
//                 }, 100);
//             }
//         };

//         window.addEventListener('resize', handleResize);
//         return () => window.removeEventListener('resize', handleResize);
//     }, []);

//     const initSpread = function (spread: any) {
//         try {
//             // SpreadJS 인스턴스 저장
//             spreadRef.current = spread;

//             // 성능 최적화 설정
//             configurePerformanceSettings(spread);

//             // 기본 시트 설정 - 성능 최적화된 크기
//             const sheet = spread.getActiveSheet();
//             sheet.setRowCount(100);  // 기본 100행
//             sheet.setColumnCount(26); // 기본 26열

//             // 가상화 및 성능 설정
//             sheet.suspendPaint();

//             try {
//                 // 기본 데이터 설정
//                 setupDefaultData(sheet);
//                 setupDefaultStyles(sheet);
//             } finally {
//                 sheet.resumePaint();
//             }

//             console.log('✅ SpreadJS 초기화 완료 - 최적화된 설정 적용');

//         } catch (error) {
//             console.error('❌ SpreadJS 초기화 실패:', error);
//         }
//     };

//     // 성능 최적화 설정
//     const configurePerformanceSettings = (spread: any) => {
//         try {
//             const options = spread.options;
//             options.calcOnDemand = true;
//             options.allowUserResize = true;
//             options.allowUserDragDrop = false;
//             options.allowUserDragFill = true;
//             options.scrollIgnoreHidden = true;
//             options.scrollByPixel = false;
//             options.referenceStyle = GC.Spread.Sheets.ReferenceStyle.a1;

//             spread.getHost().style.overflow = 'auto';
//             spread.getHost().style.rowHeaderVisible = true;
//             spread.getHost().style.colHeaderVisible = true;

//             console.log('🔧 성능 최적화 설정 완료');
//         } catch (error) {
//             console.warn('⚠️ 성능 설정 경고:', error);
//         }
//     };

//     // 기본 데이터 설정
//     const setupDefaultData = (sheet: any) => {
//         sheet.setValue(1, 1, "");
//     };

//     // 기본 스타일 설정
//     const setupDefaultStyles = (sheet: any) => {
//         sheet.setColumnWidth(1, 200);
//         sheet.setColumnWidth(2, 200);
//     };

//     // 파일 업로드 핸들러 (간소화됨)
//     const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;

//         // 훅을 사용하여 파일 렌더링
//         await renderFile(file, spreadRef.current);

//         // 파일 입력 초기화
//         event.target.value = '';
//     };

//     // 새 스프레드시트 생성 (최적화됨)
//     const handleNewSpreadsheet = () => {
//         if (spreadRef.current) {
//             try {
//                 spreadRef.current.clearSheets();
//                 spreadRef.current.addSheet(0);
//                 const sheet = spreadRef.current.getActiveSheet();
//                 sheet.name("Sheet1");

//                 // 새 시트에 최적화 설정 적용
//                 sheet.setRowCount(100);
//                 sheet.setColumnCount(26);
//                 configurePerformanceSettings(spreadRef.current);

//                 // 렌더링 상태 초기화
//                 resetState();
//                 console.log('✅ 새 스프레드시트 생성 완료 (최적화됨)');
//             } catch (error) {
//                 console.error('❌ 새 스프레드시트 생성 실패:', error);
//             }
//         }
//     };

//     // 엑셀 파일로 다운로드
//     const handleDownloadExcel = () => {
//         if (spreadRef.current) {
//             const fileName = renderState.fileName
//                 ? renderState.fileName.replace(/\.[^/.]+$/, '.xlsx')
//                 : 'spreadsheet.xlsx';

//             const exportOptions = {
//                 fileType: GC.Spread.Sheets.FileType.excel,
//                 includeStyles: true,
//                 includeFormulas: true
//             };

//             console.log('📄 Excel 다운로드 시작:', fileName);

//             spreadRef.current.export(
//                 (blob: Blob) => {
//                     const url = URL.createObjectURL(blob);
//                     const link = document.createElement('a');
//                     link.href = url;
//                     link.download = fileName;
//                     link.style.display = 'none';
//                     document.body.appendChild(link);
//                     link.click();
//                     document.body.removeChild(link);
//                     URL.revokeObjectURL(url);
//                     console.log('✅ 엑셀 파일 다운로드 완료:', fileName);
//                 },
//                 (error: any) => {
//                     console.error('❌ Excel 다운로드 실패:', error);
//                     alert('Excel 파일 다운로드 중 오류가 발생했습니다.');
//                 },
//                 exportOptions
//             );
//         }
//     };

//     // CSV 파일로 다운로드
//     const handleDownloadCSV = () => {
//         if (spreadRef.current) {
//             const fileName = renderState.fileName
//                 ? renderState.fileName.replace(/\.[^/.]+$/, '.csv')
//                 : 'spreadsheet.csv';

//             const exportOptions = {
//                 fileType: GC.Spread.Sheets.FileType.csv
//             };

//             console.log('📄 CSV 다운로드 시작:', fileName);

//             spreadRef.current.export(
//                 (blob: Blob) => {
//                     const url = URL.createObjectURL(blob);
//                     const link = document.createElement('a');
//                     link.href = url;
//                     link.download = fileName;
//                     link.style.display = 'none';
//                     document.body.appendChild(link);
//                     link.click();
//                     document.body.removeChild(link);
//                     URL.revokeObjectURL(url);
//                     console.log('✅ CSV 파일 다운로드 완료:', fileName);
//                 },
//                 (error: any) => {
//                     console.error('❌ CSV 다운로드 실패:', error);
//                     alert('CSV 파일 다운로드 중 오류가 발생했습니다.');
//                 },
//                 exportOptions
//             );
//         }
//     };

//     // SJS 파일로 다운로드
//     const handleDownloadSJS = () => {
//         if (spreadRef.current) {
//             const fileName = renderState.fileName
//                 ? renderState.fileName.replace(/\.[^/.]+$/, '.sjs')
//                 : 'spreadsheet.sjs';

//             try {
//                 console.log('📄 SJS 다운로드 시작:', fileName);

//                 const jsonData = spreadRef.current.toJSON();
//                 const jsonString = JSON.stringify(jsonData, null, 2);
//                 const blob = new Blob([jsonString], { type: 'application/sjs' });

//                 const url = URL.createObjectURL(blob);
//                 const link = document.createElement('a');
//                 link.href = url;
//                 link.download = fileName;
//                 link.style.display = 'none';
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//                 URL.revokeObjectURL(url);
//                 console.log('✅ SJS 파일 다운로드 완료:', fileName);
//             } catch (error) {
//                 console.error('❌ SJS 다운로드 실패:', error);
//                 alert('SJS 파일 다운로드 중 오류가 발생했습니다.');
//             }
//         }
//     };

//     // 일반 JSON 파일로 다운로드
//     const handleDownloadJSON = () => {
//         if (spreadRef.current) {
//             const fileName = renderState.fileName
//                 ? renderState.fileName.replace(/\.[^/.]+$/, '.json')
//                 : 'spreadsheet.json';

//             try {
//                 const jsonData = spreadRef.current.toJSON({
//                     includeBindingSource: true,
//                     ignoreFormula: false,
//                     ignoreStyle: false,
//                     saveAsView: true,
//                     rowHeadersAsFrozenColumns: true,
//                     columnHeadersAsFrozenRows: true,
//                     includeAutoMergedCells: true,
//                     saveR1C1Formula: true,
//                     includeUnsupportedFormula: true,
//                     includeUnsupportedStyle: true
//                 });

//                 const jsonString = JSON.stringify(jsonData, null, 2);
//                 const blob = new Blob([jsonString], { type: 'application/json' });

//                 const url = URL.createObjectURL(blob);
//                 const link = document.createElement('a');
//                 link.href = url;
//                 link.download = fileName;
//                 link.style.display = 'none';
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//                 URL.revokeObjectURL(url);
//                 console.log('✅ 일반 JSON 파일 다운로드 완료:', fileName);
//             } catch (error) {
//                 console.error('❌ 일반 JSON 다운로드 실패:', error);
//                 alert('JSON 파일 다운로드 중 오류가 발생했습니다.');
//             }
//         }
//     };

//     return (
//         <div className="w-full h-screen box-border flex flex-col">
//             {/* 구글 스프레드시트 스타일 상단 바 */}
//             <div className="flex-shrink-0">
//                 <div className="w-full h-6 bg-white border-b border-gray-200 flex items-center px-4 box-border">
//                     <div className="flex items-center space-x-6">
//                         {/* 홈으로 가기 */}
//                         <button
//                             onClick={() => window.location.href = '/dashboard'}
//                             className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
//                         >
//                             홈
//                         </button>

//                         {/* 파일 업로드 */}
//                         <div className="relative">
//                             <label
//                                 htmlFor="file-upload"
//                                 className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer inline-block"
//                             >
//                                 파일 업로드
//                             </label>
//                             <input
//                                 id="file-upload"
//                                 type="file"
//                                 accept=".xlsx,.xls,.csv,.sjs,.json"
//                                 onChange={handleFileUpload}
//                                 disabled={renderState.isRendering}
//                                 className="hidden"
//                             />
//                         </div>

//                         {/* 내보내기 드롭다운 */}
//                         <div className="relative group">
//                             <button className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
//                                 내보내기
//                                 <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                                 </svg>
//                             </button>

//                             {/* 드롭다운 메뉴 */}
//                             <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-10">
//                                 <div className="py-1">
//                                     <button
//                                         onClick={handleDownloadExcel}
//                                         disabled={renderState.isRendering}
//                                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//                                     >
//                                         Excel (.xlsx)
//                                     </button>
//                                     <button
//                                         onClick={handleDownloadCSV}
//                                         disabled={renderState.isRendering}
//                                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//                                     >
//                                         CSV (.csv)
//                                     </button>
//                                     <button
//                                         onClick={handleDownloadSJS}
//                                         disabled={renderState.isRendering}
//                                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//                                     >
//                                         SpreadJS (.sjs)
//                                     </button>
//                                     <button
//                                         onClick={handleDownloadJSON}
//                                         disabled={renderState.isRendering}
//                                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//                                     >
//                                         JSON (.json)
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* 엑션AI에 피드백 남기기 */}
//                         <div className="relative">
//                             <button
//                                 onClick={() => window.open('https://slashpage.com/extion-cs', '_blank')}
//                                 className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer inline-block"
//                             >
//                                 엑션AI에 피드백 남기기
//                             </button>
//                         </div>
//                     </div>

//                     {/* 오른쪽 상태 표시 영역 - 훅의 상태 사용 */}
//                     <div className="ml-auto flex items-center space-x-4">
//                         {(renderState.isRendering || renderState.isProcessing) && (
//                             <div className="flex items-center gap-2">
//                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//                                 <span className="text-sm text-gray-600">
//                                     {renderState.isProcessing ? `처리 중... ${renderState.progress}%` : '업로드 중...'}
//                                 </span>
//                                 {renderState.progress > 0 && (
//                                     <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
//                                         <div
//                                             className="h-full bg-blue-600 transition-all duration-300"
//                                             style={{ width: `${renderState.progress}%` }}
//                                         ></div>
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         {renderState.fileName && !renderState.isRendering && !renderState.isProcessing && !renderState.error && (
//                             <div className="flex items-center gap-2">
//                                 <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                                 </svg>
//                                 <span className="text-sm text-green-600 font-medium">
//                                     {renderState.fileName}
//                                 </span>
//                             </div>
//                         )}

//                         {renderState.error && (
//                             <div className="flex items-center gap-2">
//                                 <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                 </svg>
//                                 <span className="text-sm text-red-600 font-medium">
//                                     오류 발생
//                                 </span>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* SpreadJS 컴포넌트 - 남은 공간 전체 사용 */}
//             <div className="flex-1 overflow-hidden w-full">
//                 <SpreadSheets
//                     workbookInitialized={(spread) => initSpread(spread)}
//                     hostStyle={hostStyle}>
//                 </SpreadSheets>
//             </div>
//         </div>
//     );
// }