// components/ArtifactRenderer.tsx
'use client'

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useUnifiedStore } from '@/stores';
import { AlertCircle, Loader2, RefreshCw, Code, Layers, Cloud, HardDrive, Database } from 'lucide-react';
import * as Recharts from 'recharts';

// XLSX 데이터 타입 정의 (다중 시트 지원)
interface XlsxData {
  fileName: string;
  sheets: Array<{
    sheetName: string;
    headers: string[];
    data: string[][];
    metadata?: any;
  }>;
  activeSheetIndex: number;
}

// 단일 시트 데이터 타입
interface SheetData {
  sheetName: string;
  headers: string[];
  data: string[][];
  metadata?: any;
}

// 동적 컴포넌트 렌더링을 위한 안전한 실행 환경
const createSafeExecutionContext = () => {
  // React 및 필요한 라이브러리들을 안전하게 주입
  return {
    React,
    useState: React.useState,
    useEffect: React.useEffect,
    useMemo: React.useMemo,
    useCallback: React.useCallback,
    useRef: React.useRef,
    Fragment: React.Fragment,
    
    // Recharts 컴포넌트들을 개별적으로 추가
    ...Recharts,
    BarChart: Recharts.BarChart,
    LineChart: Recharts.LineChart,
    PieChart: Recharts.PieChart,
    ScatterChart: Recharts.ScatterChart,
    AreaChart: Recharts.AreaChart,
    XAxis: Recharts.XAxis,
    YAxis: Recharts.YAxis,
    CartesianGrid: Recharts.CartesianGrid,
    Tooltip: Recharts.Tooltip,
    Legend: Recharts.Legend,
    Bar: Recharts.Bar,
    Line: Recharts.Line,
    Pie: Recharts.Pie,
    Cell: Recharts.Cell,
    Area: Recharts.Area,
    
    console: {
      log: (...args: unknown[]) => console.log('[Artifact]', ...args),
      error: (...args: unknown[]) => console.error('[Artifact]', ...args),
      warn: (...args: unknown[]) => console.warn('[Artifact]', ...args),
    }
  };
};

// 코드 실행 및 컴포넌트 생성 - XLSX 데이터 지원으로 업데이트
const executeArtifactCode = (
  code: string, 
  xlsxData: XlsxData,
  activeSheetData: SheetData,
  allSheetsData?: Array<SheetData>,
  dataSource?: 'cloud' | 'local'
): React.ComponentType | null => {
  try {
    console.log('Executing artifact code with data:', {
      fileName: xlsxData?.fileName,
      totalSheets: xlsxData?.sheets?.length,
      activeSheet: activeSheetData?.sheetName,
      activeHeaders: activeSheetData?.headers,
      activeRowCount: activeSheetData?.data?.length,
      dataSource: dataSource || 'unknown'
    });

    // 실행 컨텍스트 생성
    const context = createSafeExecutionContext();
    
    // 코드를 함수로 래핑 - 다중 시트 데이터 지원
    const functionBody = `
      // React와 Recharts의 모든 컴포넌트를 전역으로 사용 가능하게 설정
      const React = arguments[4].React;
      const { useState, useEffect, useMemo, useCallback, useRef, Fragment } = React;
      const { 
        BarChart, LineChart, PieChart, ScatterChart, AreaChart,
        XAxis, YAxis, CartesianGrid, Tooltip, Legend,
        Bar, Line, Pie, Cell, Area
      } = arguments[4];
      
      // 다중 시트 데이터를 전역에서 사용 가능하게 설정
      const xlsxData = arguments[0];
      const activeSheetData = arguments[1];
      const allSheetsData = arguments[2] || xlsxData?.sheets || [];
      const dataSource = arguments[3] || 'unknown';
      
      // 백워드 호환성을 위한 csvData (기존 단일 시트 코드 지원)
      const csvData = {
        headers: activeSheetData?.headers || [],
        data: activeSheetData?.data || [],
        fileName: xlsxData?.fileName || 'unknown.xlsx',
        sheetName: activeSheetData?.sheetName || 'Sheet1',
        source: dataSource
      };
      
      // 시트별 데이터 접근을 위한 헬퍼 함수
      const getSheetByName = (name) => {
        return allSheetsData.find(sheet => sheet.sheetName === name);
      };
      
      const getSheetByIndex = (index) => {
        return allSheetsData[index];
      };
      
      // 데이터 소스 확인 함수
      const isCloudData = () => dataSource === 'cloud';
      const isLocalData = () => dataSource === 'local';
      
      // 백엔드 코드 실행
      ${code}
      
      // ComponentToRender가 정의되었는지 확인하고 반환
      if (typeof ComponentToRender === 'function') {
        return ComponentToRender;
      }
      
      // 만약 ComponentToRender가 없다면 다른 가능한 이름들을 확인
      const possibleNames = ['App', 'Chart', 'Dashboard', 'DataVisualization', 'Visualization', 'Component'];
      for (const name of possibleNames) {
        try {
          if (typeof eval(name) === 'function') {
            return eval(name);
          }
        } catch (e) {
          // 해당 이름이 정의되지 않았으면 계속 진행
        }
      }
      
      throw new Error('No valid React component found. Please ensure you define ComponentToRender.');
    `;

    // 함수 생성 및 실행
    const componentFactory = new Function(functionBody);
    const Component = componentFactory(xlsxData, activeSheetData, allSheetsData, dataSource, context);
    
    // 컴포넌트가 유효한지 확인
    if (typeof Component !== 'function') {
      throw new Error('Generated component is not a valid React component');
    }
    
    console.log('Component created successfully:', Component.name || 'Anonymous');
    return Component;
  } catch (error) {
    console.error('Error executing artifact code:', error);
    throw error;
  }
};

