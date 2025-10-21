'use client';

import React, { useState } from 'react';

type FileUploadState = {
  file: File | null;
  preview: string | null;
  isUploading: boolean;
};

type TwoFileUploadProps = {
  onFilesReady: (sourceFile: File, targetFile: File) => void;
};

export default function TwoFileUpload({ onFilesReady }: TwoFileUploadProps) {
  const [sourceFile, setSourceFile] = useState<FileUploadState>({
    file: null,
    preview: null,
    isUploading: false,
  });

  const [targetFile, setTargetFile] = useState<FileUploadState>({
    file: null,
    preview: null,
    isUploading: false,
  });

  // file upload logic
  const handleFileSelect = (
    file: File,
    type: 'source' | 'target'
  ) => {
    const setter = type === 'source' ? setSourceFile : setTargetFile;

    setter({
      file,
      preview: file.name,
      isUploading: false,
    });

    // TODO: Add file validation logic (CSV, Excel, etc)
    console.log(`${type} file selected:`, file.name);
  };

  //===================================================
  // drag and drop | delete handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (
    e: React.DragEvent,
    type: 'source' | 'target'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0], type);
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'source' | 'target'
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0], type);
    }
  };

  const removeFile = (type: 'source' | 'target') => {
    const setter = type === 'source' ? setSourceFile : setTargetFile;
    setter({
      file: null,
      preview: null,
      isUploading: false,
    });
  };
  //===================================================

  const handleCompare = () => {
    if (sourceFile.file && targetFile.file) {
      onFilesReady(sourceFile.file, targetFile.file);
    }
  };

  const canCompare = sourceFile.file && targetFile.file;

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Schema Converter
        </h1>
        <p className="text-gray-600">
          Upload source and target sheets to compare schemas
        </p>
      </div>

      {/* File Upload Areas */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-24 mb-4 relative">
        {/* Animated Connector: shows transformation flow from Source -> Target */}
        <div className="hidden lg:flex absolute left-1/2 top-[60%] transform -translate-x-1/2 -translate-y-1/2 items-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-3">
            {/* Animated transformation icon */}
            <div className="relative">
              {/* Main icon container */}
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-[#005De9] to-[#0048b3] text-white shadow-lg">
                {/* Left arrow (source) */}
                <div className="absolute left-2 opacity-60">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                
                {/* Center transformation arrows */}
                <svg className="w-7 h-7 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                
                {/* Right arrow (target) */}
                <div className="absolute right-2 opacity-60">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Flowing dots animation - Left side */}
              <div className="absolute top-1/2 right-full mr-2 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#005De9] animate-[ping_1.5s_ease-in-out_infinite]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#005De9] animate-[ping_1.5s_ease-in-out_0.3s_infinite]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#005De9] animate-[ping_1.5s_ease-in-out_0.6s_infinite]"></div>
              </div>
              
              {/* Flowing dots animation - Right side */}
              <div className="absolute top-1/2 left-full ml-2 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#005De9] animate-[ping_1.5s_ease-in-out_infinite]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#005De9] animate-[ping_1.5s_ease-in-out_0.3s_infinite]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#005De9] animate-[ping_1.5s_ease-in-out_0.6s_infinite]"></div>
              </div>
            </div>
            
            {/* Label with animated text */}
            <div className="flex flex-col items-center gap-1 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
              <span className="text-xs font-bold text-[#005De9] uppercase tracking-wider">Transform Schema</span>
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <span>Source</span>
                <svg className="w-3 h-3 text-[#005De9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Target</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Mobile version: vertical flow indicator */}
        <div className="lg:hidden flex justify-center -my-3 z-10">
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-b from-[#005De9] to-[#0048b3] text-white shadow-md">
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-[#005De9] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
              Transform ↓
            </span>
          </div>
        </div>
        
  {/* Source Sheet Upload */}
  <div className="space-y-3 lg:pr-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-[#005De9] rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-800">
              Source Sheet
            </h2>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'source')}
            className={`
              relative border-2 border-dashed rounded-lg p-8
              transition-all duration-200 cursor-pointer
              ${
                sourceFile.file
                  ? 'border-[#005De9] bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-[#005De9] hover:bg-blue-50'
              }
            `}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileInputChange(e, 'source')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="source-file-input"
            />

            {!sourceFile.file ? (
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-3"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <label
                    htmlFor="source-file-input"
                    className="font-medium text-[#005De9] hover:underline cursor-pointer"
                  >
                    Choose file
                  </label>
                  {' or drag and drop'}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  CSV, Excel files supported
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <svg
                    className="h-10 w-10 text-[#005De9]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {sourceFile.preview}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile('source');
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

  {/* Target Sheet Upload */}
  <div className="space-y-3 lg:pl-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3" style={{ backgroundColor: '#005De9' }} />
            <h2 className="text-lg font-semibold text-gray-800">
              Target Sheet
            </h2>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'target')}
            className={`
              relative border-2 border-dashed rounded-lg p-8
              transition-all duration-200 cursor-pointer
              ${
                targetFile.file
                  ? 'border-[#005De9] bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-[#005De9] hover:bg-blue-50'
              }
            `}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileInputChange(e, 'target')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="target-file-input"
            />

            {!targetFile.file ? (
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-3"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <label
                    htmlFor="target-file-input"
                    className="font-medium text-[#005De9] hover:underline cursor-pointer"
                  >
                    Choose file
                  </label>
                  {' or drag and drop'}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  CSV, Excel files supported
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <svg
                    className="h-10 w-10 text-[#005De9]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {targetFile.preview}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile('target');
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Display */}
      {canCompare && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[#005De9] mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">
                Files Uploaded
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium text-[#005de9]">Source:</span>{' '}
                  {sourceFile.file?.name}
                </p>
                <p>
                  <span className="font-medium text-[#005de9]">Target:</span>{' '}
                  {targetFile.file?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCompare}
          disabled={!canCompare}
          className={`
            px-8 py-3 rounded-lg font-semibold text-white
            transition-all duration-200 transform
            ${
              canCompare
                ? 'bg-[#005De9] hover:bg-[#0048b3] hover:scale-105 active:scale-95'
                : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {canCompare ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Convert Schemas
            </span>
          ) : (
            'Upload both files to convert'
          )}
        </button>
      </div>
    </div>
  );
}

