"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import FileUploadModal from '@/_aaa_sheetChat/_aa_superRefactor/compo/shared/FileUploadModal';
import useFileNameStore from '@/_aaa_sheetChat/_store/sheet/fileNameStore';
import { renameSheet } from '@/_aaa_sheetChat/_hooks/sheet/fileName/useRename';
import { useFileExport } from '../../_hooks/sheet/file_upload_export/useFileExport';
import { useSpreadsheetContext } from '@/_aaa_sheetChat/_contexts/SpreadsheetContext';
import { getOrCreateGuestId } from '@/_aaa_sheetChat/_utils/guestUtils';
import { useIsEmptySheetStore } from '@/_aaa_sheetChat/_aa_superRefactor/store/sheet/isEmptySheetStore';
import { useChatVisibilityState } from '@/_aaa_sheetChat/_aa_superRefactor/store/chat/chatVisibilityStore';
 
/**
 * Spreadsheet top toolbar component
 */
export const SpreadSheetToolbar: React.FC = () => {
    const { spread } = useSpreadsheetContext();
    const {
        exportState,
        saveAsExcel,
        saveAsCSV,
    } = useFileExport(spread, {
        defaultFileName: 'spreadsheet',
        onExportSuccess: (fileName: string) => {
            console.log(`✅ [MainSpreadSheet] 파일 저장 성공: ${fileName}`);
        },
        onExportError: (error: Error) => {
            console.error(`❌ [MainSpreadSheet] 파일 저장 실패:`, error);
            alert(`파일 저장 중 오류가 발생했습니다: ${error.message}`);
        }
    });
    const fileName = useFileNameStore((state) => state.fileName);
    const setFileName = useFileNameStore((state) => state.setFileName);

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [previousFileName, setPreviousFileName] = useState<string | null>(null);
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const userId = getOrCreateGuestId();


    const { isEmptySheet, setIsEmptySheet } = useIsEmptySheetStore();
    const { chatVisability, setChatVisability } = useChatVisibilityState();

    // 채팅 가시성 토글 함수
    const handleToggleChat = () => {
        setChatVisability(!chatVisability);
    };

    // 편집 모드 시작
    const handleEditStart = () => {
        if (fileName) {
            setEditValue(fileName);
            setIsEditing(true);
        }
    };

    // 편집 완료
    const handleEditComplete = async () => {
        if (editValue.trim() && editValue !== fileName && editValue.trim().length <= 20) {
            // 기존 파일명을 임시 저장
            setPreviousFileName(fileName);

            try {
                const response = await renameSheet(editValue.trim());
                if (response.success) {
                    console.log('✅ 파일 이름 변경 완료:', editValue.trim());
                    // renameSheet에서 이미 스토어를 업데이트했으므로 여기서는 추가 작업 불필요
                    setPreviousFileName(null);
                } else {
                    console.error('❌ 파일 이름 변경 실패:', response);
                    // 실패 시 이전 파일명으로 복원
                    if (previousFileName) {
                        setFileName(previousFileName);
                        setEditValue(previousFileName);
                    }
                    setPreviousFileName(null);
                }
            } catch (error) {
                console.error('❌ 파일 이름 변경 실패:', error);
                // 실패 시 이전 파일명으로 복원
                if (previousFileName) {
                    setFileName(previousFileName);
                    setEditValue(previousFileName);
                }
                setPreviousFileName(null);
            }
        }
        setIsEditing(false);
    };

    // 편집 취소
    const handleEditCancel = () => {
        setEditValue(fileName || '');
        setIsEditing(false);
    };

    // 키보드 이벤트 처리
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleEditComplete();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleEditCancel();
        }
    };

    // 편집 모드가 시작되면 input에 포커스
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // 파일 업로드 모달 열기
    const handleOpenFileUploadModal = () => {
        setIsFileUploadModalOpen(true);
    };

    // 파일 업로드 모달 닫기
    const handleCloseFileUploadModal = () => {
        setIsFileUploadModalOpen(false);
    };
    return (
        <>
            <div className="w-full h-7 bg-white flex items-center justify-between box-border">
                <div className="flex items-center gap-2 pl-2">
                    {/* Home */}
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                    >
                        <Image src="/extion-small-blue.svg" alt="Logo" width={16} height={16} />
                    </button>

                    {/* File name display/edit or Open File button based on mode */}
                    {isEmptySheet ? (
                        <button
                            onClick={handleOpenFileUploadModal}
                            className="flex justify-center items-center px-2 py-1 text-sm text-white font-medium bg-[#005de9] hover:bg-[#0052d1] rounded transition-colors duration-150 h-6"
                            title="Open a file to start editing"
                        >
                            Open File
                        </button>
                    ) : (
                        fileName && (
                            <div className="relative">
                                {isEditing ? (
                                    <input
                                        ref={inputRef}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={handleEditComplete}
                                        onKeyDown={handleKeyDown}
                                        className="px-2 text-sm text-gray-700 font-medium bg-white border border-[#005de9] rounded focus:outline-none focus:ring-1 focus:ring-[#005de9] focus:border-transparent min-w-[120px]"
                                        placeholder="Enter file name"
                                        maxLength={20}
                                    />
                                ) : (
                                    <button
                                        onClick={handleEditStart}
                                        className="px-2 py-1 text-sm text-gray-700 font-medium hover:bg-gray-100 rounded-md cursor-text transition-colors duration-150"
                                        title="Click to rename file"
                                    >
                                        {fileName}
                                    </button>
                                )}
                            </div>
                        )
                    )}

                    {/* File upload input is managed by parent (Main) */}

                    {/* Export dropdown */}
                    <div className="relative group">
                        <button className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                            Export
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown menu */}
                        <div className="absolute left-0 w-24 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-10">
                            <div className="">
                                <button
                                    onClick={() => saveAsExcel()}
                                    disabled={exportState.isExporting}
                                    className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-md last:rounded-b-md"
                                >
                                    Excel (.xlsx)
                                </button>
                                <button
                                    onClick={() => saveAsCSV()}
                                    disabled={exportState.isExporting}
                                    className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-md last:rounded-b-md"
                                >
                                    CSV (.csv)
                                </button>
                                {/* <button
                                    onClick={onSaveAsJSON}
                                    disabled={isExporting}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    JSON (.json)
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {/* New spreadsheet */}
                    {/* <button
                        onClick={onNewSpreadsheet}
                        className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        Reset Sheet
                    </button> */}
                </div>
                
                {/* Chat button - positioned on the right with symmetric padding */}
                <div className="px-2 pr-2">
                    <button
                        className="flex items-center gap-1 px-2 py-1 text-sm text-white rounded transition-colors duration-200 h-6"
                        style={{ backgroundColor: '#005de9' }}
                        // onClick={handleToggleChat}
                    >
                        <Image src="/extion-small-white.svg" alt="Extion Logo" width={10} height={10} />
                        Extion 
                    </button>
                </div>
            </div>
            
            {/* File Upload Modal */}
            <FileUploadModal 
                isOpen={isFileUploadModalOpen}
                userId={userId} 
                onClose={handleCloseFileUploadModal}
            />
        </>
    );
};