// 에러 바운더리 컴포넌트
class ArtifactErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Artifact render error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              렌더링 오류
            </h3>
            <p className="text-red-600 text-sm mb-4">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <details className="mt-4 text-left">
              <summary className="text-red-700 cursor-pointer text-sm">
                에러 스택 보기
              </summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 로딩 컴포넌트
const ArtifactLoading: React.FC = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">아티팩트를 생성하고 있습니다...</p>
    </div>
  </div>
);

// 빈 상태 컴포넌트
const ArtifactEmpty: React.FC = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
    <div className="text-center p-6">
      <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">
        아티팩트가 없습니다
      </h3>
      <p className="text-gray-500 text-sm">
        AI에게 데이터 분석이나 차트 생성을 요청해보세요
      </p>
    </div>
  </div>
);

// 메인 아티팩트 렌더 컴포넌트 (클라이언트에서만 실행)
function ArtifactRenderer() {
  const [mounted, setMounted] = useState(false);
  
  // 통합된 스토어 사용
  const {
    xlsxData,
    activeSheetData,
    extendedSheetContext,
    computedSheetData,
    artifactCode,
    loadingStates,
    errors,
    getCurrentSheetData,
    getDataForGPTAnalysis,
    currentSpreadsheetId,
    currentChatId
  } = useUnifiedStore();

  const [renderKey, setRenderKey] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 컴포넌트가 클라이언트에서 마운트된 후에만 렌더링
  useEffect(() => {
    setMounted(true);
  }, []);

  // 데이터가 변경될 때마다 렌더링 키 업데이트
  useEffect(() => {
    if (mounted && (computedSheetData || xlsxData)) {
      setRenderKey(prev => prev + 1);
      setRenderError(null);
    }
  }, [mounted, computedSheetData, xlsxData, activeSheetData]);

  // 클라우드 채팅인지 확인
  const isCloudChat = useCallback(() => {
    return !!(currentSpreadsheetId || currentChatId);
  }, [currentSpreadsheetId, currentChatId]);

  const getDataSourceInfo = useCallback(() => {
    const isCloud = isCloudChat();
    return isCloud 
      ? { type: 'cloud' as const, icon: <Cloud className="w-3 h-3" />, label: '클라우드 데이터', color: 'text-blue-600' }
      : { type: 'local' as const, icon: <Database className="w-3 h-3" />, label: '로컬 데이터', color: 'text-green-600' };
  }, [isCloudChat]);

  // 렌더링할 컴포넌트 메모이제이션
  const RenderedComponent = useMemo(() => {
    if (!mounted || !artifactCode || !xlsxData || !activeSheetData) return null;
    
    try {
      setRenderError(null);
      
      // 최신 데이터 준비 (포뮬러 계산 결과 포함)
      const currentActiveSheetData = getCurrentSheetData() || activeSheetData.data;
      
      // 활성 시트 데이터 업데이트
      const updatedActiveSheetData = {
        ...activeSheetData,
        data: currentActiveSheetData
      };
      
      // 모든 시트 데이터 준비 (computed data 포함)
      const allSheetsData = xlsxData.sheets.map((sheet, index) => {
        if (index === xlsxData.activeSheetIndex) {
          return updatedActiveSheetData;
        }
        
        // 다른 시트의 computed data도 가져오기
        const sheetComputedData = computedSheetData[index];
        if (sheetComputedData) {
          return {
            ...sheet,
            data: sheetComputedData
          };
        }
        
        return sheet;
      });
      
      // XLSX 데이터 구성
      const xlsxDataForArtifact = {
        ...xlsxData,
        sheets: allSheetsData
      };

      // 데이터 소스 정보
      const dataSource = getDataSourceInfo();
      
      console.log('Rendering artifact with data:', {
        fileName: xlsxDataForArtifact.fileName,
        totalSheets: xlsxDataForArtifact.sheets.length,
        activeSheet: updatedActiveSheetData.sheetName,
        activeHeaders: updatedActiveSheetData.headers,
        activeRowCount: updatedActiveSheetData.data.length,
        codeLength: artifactCode.code.length,
        type: artifactCode.type,
        dataSource: dataSource.type
      });
      
      // 컴포넌트 생성
      const Component = executeArtifactCode(
        artifactCode.code, 
        xlsxDataForArtifact,
        updatedActiveSheetData,
        allSheetsData,
        dataSource.type
      );
      
      if (!Component) {
        throw new Error('Failed to create component');
      }
      
      return Component;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRenderError(errorMessage);
      console.error('Failed to render artifact:', error);
      return null;
    }
  }, [mounted, artifactCode, xlsxData, activeSheetData, computedSheetData, getCurrentSheetData, getDataSourceInfo]);

  // 새로고침 핸들러
  const handleRefresh = () => {
    setRenderKey(prev => prev + 1);
    setRenderError(null);
  };

  // SSR 방지 - 마운트되지 않았으면 로딩 표시
  if (!mounted) {
    return <ArtifactLoading />;
  }

  // 로딩 상태
  if (loadingStates.artifactGeneration) {
    return <ArtifactLoading />;
  }

  // 아티팩트 코드가 없는 경우
  if (!artifactCode) {
    return <ArtifactEmpty />;
  }

  // 에러 상태
  if (errors.artifactError || renderError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-red-800">
              아티팩트 렌더링 실패
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            다시 시도
          </button>
        </div>
        <p className="text-red-600 text-sm">
          {errors.artifactError || renderError}
        </p>
        <details className="mt-4">
          <summary className="text-red-700 cursor-pointer text-sm">
            백엔드 코드 보기
          </summary>
          <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto max-h-64">
            {artifactCode?.code}
          </pre>
        </details>
      </div>
    );
  }

  const dataSource = getDataSourceInfo();

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                데이터 분석 결과
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>
                  {artifactCode.type === 'chart' && '차트 시각화'}
                  {artifactCode.type === 'table' && '테이블 분석'}
                  {artifactCode.type === 'analysis' && '데이터 분석'}
                </span>
                <span>•</span>
                <span className={`flex items-center gap-1 ${dataSource.color}`}>
                  {dataSource.icon}
                  {dataSource.label}
                </span>
                <span>•</span>
                <span>{new Date(artifactCode.timestamp).toLocaleString('ko-KR')}</span>
                {xlsxData && xlsxData.sheets.length > 1 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Layers className="w-3 h-3" />
                      <span>{xlsxData.sheets.length}개 시트</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title="아티팩트 새로고침"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            새로고침
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-6">
        <ArtifactErrorBoundary onError={(error) => setRenderError(error.message)}>
          {RenderedComponent ? (
            <div key={renderKey} className="w-full">
              <RenderedComponent />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>컴포넌트를 생성할 수 없습니다</p>
            </div>
          )}
        </ArtifactErrorBoundary>
      </div>
    </div>
  );
}

export default ArtifactRenderer;