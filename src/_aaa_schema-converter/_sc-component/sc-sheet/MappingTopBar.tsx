import React from 'react';
import { useIsMappingReady } from '@/_aaa_schema-converter/_sc-hook/useIsMappingReady';
import { useSourceSheetRangeStore } from '@/_aaa_schema-converter/_sc-store/sourceSheetRangeStore';
import { useTargetSheetRangeStore } from '@/_aaa_schema-converter/_sc-store/targetSheetRangeStore';

interface MappingTopBarProps {
    onStartMapping?: () => void;
}

export const MappingTopBar: React.FC<MappingTopBarProps> = ({ onStartMapping }) => {
    const isMappingReady = useIsMappingReady();
    const sourceRange = useSourceSheetRangeStore((state) => state.sourceRange);
    const targetRange = useTargetSheetRangeStore((state) => state.targetRange);

    const handleStartMapping = () => {
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

        if (onStartMapping) {
            onStartMapping();
        }
    };

    return (
        <div className="w-full bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
                {/* 왼쪽: 선택 영역 정보 */}
                <div className="flex items-center gap-6">
                    {/* 소스 영역 정보 */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">소스 영역:</span>
                        <div className={`px-3 py-1 rounded border transition-all ${
                            sourceRange[2] > 1 || sourceRange[3] > 1
                                ? 'bg-[#005de9]/5 border-[#005de9]/20'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <span className="text-sm font-mono text-gray-700">
                                {sourceRange[2]}행 × {sourceRange[3]}열
                            </span>
                        </div>
                    </div>

                    {/* 구분선 */}
                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* 타겟 영역 정보 */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">타겟 영역:</span>
                        <div className={`px-3 py-1 rounded border transition-all ${
                            targetRange[2] > 1 || targetRange[3] > 1
                                ? 'bg-[#005de9]/5 border-[#005de9]/20'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <span className="text-sm font-mono text-gray-700">
                                {targetRange[2]}행 × {targetRange[3]}열
                            </span>
                        </div>
                    </div>

                    {/* 상태 인디케이터 */}
                    {isMappingReady && (
                        <div className="flex items-center gap-2 ml-2">
                            <div className="w-2 h-2 bg-[#005de9] rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-[#005de9]">준비 완료</span>
                        </div>
                    )}
                </div>

                {/* 오른쪽: 매핑 시작 버튼 */}
                <button
                    onClick={handleStartMapping}
                    disabled={!isMappingReady}
                    className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                        isMappingReady
                            ? 'bg-[#005de9] text-white hover:bg-[#004bb8] shadow-sm hover:shadow cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {isMappingReady ? '매핑 시작' : '파일 업로드 후 드레그 하여 영역을 선택하세요'}
                </button>
            </div>

            {/* 안내 메시지 */}
            {!isMappingReady && (
                <div className="px-6 pb-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 pt-2">
                        소스와 타겟 시트에서 각각 영역을 선택해주세요 (드래그하여 1행×1열보다 큰 영역 선택)
                    </p>
                </div>
            )}
        </div>
    );
};
