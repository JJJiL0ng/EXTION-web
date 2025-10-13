'use client';

import React, { useState } from 'react';
import '@grapecity/spread-sheets/styles/gc.spread.sheets.excel2013white.css';
import FileSpreadSheet from './FileSpreadSheet';

export interface DualSpreadViewerProps {
  sourceFile: File;
  targetFile: File;
  onBack?: () => void;
}

export default function DualSpreadViewer({ sourceFile, targetFile, onBack }: DualSpreadViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);

  const handleLoadSuccess = () => {
    setLoadedCount(prev => {
      const newCount = prev + 1;
      console.log(`📊 Loaded ${newCount}/2 files`);
      if (newCount === 2) {
        console.log('✅ All files loaded successfully');
        setLoading(false);
      }
      return newCount;
    });
  };

  const handleLoadError = (error: any) => {
    console.error('❌ File loading error:', error);
    setError('Failed to load files. Please check the file format.');
    setLoading(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#005De9] hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Upload</span>
              </button>
            )}
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-800">Schema Comparison</h1>
          </div>

          {/* File Info */}
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#005De9]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">2 files loaded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#005De9] mb-4"></div>
            <p className="text-gray-600 font-medium">Loading spreadsheets...</p>
            <p className="text-gray-500 text-sm mt-2">Loaded {loadedCount} of 2 files</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Files</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            {onBack && (
              <button
                onClick={onBack}
                className="px-6 py-2 bg-[#005De9] text-white rounded-lg hover:bg-[#0048b3] transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dual Spread View */}
      {!error && (
        <div className="flex-1 flex overflow-hidden">
          {/* Source Sheet */}
          <div className="flex-1 flex flex-col border-r border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-3 flex items-center gap-3">
              <div className="w-3 h-3 bg-[#005De9] rounded-full shadow-sm"></div>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span>Source Sheet</span>
                <span className="text-xs text-gray-500 font-normal bg-white px-2 py-1 rounded">
                  {sourceFile.name}
                </span>
              </h2>
            </div>
            <div className="flex-1">
              <FileSpreadSheet
                file={sourceFile}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={handleLoadError}
              />
            </div>
          </div>

          {/* Target Sheet */}
          <div className="flex-1 flex flex-col">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-3 flex items-center gap-3">
              <div className="w-3 h-3 bg-[#005De9] rounded-full shadow-sm"></div>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span>Target Sheet</span>
                <span className="text-xs text-gray-500 font-normal bg-white px-2 py-1 rounded">
                  {targetFile.name}
                </span>
              </h2>
            </div>
            <div className="flex-1">
              <FileSpreadSheet
                file={targetFile}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={handleLoadError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
