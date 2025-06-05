'use client'

import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';

interface DashFileUploadProps {
    hasUploadedFile: boolean;
    isDragOver: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DashFileUpload({
    hasUploadedFile,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    handleFileInputChange
}: DashFileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileButtonClick = () => {
        if (hasUploadedFile) {
            console.log('이미 파일이 업로드되어 새로운 파일을 업로드할 수 없습니다.');
            return;
        }
        fileInputRef.current?.click();
    };
    
    return (
        <div
            className={`w-14 h-14 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                hasUploadedFile 
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : isDragOver 
                        ? 'border-[#0052d1] bg-blue-50' 
                        : 'border-[#005DE9] bg-white hover:border-[#0052d1] hover:bg-blue-50'
            }`}
            onDragOver={hasUploadedFile ? undefined : onDragOver}
            onDragLeave={hasUploadedFile ? undefined : onDragLeave}
            onDrop={hasUploadedFile ? undefined : onDrop}
            onClick={handleFileButtonClick}
        >
            <Paperclip className={`h-5 w-5 ${
                hasUploadedFile 
                    ? 'text-gray-400' 
                    : 'text-[#005DE9] hover:text-[#0052d1]'
            }`} />
            
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
            />
        </div>
    );
}