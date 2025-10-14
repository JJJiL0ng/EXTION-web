import React, { useRef } from "react";
import { useFileState } from "@/_aaa_schema-converter/_sc-context/FileStateProvider";

export interface FileUploadProps {
    viewerType: 'source' | 'target';
}

export default function FFileUploadButton({ viewerType }: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setSourceFile, setTargetFile } = useFileState();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (viewerType === 'source') {
                setSourceFile(file);
            } else {
                setTargetFile(file);
            }
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
            />
            <button
                onClick={handleButtonClick}
                className="px-4 py-2 bg-[#005de9] text-white rounded hover:bg-[#0048b3] transition text-sm"
            >
                {viewerType === 'source' ? 'Source' : 'Target'} File Upload
            </button>
        </>
    );
}