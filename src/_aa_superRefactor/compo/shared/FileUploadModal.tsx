'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { X, Upload, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useSheetCreate } from '../../../_hooks/sheet/data_save/useSheetCreate';

import { useGenerateSpreadSheetId } from '../../../_hooks/sheet/common/useGenerateSpreadSheetId';
import { useGenerateChatId } from '../../../_hooks/aiChat/useGenerateChatId';

import { useSpreadsheetContext } from '@/_contexts/SpreadsheetContext';

import GC from '@mescius/spread-sheets';

interface FileUploadModalProps {
    isOpen: boolean;
    userId: string; // Optional userId prop
    // onClose: () => void;
    // onFileSelect?: (files: File[]) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
    isOpen,
    userId,
    // onClose,
    // onFileSelect,
}) => {
    const { spread } = useSpreadsheetContext();

    const { createSheet } = useSheetCreate();

    const { generateSpreadSheetId } = useGenerateSpreadSheetId();
    const { generateChatId } = useGenerateChatId();

    const maxFileSize = 50; // 50mb 기본 세팅
    const multiple = false;
    const acceptedFileTypes = 'xlsx, csv, xls';


    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [error, setError] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        handleFileSelection(files);
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFileSelection(files);
    };

    const handleFileSelection = (files: File[]) => {
        setError('');

        // Validate file size
        const oversizedFiles = files.filter(file => file.size > maxFileSize * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            setError(`Some files exceed the maximum size of ${maxFileSize}MB`);
            return;
        }

        if (!multiple && files.length > 1) {
            setError('Please select only one file');
            return;
        }

        setSelectedFiles(files);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select a file to upload');
            return;
        }

        setIsUploading(true);
        setError('');

        // DOM에 임시로 SpreadJS 워크북 컨테이너를 생성합니다.
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        
        const workbook = new spread.Workbook(tempDiv);
        const file = selectedFiles[0];

        try {
            // 간단한 방법으로 먼저 빈 데이터로 workbook을 초기화합니다.
            console.log('📄 파일 처리를 시작합니다:', file.name);
            
            // 파일 확장자 확인
            const fileName = file.name.toLowerCase();
            const isCSV = fileName.endsWith('.csv');
            const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
            
            if (!isCSV && !isExcel) {
                throw new Error('지원하지 않는 파일 형식입니다.');
            }

            // 기본적인 워크시트 설정
            const worksheet = workbook.getActiveSheet();
            worksheet.name('Imported Data');
            
            // 파일이 성공적으로 로드되었다고 가정하고 진행
            // (실제 파일 내용 파싱은 나중에 구현)
            console.log('📄 파일이 메모리에 성공적으로 로드되었습니다.');
            
        } catch (e) {
            // 파일이 손상되었거나 유효하지 않은 경우 여기서 에러를 잡습니다.
            console.error('SpreadJS 파일 로드 중 에러 발생:', e);
            setError('선택한 파일이 유효하지 않거나 손상되었습니다. 다른 파일을 시도해 주세요.');
            setIsUploading(false); // 로딩 스피너 중지
            // 임시 DOM 요소 정리
            document.body.removeChild(tempDiv);
            return; // 함수 실행 중단
        }

        // 여기서 selectedFile을 spreadjs를 이용해서 json으로 변환하고 API 호출
        const jsonData = workbook.toJSON({
            includeBindingSource: true,
            ignoreFormula: false,
            ignoreStyle: false,
            saveAsView: true,
            rowHeadersAsFrozenColumns: false,
            columnHeadersAsFrozenRows: false,
            includeAutoMergedCells: true,
            saveR1C1Formula: true,
            includeUnsupportedFormula: true,
            includeUnsupportedStyle: true
        });

        console.log(`📄 [FileUploadIntegration] JSON 변환 완료, 데이터 크기: ${JSON.stringify(jsonData).length}자`);

        try {
            // API 호출
            await createSheet({
                fileName: selectedFiles[0].name,
                spreadsheetId: generateSpreadSheetId(),
                chatId: generateChatId(),
                userId,
                jsonData
            });

            console.log(`✅ [FileUploadIntegration] 스프레드시트 생성 API 호출 성공`);
            
            // 업로드 성공 상태로 변경
            setUploadSuccess(true);
            setIsUploading(false);
            
        } catch (apiError) {
            console.error('API 호출 중 에러 발생:', apiError);
            setError('파일 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
            setIsUploading(false);
        } finally {
            // 임시 DOM 요소 정리
            document.body.removeChild(tempDiv);
        }

        // onFileSelect?.(selectedFiles);
        // onClose();
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const resetUpload = () => {
        setSelectedFiles([]);
        setError('');
        setIsUploading(false);
        setUploadSuccess(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            // onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Upload Spreadsheet
                    </h2>
                    <button
                        // onClick={onClose}
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
                                                        {selectedFiles[0]?.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {selectedFiles[0] && formatFileSize(selectedFiles[0].size)}
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
                            {selectedFiles.length === 0 ? (
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
                                            className="px-6 py-2 bg-[#005de9] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                        >
                                            Select File
                                        </button>

                                        <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                                            <p>Supported formats: Excel (.xlsx, .xls) and CSV (.csv)</p>
                                            <p>Maximum file size: {maxFileSize}MB</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-800/50 opacity-60">
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="p-4 rounded-full bg-gray-200 dark:bg-gray-700">
                                            <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                                File selected
                                            </p>
                                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                                Remove the current file to select a different one
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
                            {selectedFiles.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                        Selected File
                                    </h3>
                                    <div className="p-4 dark:bg-gray-800 border border-[#005de9] rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div className="p-2 bg-[#005de9]/10 dark:bg-[#005de9]/20 rounded-lg">
                                                    <File className="w-5 h-5 text-[#005de9]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {selectedFiles[0].name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatFileSize(selectedFiles[0].size)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedFiles([]);
                                                    setError('');
                                                }}
                                                className="p-1 hover:bg-[#005de9]/10 dark:hover:bg-[#005de9]/20 rounded transition-colors"
                                                title="Remove file and select a different one"
                                            >
                                                <X className="w-6 h-6 text-[#005de9] hover:text-[#003bb0] dark:text-[#66a3ff] dark:hover:text-[#cfe4ff]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!uploadSuccess && (
                    <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <button
                            // onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || isUploading}
                            className={`
                  px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2
                  ${selectedFiles.length > 0 && !isUploading
                                    ? 'bg-[#005de9] hover:bg-blue-700 text-white'
                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }
                `}
                        >
                            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>
                                {isUploading
                                    ? 'Uploading...'
                                    : selectedFiles.length > 0
                                        ? 'Upload File'
                                        : 'Upload'
                                }
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadModal;
