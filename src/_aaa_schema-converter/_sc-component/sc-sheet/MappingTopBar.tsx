import React from 'react';
import { useIsMappingReady } from '@/_aaa_schema-converter/_sc-hook/useIsMappingReady';
import { useSourceSheetRangeStore } from '@/_aaa_schema-converter/_sc-store/sourceSheetRangeStore';
import { useTargetSheetRangeStore } from '@/_aaa_schema-converter/_sc-store/targetSheetRangeStore';

import { useUploadSheetAndMapping } from '@/_aaa_schema-converter/_sc-hook/useUploadSheetAndMapping';
import { useScWorkflowStore } from '@/_aaa_schema-converter/_sc-store/scWorkflowStore';

interface MappingTopBarProps {
    spreadTargetRef: any;
    spreadSourceRef: any;
    onStartMapping?: () => void;
}

export const MappingTopBar: React.FC<MappingTopBarProps> = ({ spreadSourceRef, spreadTargetRef, onStartMapping }) => {
    const isMappingReady = useIsMappingReady();
    const sourceRange = useSourceSheetRangeStore((state) => state.sourceRange);
    const targetRange = useTargetSheetRangeStore((state) => state.targetRange);
    const { uploadSheetAndMapping, isLoading } = useUploadSheetAndMapping({ spreadSourceRef, spreadTargetRef });
    const workFlowId = useScWorkflowStore((state) => state.workFlowId);

    const handleStartMapping = async () => {
        console.log('매핑 시작:', {
            sourceRange: {
                row: sourceRange[0],
                col: sourceRange[1],
                rowCount: sourceRange[2],
                colCount: sourceRange[3]
            },
            targetRange: {
                row: targetRange[0],
                col: targetRange[1],
                rowCount: targetRange[2],
                colCount: targetRange[3]
            }
        });
        await uploadSheetAndMapping();
    };

    const handleNewMapping = () => {
        window.open('/sctest', '_blank');
    };

    return (
        <div className="w-full bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
                {/* 왼쪽: 선택 영역 정보 */}
                <div className="flex items-center gap-6">
                    {/* 새 매핑하기 버튼 */}
                    <button
                        onClick={handleNewMapping}
                        className="px-2 py-1 rounded font-medium text-sm transition-all flex items-center gap-2 bg-white border-2 border-[#005de9] text-[#005de9] hover:bg-[#005de9] hover:text-white"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Mapping
                    </button>

                    {/* 구분선 */}
                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* 소스 영역 정보 */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Source Range:</span>
                        <div className={`px-3 py-1 rounded border transition-all ${
                            sourceRange[2] > 1 || sourceRange[3] > 1
                                ? 'bg-[#005de9]/5 border-[#005de9]/20'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <span className="text-sm font-mono text-gray-700">
                                {sourceRange[2]} rows × {sourceRange[3]} cols
                            </span>
                        </div>
                    </div>

                    {/* 구분선 */}
                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* 타겟 영역 정보 */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Target Range:</span>
                        <div className={`px-3 py-1 rounded border transition-all ${
                            targetRange[2] > 1 || targetRange[3] > 1
                                ? 'bg-[#005de9]/5 border-[#005de9]/20'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <span className="text-sm font-mono text-gray-700">
                                {targetRange[2]} rows × {targetRange[3]} cols
                            </span>
                        </div>
                    </div>

                    {/* 상태 인디케이터 */}
                    {isMappingReady && (
                        <div className="flex items-center gap-2 ml-2">
                            <div className="w-2 h-2 bg-[#005de9] rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-[#005de9]">Ready</span>
                        </div>
                    )}
                </div>

                {/* 오른쪽: 매핑 시작 버튼 */}
                {!workFlowId && (
                    <button
                        onClick={handleStartMapping}
                        disabled={!isMappingReady || isLoading}
                        className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                            isLoading
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : isMappingReady
                                ? 'bg-[#005de9] text-white hover:bg-[#004bb8] shadow-sm hover:shadow cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isLoading && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Mapping...' : isMappingReady ? 'Start Mapping' : 'Upload files and drag to select ranges'}
                    </button>
                )}
            </div>

            {/* 안내 메시지 */}
            {!isMappingReady && (
                <div className="px-6 pb-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 pt-2">
                        Please select ranges in both source and target sheets (drag to select an area larger than 1 row × 1 column)
                    </p>
                </div>
            )}
        </div>
    );
};
