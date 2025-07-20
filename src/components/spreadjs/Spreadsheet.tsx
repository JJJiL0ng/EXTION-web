"use client";
import '@mescius/spread-sheets-resources-ko';
import '@mescius/spread-sheets-io';
import React, { useState, useRef } from "react";
import { SpreadSheets, Worksheet, Column } from "@mescius/spread-sheets-react";
import * as GC from "@mescius/spread-sheets";

// SpreadJS 라이선싱
// var SpreadJSKey = "xxx";          // 라이선스 키 입력
// GC.Spread.Sheets.LicenseKey = SpreadJSKey;
GC.Spread.Common.CultureManager.culture("ko-kr");

export default function SpreadSheet() {
    const [hostStyle, setHostStyle] = useState({
        width: '100%',
        height: '700px'
    });
    
    // SpreadJS 인스턴스 참조
    const spreadRef = useRef<any>(null);
    
    // 파일 업로드 상태
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string>("");

    const initSpread = function (spread: any) {
        // SpreadJS 인스턴스 저장
        spreadRef.current = spread;
        
        let sheet = spread.getActiveSheet();
        sheet.setValue(1, 1, "값 설정하기");
        // 값 설정 - Number : B3에 "Number" 라는 텍스트를, C3에 23이라는 숫자를 삽입합니다.
        sheet.setValue(2, 1, "Number");
        sheet.setValue(2, 2, 23);
        // 값 설정 - Text : B4에 "Text" 라는 텍스트를, C4에 "Mescius"라는 텍스트를 삽입합니다.
        sheet.setValue(3, 1, "Text");
        sheet.setValue(3, 2, "Mescius");
        // 값 설정 - Text : B5에 "Datetime" 이라는 텍스트를, C5에 오늘 날짜를 삽입합니다.
        sheet.setValue(4, 1, "Datetime");
        sheet.getCell(4, 2).value(new Date()).formatter("yyyy-mm-dd");

        // 스타일 설정
        // B열, C열의 너비를 200으로 설정합니다.
        sheet.setColumnWidth(1, 200);
        sheet.setColumnWidth(2, 200);
        // B2:C2의 배경색과 글자색을 설정합니다.
        sheet.getRange(1, 1, 1, 2).backColor("rgb(130, 188, 0)").foreColor("rgb(255, 255, 255)");
        // B4:C4의 배경색을 설정합니다.
        sheet.getRange(3, 1, 1, 2).backColor("rgb(211, 211, 211)");
        // B2:C2의 셀을 병합합니다.
        sheet.addSpan(1, 1, 1, 2);
        // 각 범위에 테두리를 설정합니다.
        sheet.getRange(1, 1, 4, 2).setBorder(new GC.Spread.Sheets.LineBorder("Black", GC.Spread.Sheets.LineStyle.thin), {
            all: true
        });
        sheet.getRange(1, 1, 4, 2).setBorder(new GC.Spread.Sheets.LineBorder("Black", GC.Spread.Sheets.LineStyle.dotted), {
            inside: true
        });
        // B2:C2의 병합된 셀에 수직 가운데 정렬을 설정합니다.
        sheet.getRange(1, 1, 1, 2).hAlign(GC.Spread.Sheets.HorizontalAlign.center);
    };

    // 파일 업로드 핸들러
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 파일 형식 검증
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'application/sjs', // .sjs
            'application/json' // .json
        ];

        const fileExtension = file.name.toLowerCase().split('.').pop();
        const isValidType = allowedTypes.includes(file.type) || 
            ['xlsx', 'xls', 'csv', 'sjs', 'json'].includes(fileExtension || '');

        if (!isValidType) {
            alert('지원되지 않는 파일 형식입니다. Excel 파일(.xlsx, .xls), CSV 파일(.csv), SpreadJS 파일(.sjs), 또는 JSON 파일(.json)을 선택해주세요.');
            return;
        }

        setIsUploading(true);
        setUploadedFileName(file.name);

        // SpreadJS import 메서드를 사용하여 파일 불러오기
        if (spreadRef.current) {
            if (fileExtension === 'sjs' || fileExtension === 'json') {
                // .sjs 파일과 .json 파일은 JSON 형식이므로 텍스트로 읽어서 처리
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const jsonData = JSON.parse(e.target?.result as string);
                        
                        // JSON 구조를 콘솔에 출력
                        console.log(`📄 ${fileExtension.toUpperCase()} 파일 JSON 구조:`, jsonData);
                        console.log('📊 JSON 키 목록:', Object.keys(jsonData));
                        
                        // 시트 정보가 있다면 출력
                        if (jsonData.sheets) {
                            console.log('📋 시트 정보:', jsonData.sheets);
                            console.log('📋 시트 개수:', jsonData.sheets.length);
                        }
                        
                        // 스타일 정보가 있다면 출력
                        if (jsonData.styles) {
                            console.log('🎨 스타일 정보:', jsonData.styles);
                        }
                        
                        // 데이터 정보가 있다면 출력
                        if (jsonData.data) {
                            console.log('📊 데이터 정보:', jsonData.data);
                        }
                        
                        // fromJSON은 Promise를 반환하므로 await로 처리
                        // deserialization 옵션을 추가하여 스타일링 보존
                        const deserializationOptions = {
                            ignoreFormula: false,              // 수식 포함
                            ignoreStyle: false,                // 스타일 포함
                            includeBindingSource: true,        // 바인딩 소스 포함
                            includeUnsupportedFormula: true,   // 지원되지 않는 수식도 포함
                            includeUnsupportedStyle: true      // 지원되지 않는 스타일도 포함
                        };
                        
                        spreadRef.current.fromJSON(jsonData, deserializationOptions).then(() => {
                            console.log(`✅ ${fileExtension.toUpperCase()} 파일 업로드 성공:`, file.name);
                            setIsUploading(false);
                            alert(`${file.name} 파일이 성공적으로 업로드되었습니다.`);
                        }).catch((error: any) => {
                            console.error(`❌ ${fileExtension.toUpperCase()} 파일 로드 실패:`, error);
                            setIsUploading(false);
                            setUploadedFileName("");
                            alert(`${fileExtension.toUpperCase()} 파일 로드 중 오류가 발생했습니다.`);
                        });
                    } catch (error) {
                        console.error(`❌ ${fileExtension.toUpperCase()} 파일 파싱 실패:`, error);
                        setIsUploading(false);
                        setUploadedFileName("");
                        alert(`${fileExtension.toUpperCase()} 파일 형식이 올바르지 않습니다.`);
                    }
                };
                reader.onerror = () => {
                    console.error('파일 읽기 실패');
                    setIsUploading(false);
                    setUploadedFileName("");
                    alert('파일을 읽을 수 없습니다.');
                };
                reader.readAsText(file);
            } else {
                // Excel, CSV 파일 처리
                let importOptions;
                if (fileExtension === 'csv') {
                    importOptions = {
                        fileType: GC.Spread.Sheets.FileType.csv,
                        includeStyles: true,
                        includeFormulas: true
                    };
                } else {
                    importOptions = {
                        fileType: GC.Spread.Sheets.FileType.excel,
                        includeStyles: true,
                        includeFormulas: true
                    };
                }

                spreadRef.current.import(
                    file,
                    // 성공 콜백
                    () => {
                        console.log('파일 업로드 성공:', file.name);
                        setIsUploading(false);
                        alert(`${file.name} 파일이 성공적으로 업로드되었습니다.`);
                    },
                    // 에러 콜백
                    (error: any) => {
                        console.error('파일 업로드 실패:', error);
                        setIsUploading(false);
                        setUploadedFileName("");
                        alert('파일 업로드 중 오류가 발생했습니다.');
                    },
                    // 옵션
                    importOptions
                );
            }
        }

        // 파일 입력 초기화
        event.target.value = '';
    };

    // 새 스프레드시트 생성
    const handleNewSpreadsheet = () => {
        if (spreadRef.current) {
            spreadRef.current.clearSheets();
            spreadRef.current.addSheet(0);
            const sheet = spreadRef.current.getActiveSheet();
            sheet.name("Sheet1");
            setUploadedFileName("");
            console.log('새 스프레드시트가 생성되었습니다.');
        }
    };

    // 엑셀 파일로 다운로드
    const handleDownloadExcel = () => {
        if (spreadRef.current) {
            const fileName = uploadedFileName 
                ? uploadedFileName.replace(/\.[^/.]+$/, '.xlsx') 
                : 'spreadsheet.xlsx';
            
            const exportOptions = {
                fileType: GC.Spread.Sheets.FileType.excel,
                includeStyles: true,
                includeFormulas: true
            };

            console.log('📄 Excel 다운로드 시작:', fileName);
            console.log('📊 Export 옵션:', exportOptions);

            spreadRef.current.export(
                (blob: Blob) => {
                    // 다운로드 링크 생성
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    console.log('✅ 엑셀 파일 다운로드 완료:', fileName);
                },
                (error: any) => {
                    console.error('❌ Excel 다운로드 실패:', error);
                    alert('Excel 파일 다운로드 중 오류가 발생했습니다.');
                },
                exportOptions
            );
        }
    };

    // CSV 파일로 다운로드
    const handleDownloadCSV = () => {
        if (spreadRef.current) {
            const fileName = uploadedFileName 
                ? uploadedFileName.replace(/\.[^/.]+$/, '.csv') 
                : 'spreadsheet.csv';
            
            const exportOptions = {
                fileType: GC.Spread.Sheets.FileType.csv
            };

            console.log('📄 CSV 다운로드 시작:', fileName);
            console.log('📊 Export 옵션:', exportOptions);

            spreadRef.current.export(
                (blob: Blob) => {
                    // 다운로드 링크 생성
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    console.log('✅ CSV 파일 다운로드 완료:', fileName);
                },
                (error: any) => {
                    console.error('❌ CSV 다운로드 실패:', error);
                    alert('CSV 파일 다운로드 중 오류가 발생했습니다.');
                },
                exportOptions
            );
        }
    };

    // SJS 파일로 다운로드
    const handleDownloadSJS = () => {
        if (spreadRef.current) {
            const fileName = uploadedFileName 
                ? uploadedFileName.replace(/\.[^/.]+$/, '.sjs') 
                : 'spreadsheet.sjs';
            
            try {
                console.log('📄 SJS 다운로드 시작:', fileName);
                
                // SpreadJS 데이터를 JSON으로 변환 (완전한 SJS 형식)
                const jsonData = spreadRef.current.toJSON();
                
                // JSON 구조를 콘솔에 출력
                console.log('📄 다운로드할 SJS JSON 구조:', jsonData);
                console.log('📊 JSON 키 목록:', Object.keys(jsonData));
                
                // 시트 정보가 있다면 출력
                if (jsonData.sheets) {
                    console.log('📋 시트 정보:', jsonData.sheets);
                    console.log('📋 시트 개수:', jsonData.sheets.length);
                }
                
                // 스타일 정보가 있다면 출력
                if (jsonData.styles) {
                    console.log('🎨 스타일 정보:', jsonData.styles);
                }
                
                // 데이터 정보가 있다면 출력
                if (jsonData.data) {
                    console.log('📊 데이터 정보:', jsonData.data);
                }
                
                const jsonString = JSON.stringify(jsonData, null, 2);
                
                // Blob 생성 (SJS 형식)
                const blob = new Blob([jsonString], { type: 'application/sjs' });
                
                // 다운로드 링크 생성
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('✅ SJS 파일 다운로드 완료:', fileName);
            } catch (error) {
                console.error('❌ SJS 다운로드 실패:', error);
                alert('SJS 파일 다운로드 중 오류가 발생했습니다.');
            }
        }
    };

    // 일반 JSON 파일로 다운로드
    const handleDownloadJSON = () => {
        if (spreadRef.current) {
            const fileName = uploadedFileName ? uploadedFileName.replace(/\.[^/.]+$/, '.json') : 'spreadsheet.json';
            
            try {
                // SpreadJS 데이터를 JSON으로 변환 (스타일 보존)
                const jsonData = spreadRef.current.toJSON({
                    includeBindingSource: true,        // 바인딩 소스 포함
                    ignoreFormula: false,              // 수식 포함
                    ignoreStyle: false,                // 스타일 포함 (중요!)
                    saveAsView: true,                  // 뷰로 저장
                    rowHeadersAsFrozenColumns: true,   // 행 헤더를 고정 열로 저장
                    columnHeadersAsFrozenRows: true,   // 열 헤더를 고정 행으로 저장
                    includeAutoMergedCells: true,      // 자동 병합된 셀 포함
                    saveR1C1Formula: true,            // R1C1 수식 형식으로 저장
                    includeUnsupportedFormula: true,   // 지원되지 않는 수식도 포함
                    includeUnsupportedStyle: true      // 지원되지 않는 스타일도 포함
                });
                
                // JSON 구조를 콘솔에 출력
                console.log('📄 다운로드할 일반 JSON 구조:', jsonData);
                console.log('📊 JSON 키 목록:', Object.keys(jsonData));
                
                // 시트 정보가 있다면 출력
                if (jsonData.sheets) {
                    console.log('📋 시트 정보:', jsonData.sheets);
                    console.log('📋 시트 개수:', jsonData.sheets.length);
                }
                
                // 스타일 정보가 있다면 출력
                if (jsonData.styles) {
                    console.log('🎨 스타일 정보:', jsonData.styles);
                }
                
                // 데이터 정보가 있다면 출력
                if (jsonData.data) {
                    console.log('📊 데이터 정보:', jsonData.data);
                }
                
                const jsonString = JSON.stringify(jsonData, null, 2);
                
                // Blob 생성
                const blob = new Blob([jsonString], { type: 'application/json' });
                
                // 다운로드 링크 생성
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('✅ 일반 JSON 파일 다운로드 완료:', fileName);
            } catch (error) {
                console.error('❌ 일반 JSON 다운로드 실패:', error);
                alert('JSON 파일 다운로드 중 오류가 발생했습니다.');
            }
        }
    };

    return (
        <div className="w-full">
            {/* 파일 업로드 컨트롤 */}
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
                            엑셀 파일 업로드:
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls,.csv,.sjs,.json"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                        />
                    </div>
                    
                    <button
                        onClick={handleNewSpreadsheet}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        새 스프레드시트
                    </button>
                    
                    <button
                        onClick={handleDownloadExcel}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        Excel 다운로드
                    </button>
                    
                    <button
                        onClick={handleDownloadCSV}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                        CSV 다운로드
                    </button>
                    
                    <button
                        onClick={handleDownloadSJS}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                        SJS 다운로드
                    </button>
                    
                    <button
                        onClick={handleDownloadJSON}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                    >
                        JSON 다운로드
                    </button>
                    
                    {isUploading && (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-600">업로드 중...</span>
                        </div>
                    )}
                    
                    {uploadedFileName && !isUploading && (
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-green-600 font-medium">
                                {uploadedFileName} 업로드 완료
                            </span>
                        </div>
                    )}
                </div>
                
                <p className="mt-2 text-xs text-gray-500">
                    지원 형식: Excel (.xlsx, .xls), CSV (.csv), SpreadJS (.sjs), JSON (.json)
                </p>
            </div>

            {/* SpreadJS 컴포넌트 */}
            <SpreadSheets
                workbookInitialized={(spread) => initSpread(spread)}
                hostStyle={hostStyle}>
            </SpreadSheets>
        </div>
    );
}
