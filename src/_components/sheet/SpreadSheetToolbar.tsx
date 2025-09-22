import React from 'react';
import Image from 'next/image';

interface SpreadSheetToolbarProps {
    // Export related
    onSaveAsExcel: () => void;
    onSaveAsCSV: () => void;
    onSaveAsJSON: () => void;
    isExporting: boolean;

    // New spreadsheet
    onNewSpreadsheet: () => void;

    // (Optional) Upload related - currently managed by parent (Main)
    onFileUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading?: boolean;
}

/**
 * Spreadsheet top toolbar component
 */
export const SpreadSheetToolbar: React.FC<SpreadSheetToolbarProps> = ({
    onSaveAsExcel,
    onSaveAsCSV,
    onSaveAsJSON,
    isExporting,
    onNewSpreadsheet
}) => {
    return (
        <div className="w-full h-6 bg-white flex items-center px-2 box-border">
            <div className="flex items-center space-x-6">
                {/* Home */}
                <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="px-2 pl-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                >
                    <Image src="/EXTION_new_logo.svg" alt="Logo" width={16} height={16} />
                </button>

                <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                    Home
                </button>

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
                    <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-10">
                        <div className="py-1">
                            <button
                                onClick={onSaveAsExcel}
                                disabled={isExporting}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Excel (.xlsx)
                            </button>
                            <button
                                onClick={onSaveAsCSV}
                                disabled={isExporting}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
    );
};