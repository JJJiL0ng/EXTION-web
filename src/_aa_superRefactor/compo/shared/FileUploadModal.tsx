'use client';

import React, { useState, useRef, DragEvent, ChangeEvent, useCallback, useEffect } from 'react';
import { X, Upload, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useSheetCreate } from '../../../_hooks/sheet/data_save/useSheetCreate';
import { useGenerateSpreadSheetId } from '../../../_hooks/sheet/common/useGenerateSpreadSheetId';
import { useGenerateChatId } from '../../../_hooks/aiChat/useGenerateChatId';
// Dynamic import for ExcelIO to avoid SSR issues
let ExcelIO: any = null;
if (typeof window !== 'undefined') {
  import("@grapecity/spread-excelio").then(module => {
    ExcelIO = module;
  });
}
interface FileUploadModalProps {
    isOpen: boolean;
    userId: string; // Optional userId prop
    onClose: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
    isOpen,
    userId,
    onClose,
    // onFileSelect,
}) => {
    const { createSheet } = useSheetCreate();
    const { generateSpreadSheetId } = useGenerateSpreadSheetId();
    const { generateChatId } = useGenerateChatId();

    const maxFileSize = 50; // 50MB
    const multiple = false;
    const acceptedFileTypes = '.xlsx,.csv';

    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [successFileName, setSuccessFileName] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 업로드 성공 시 모달 자동 닫기
    // useEffect(() => {
    //     if (uploadSuccess) {
    //         const timer = setTimeout(() => {
    //             onClose();
    //             // 상태 초기화
    //             setUploadSuccess(false);
    //             setSuccessFileName('');
    //             setSelectedFile(null);
    //             setError('');
    //         }, 2000); // 2초 후 자동 닫기

    //         return () => clearTimeout(timer);
    //     }
    // }, [uploadSuccess, onClose]);

    // 모달이 닫힐 때 상태 초기화
    useEffect(() => {
        if (!isOpen) {
            setUploadSuccess(false);
            setSuccessFileName('');
            setSelectedFile(null);
            setError('');
            setIsUploading(false);
            setIsDragOver(false);
        }
    }, [isOpen]);

    // CSV 파일을 SpreadJS 형식으로 변환하는 함수
    const processCsvFile = useCallback((file: File): Promise<any> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    if (!text) {
                        reject(new Error('CSV 파일을 읽을 수 없습니다.'));
                        return;
                    }

                    console.log(`📊 [FileUploadModal] CSV 텍스트 길이: ${text.length}자`);

                    // CSV 파싱 (RFC 4180 표준 준수)
                    const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim());
                    const data: string[][] = [];

                    for (const line of lines) {
                        const row: string[] = [];
                        let current = '';
                        let inQuotes = false;
                        let i = 0;

                        while (i < line.length) {
                            const char = line[i];
                            const nextChar = line[i + 1];

                            if (char === '"') {
                                if (inQuotes && nextChar === '"') {
                                    // 따옴표 이스케이프 처리 ("")
                                    current += '"';
                                    i += 2;
                                } else {
                                    // 따옴표 시작/끝
                                    inQuotes = !inQuotes;
                                    i++;
                                }
                            } else if (char === ',' && !inQuotes) {
                                // 필드 구분자
                                row.push(current.trim());
                                current = '';
                                i++;
                            } else {
                                current += char;
                                i++;
                            }
                        }

                        // 마지막 필드 추가
                        row.push(current.trim());
                        data.push(row);
                    }

                    console.log(`📊 [FileUploadModal] CSV 파싱 완료: ${data.length}행, ${data[0]?.length || 0}열`);

                    // SpreadJS 표준 형식의 JSON 생성
                    const jsonData = {
                        frc: 1,
                        name: "",
                        sheets: {
                            "Sheet1": {
                                data: {
                                    dataTable: {},
                                    defaultDataNode: {
                                        style: {
                                            themeFont: "Body"
                                        }
                                    }
                                },
                                name: "Sheet1",
                                index: 0,
                                order: 0,
                                theme: "Office",
                                states: {},
                                visible: 1,
                                rowCount: Math.max(data.length + 50, 999), // 여유 공간 추가
                                cellStates: {},
                                isSelected: true,
                                selections: {
                                    "0": {
                                        col: 0,
                                        row: 0,
                                        colCount: 1,
                                        rowCount: 1
                                    },
                                    length: 1
                                },
                                columnCount: Math.max(data[0]?.length || 0, 25), // 최소 25열
                                defaultData: {},
                                rowOutlines: {
                                    items: []
                                },
                                topCellIndex: 0,
                                colHeaderData: {
                                    defaultDataNode: {
                                        style: {
                                            themeFont: "Body"
                                        }
                                    }
                                },
                                leftCellIndex: 0,
                                rowHeaderData: {
                                    defaultDataNode: {
                                        style: {
                                            themeFont: "Body"
                                        }
                                    }
                                },
                                columnOutlines: {
                                    items: []
                                },
                                autoMergeRangeInfos: [],
                                outlineColumnOptions: {}
                            }
                        },
                        version: "18.1.4",
                        docProps: {
                            docPropsApp: {},
                            docPropsCore: {}
                        },
                        customList: [],
                        sheetCount: 1,
                        calcOnDemand: true,
                        namedPatterns: {},
                        sheetTabCount: 0,
                        builtInFileIcons: {},
                        allowDynamicArray: true,
                        allowUserDragDrop: false,
                        scrollIgnoreHidden: true,
                        defaultSheetTabStyles: {}
                    };

                    // 데이터를 SpreadJS 표준 dataTable 형식으로 변환
                    data.forEach((row, rowIndex) => {
                        const rowData: any = {};
                        row.forEach((cell, colIndex) => {
                            if (cell !== '') {
                                // 숫자인지 확인
                                const numValue = parseFloat(cell);
                                const isNumber = !isNaN(numValue) && isFinite(numValue) && cell.trim() !== '';

                                rowData[colIndex.toString()] = {
                                    value: isNumber ? numValue : cell
                                };
                            }
                        });

                        // 행에 데이터가 있는 경우에만 추가
                        if (Object.keys(rowData).length > 0) {
                            (jsonData.sheets.Sheet1.data.dataTable as any)[rowIndex.toString()] = rowData;
                        }
                    });

                    console.log(`📄 [FileUploadModal] CSV → SpreadJS JSON 변환 완료`);
                    resolve(jsonData);

                } catch (error) {
                    console.error('❌ [FileUploadModal] CSV 파싱 실패:', error);
                    reject(new Error('CSV 파일 형식을 인식할 수 없습니다. 파일이 올바른 CSV 형식인지 확인해 주세요.'));
                }
            };

            reader.onerror = () => {
                reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
            };

            // UTF-8로 읽기 시도, 실패하면 다른 인코딩 시도
            reader.readAsText(file, 'utf-8');
        });
    }, []);

    // ExcelIO를 사용한 파일 처리 함수
    const processFile = useCallback(async (file: File) => {
        setIsUploading(true);
        setError('');
        setSelectedFile(file);

        console.log(`📁 [FileUploadModal] 파일 처리 시작: ${file.name}`);

        try {
            // 파일 크기 검증
            if (file.size > maxFileSize * 1024 * 1024) {
                throw new Error(`파일 크기가 너무 큽니다. 최대 ${maxFileSize}MB까지 지원됩니다.`);
            }

            // 파일 확장자 검증
            const fileExtension = file.name.toLowerCase().split('.').pop();
            if (!['xlsx', 'csv'].includes(fileExtension || '')) {
                throw new Error('지원하지 않는 파일 형식입니다. Excel(.xlsx) 또는 CSV 파일만 업로드 가능합니다.');
            }

            let jsonData: any;

            if (fileExtension === 'csv') {
                // CSV 파일은 별도 처리
                console.log(`📊 [FileUploadModal] CSV 파일 직접 처리 시작`);
                jsonData = await processCsvFile(file);
            } else {
                // Excel 파일은 ExcelIO 사용
                console.log(`📊 [FileUploadModal] Excel 파일 ExcelIO 처리 시작`);

                if (!ExcelIO) {
                    throw new Error('ExcelIO library not loaded');
                }

                jsonData = await new Promise((resolve, reject) => {
                    const excelIO = new ExcelIO.IO();
                    excelIO.open(file, (data: any) => {
                        console.log(`📄 [FileUploadModal] ExcelIO 변환 완료`);
                        resolve(data);
                    }, (error: any) => {
                        console.error('❌ [FileUploadModal] ExcelIO 변환 실패:', error);
                        reject(error);
                    });
                });
            }

            console.log(`📊 [FileUploadModal] 변환된 데이터 구조:`, {
                version: jsonData.version,
                sheetCount: jsonData.sheetCount,
                sheets: Object.keys(jsonData.sheets || {}),
                dataSize: JSON.stringify(jsonData).length
            });

            const spreadsheetId = generateSpreadSheetId();
            const chatId = generateChatId();

            // API 호출
            await createSheet({
                fileName: file.name,
                spreadsheetId,
                chatId,
                userId,
                jsonData
            });

            console.log(`✅ [FileUploadModal] 스프레드시트 생성 API 호출 성공`);

            // 업로드 성공 상태로 변경
            setIsUploading(false);
            setUploadSuccess(true);
            setSuccessFileName(file.name);

            // 짧은 딜레이 후 새창 열기
            setTimeout(() => {
                const url = `/sheetchat/${spreadsheetId}/${chatId}`;
                window.open(url, '_blank');
            }, 500);

        } catch (error: any) {
            console.error('❌ [FileUploadModal] 파일 처리 실패:', error);
            setError(error.message || '파일 처리 중 오류가 발생했습니다.');
            setIsUploading(false);
        }
    }, [createSheet, generateSpreadSheetId, generateChatId, userId, maxFileSize, processCsvFile]);

    if (!isOpen) return null;

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (isUploading || selectedFile) {
            return;
        }

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) {
            console.log(`⚠️ [FileUploadModal] 드롭된 파일이 없음`);
            return;
        }

        const file = files[0]; // 첫 번째 파일만 처리
        console.log(`📥 [FileUploadModal] 파일 드롭 감지: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // 파일 유효성 검사만 수행하고 선택 상태로 설정
        const fileExtension = file.name.toLowerCase().split('.').pop();
        if (!['xlsx', 'csv'].includes(fileExtension || '')) {
            setError('지원하지 않는 파일 형식입니다. Excel(.xlsx) 또는 CSV 파일만 업로드 가능합니다.');
            return;
        }

        if (file.size > maxFileSize * 1024 * 1024) {
            setError(`파일 크기가 너무 큽니다. 최대 ${maxFileSize}MB까지 지원됩니다.`);
            return;
        }

        setSelectedFile(file);
        setError('');
    };

    const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (isUploading || selectedFile) {
            e.target.value = '';
            return;
        }

        const files = e.target.files;
        if (!files || files.length === 0) {
            console.log(`⚠️ [FileUploadModal] 선택된 파일이 없음`);
            return;
        }

        const file = files[0]; // 첫 번째 파일만 처리
        console.log(`📁 [FileUploadModal] 클릭으로 선택한 파일: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // 파일 유효성 검사만 수행하고 선택 상태로 설정
        const fileExtension = file.name.toLowerCase().split('.').pop();
        if (!['xlsx', 'csv'].includes(fileExtension || '')) {
            setError('지원하지 않는 파일 형식입니다. Excel(.xlsx) 또는 CSV 파일만 업로드 가능합니다.');
            e.target.value = '';
            return;
        }

        if (file.size > maxFileSize * 1024 * 1024) {
            setError(`파일 크기가 너무 큽니다. 최대 ${maxFileSize}MB까지 지원됩니다.`);
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
        setError('');
        
        // 파일 입력 초기화
        e.target.value = '';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const resetUpload = () => {
        setSelectedFile(null);
        setError('');
        setIsUploading(false);
        setUploadSuccess(false);
        setSuccessFileName('');
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        await processFile(selectedFile);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Upload Spreadsheet
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Upload Success UI */}
                    {uploadSuccess ? (
                        <div className="text-center space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="p-4 rounded-full bg-[#005de9]/10 dark:bg-[#005de9]/20">
                                    <CheckCircle className="w-12 h-12 text-[#005de9] dark:text-[#66a3ff]" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        Upload Successful!
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Your spreadsheet has been uploaded successfully
                                    </p>
                                </div>
                                <div className="space-y-3 w-full">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white text-left">
                                        Uploaded File
                                    </h3>
                                    <div className="p-4 dark:bg-gray-800 border border-[#005de9] rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div className="p-2 bg-[#005de9]/10 dark:bg-[#005de9]/20 rounded-lg">
                                                    <File className="w-5 h-5 text-[#005de9]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {successFileName}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Upload Area */}
                            {!selectedFile ? (
                                <div
                                    className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                  ${isDragOver
                                            ? 'border-[#005de9] bg-gray-50 dark:bg-gray-800/50'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                        }
                `}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple={multiple}
                                        accept={acceptedFileTypes}
                                        onChange={handleFileInputChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={isUploading}
                                    />

                                    <div className="flex flex-col items-center space-y-4">
                                        <div className={`
                    p-4 rounded-full transition-colors
                    ${isDragOver
                                                ? 'bg-gray-200 dark:bg-gray-700'
                                                : 'bg-gray-100 dark:bg-gray-800'
                                            }
                  `}>
                                            <Upload className={`
                      w-8 h-8 transition-colors
                      ${isDragOver
                                                    ? 'text-[#005de9] dark:text-blue-400'
                                                    : 'text-gray-500 dark:text-gray-400'
                                                }
                    `} />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                                {isDragOver ? 'Drop your file here' : 'Drag & drop your spreadsheet here'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                or click to select a file
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="px-6 py-2 bg-[#005de9] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? 'Processing...' : 'Select File'}
                                        </button>

                                        <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                                            <p>Supported formats: Excel (.xlsx) and CSV (.csv)</p>
                                            <p>Maximum file size: {maxFileSize}MB</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-800/50 opacity-60">
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="p-4 rounded-full bg-gray-200 dark:bg-gray-700">
                                            {isUploading ? (
                                                <Loader2 className="w-8 h-8 text-[#005de9] animate-spin" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                                {isUploading ? 'Processing file...' : 'File selected'}
                                            </p>
                                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                                {isUploading 
                                                    ? 'Converting file to spreadsheet format...'
                                                    : 'Remove the current file to select a different one'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Selected File */}
                            {selectedFile && !isUploading && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                        Selected File
                                    </h3>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-[#005de9] rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div className="p-2 bg-[#005de9]/10 dark:bg-[#005de9]/20 rounded-lg">
                                                    <File className="w-5 h-5 text-[#005de9]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatFileSize(selectedFile.size)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={resetUpload}
                                                className="p-1 hover:bg-[#005de9]/10 dark:hover:bg-[#005de9]/20 rounded transition-colors"
                                                title="Remove file and select a different one"
                                            >
                                                <X className="w-6 h-6 text-[#005de9] hover:text-[#003bb0] dark:text-[#66a3ff] dark:hover:text-[#cfe4ff]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Uploading State */}
                            {isUploading && selectedFile && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                        Uploading File
                                    </h3>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-[#005de9] rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-[#005de9]/10 dark:bg-[#005de9]/20 rounded-lg">
                                                <Loader2 className="w-5 h-5 text-[#005de9] animate-spin" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Converting file to spreadsheet format...
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!uploadSuccess && (
                    <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
                        {selectedFile && !isUploading && (
                            <button
                                onClick={handleUpload}
                                className="px-6 py-2 bg-[#005de9] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Upload
                            </button>
                        )}
                        <button
                            onClick={resetUpload}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Processing...' : 'Cancel'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadModal;
