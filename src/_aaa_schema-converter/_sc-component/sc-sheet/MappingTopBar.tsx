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
        <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3">
                {/* 왼쪽: 선택 영역 정보 */}
                <div className="flex items-center gap-6">
                    {/* 소스 영역 정보 */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700">소스 영역:</span>
                        <div className={`px-4 py-1.5 rounded-lg border-2 transition-all ${
                            sourceRange[2] > 1 || sourceRange[3] > 1
                                ? 'bg-green-100 border-green-400'
                                : 'bg-gray-100 border-gray-300'
                        }`}>
                            <span className="text-sm font-mono font-semibold text-gray-800">
                                {sourceRange[2]}행 × {sourceRange[3]}열
                            </span>
                        </div>
                    </div>

                    {/* 구분선 */}
                    <div className="h-8 w-px bg-gray-300"></div>

                    {/* 타겟 영역 정보 */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700">타겟 영역:</span>
                        <div className={`px-4 py-1.5 rounded-lg border-2 transition-all ${
                            targetRange[2] > 1 || targetRange[3] > 1
                                ? 'bg-green-100 border-green-400'
                                : 'bg-gray-100 border-gray-300'
                        }`}>
                            <span className="text-sm font-mono font-semibold text-gray-800">
                                {targetRange[2]}행 × {targetRange[3]}열
                            </span>
                        </div>
                    </div>

                    {/* 상태 인디케이터 */}
                    {isMappingReady && (
                        <div className="flex items-center gap-2 ml-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-700">준비 완료</span>
                        </div>
                    )}
                </div>

                {/* 오른쪽: 매핑 시작 버튼 */}
                <button
                    onClick={handleStartMapping}
                    disabled={!isMappingReady}
                    className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        isMappingReady
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:scale-105 cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isMappingReady ? '🚀 매핑 시작' : '영역을 선택하세요'}
                </button>
            </div>

            {/* 안내 메시지 */}
            {!isMappingReady && (
                <div className="px-6 pb-2">
                    <p className="text-xs text-gray-600">
                        💡 소스와 타겟 시트에서 각각 영역을 선택해주세요 (드래그하여 1행×1열보다 큰 영역 선택)
                    </p>
                </div>
            )}
        </div>
    );
};
